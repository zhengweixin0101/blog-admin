import CryptoJS from 'crypto-js'
import { S3Client, ListObjectsV2Command, DeleteObjectCommand } from '@aws-sdk/client-s3'
import { Upload } from "@aws-sdk/lib-storage"
import { siteConfig } from '@/site.config.js'

export function useS3({ config, apiKey, onProgress } = {}) {
    // 获取压缩配置
    const compressionConfig = siteConfig.imageCompression || {
        enabled: false,
        quality: 0.85,
        maxWidth: 1920,
        minSize: 80 * 1024
    }

    // 加密配置
    function encryptConfig(configObj) {
        if (!apiKey) {
            console.warn('缺少 api_key！')
            return null
        }
        return CryptoJS.AES.encrypt(JSON.stringify(configObj), apiKey).toString()
    }

    // 解密配置
    function decryptConfig(cipherText) {
        if (!apiKey) {
            console.warn('缺少 api_key！')
            return {}
        }
        try {
            const bytes = CryptoJS.AES.decrypt(cipherText, apiKey)
            return JSON.parse(bytes.toString(CryptoJS.enc.Utf8))
        } catch (e) {
            console.error('加载失败：', e)
            return {}
        }
    }

    // S3 客户端
    function getS3Client(cfg = config) {
        return new S3Client({
            region: cfg.region,
            endpoint: cfg.endpoint,
            credentials: {
                accessKeyId: cfg.accessKeyId,
                secretAccessKey: cfg.secretAccessKey
            }
        })
    }

    // 测试并保存配置
    async function saveConfig(cfg) {
        const client = getS3Client(cfg)
        await client.send(new ListObjectsV2Command({ Bucket: cfg.bucket, MaxKeys: 1 }))
        const encrypted = encryptConfig(cfg)
        if (!encrypted) throw new Error('缺少 api_key！')
        localStorage.setItem('s3_config', encrypted)
        return true
    }

    // 列出文件
    async function listFiles({ prefix = '', cfg = config } = {}) {
        const client = getS3Client(cfg)
        const res = await client.send(
            new ListObjectsV2Command({ Bucket: cfg.bucket, Prefix: prefix })
        )
        return (res.Contents || [])
            .map(f => ({
                key: f.Key,
                size: f.Size,
                lastModified: f.LastModified,
                timestamp: f.LastModified ? new Date(f.LastModified).getTime() : 0
            }))
            .sort((a, b) => b.timestamp - a.timestamp)
    }

    // 压缩图片
    async function compressImage(file) {
        const { quality, maxWidth } = compressionConfig
        return new Promise((resolve, reject) => {
            const reader = new FileReader()
            reader.onload = (e) => {
                const img = new Image()
                img.onload = () => {
                    const canvas = document.createElement('canvas')
                    const ctx = canvas.getContext('2d')
                    
                    // 计算新尺寸
                    let { width, height } = img
                    if (width > maxWidth) {
                        const ratio = maxWidth / width
                        width = maxWidth
                        height = height * ratio
                    }
                    
                    canvas.width = width
                    canvas.height = height
                    
                    // 绘制图片
                    ctx.drawImage(img, 0, 0, width, height)
                    
                    // 转换为压缩后的文件
                    canvas.toBlob((blob) => {
                        if (!blob) {
                            reject(new Error('图片压缩失败'))
                            return
                        }
                        
                        const compressedFile = new File([blob], file.name, {
                            type: 'image/jpeg',
                            lastModified: Date.now()
                        })
                        
                        resolve({
                            file: compressedFile,
                            originalSize: file.size,
                            compressedSize: blob.size,
                            compressionRatio: (1 - blob.size / file.size) * 100
                        })
                    }, 'image/jpeg', quality)
                }
                img.onerror = () => reject(new Error('图片加载失败'))
                img.src = e.target.result
            }
            reader.onerror = () => reject(new Error('文件读取失败'))
            reader.readAsDataURL(file)
        })
    }
    
    // 格式化文件大小
    function formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes'
        const k = 1024
        const sizes = ['Bytes', 'KB', 'MB', 'GB']
        const i = Math.floor(Math.log(bytes) / Math.log(k))
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
    }
    
    // 处理单个文件的压缩流程
    async function processFileCompression(file) {
        if (!compressionConfig.enabled) {
            return { action: 'skip', file }
        }
        
        // 只对图片文件进行压缩
        if (!file.type.startsWith('image/')) {
            return { action: 'skip', file }
        }
        
        // 小文件不压缩
        if (file.size < compressionConfig.minSize) {
            return { action: 'skip', file }
        }
        
        try {
            // 询问用否要压缩
            const shouldCompress = confirm(`文件 "${file.name}" 大小为 ${formatFileSize(file.size)}，是否进行压缩？

压缩可以减小文件大小，但可能会降低图片质量。（取消则上传原图）`)
            
            if (!shouldCompress) {
                return { action: 'skip', file }
            }
            
            // 进行压缩
            const compressedResult = await compressImage(file)
            
            // 显示压缩结果并询问用户
            const message = `文件 "${file.name}" 压缩完成：
原文件大小: ${formatFileSize(compressedResult.originalSize)}
压缩后大小: ${formatFileSize(compressedResult.compressedSize)}
压缩率: ${compressedResult.compressionRatio.toFixed(1)}%

请选择操作：`
            const userChoice = confirm(`${message}
点击"确定"使用压缩版本，点击"取消"取消上传该文件`)
            
            if (userChoice) {
                return { action: 'compress', file: compressedResult.file }
            } else {
                return { action: 'cancel', file }
            }
            
        } catch (error) {
            console.error('压缩失败:', error)
            const useOriginal = confirm(`文件 "${file.name}" 压缩失败，是否使用原文件上传？

点击"确定"使用原文件上传，点击"取消"取消上传该文件`)
            
            if (useOriginal) {
                return { action: 'skip', file }
            } else {
                return { action: 'cancel', file }
            }
        }
    }

    // 上传文件
    async function uploadFiles({ files, cfg = config, prefix = '', customDomain = '', onProgressCb = onProgress }) {
        if (!files || files.length === 0) return []
        
        // 处理文件压缩
        const processedFiles = []
        
        for (const file of files) {
            const result = await processFileCompression(file)
            if (result.action === 'cancel') {
                // 用户取消单个文件，跳过该文件继续处理其他文件
                continue
            }
            if (result.action !== 'cancel') {
                processedFiles.push(result.file)
            }
        }
        
        if (processedFiles.length === 0) {
            return []
        }
        
        const client = getS3Client(cfg)
        const uploadedUrls = []

        if (prefix && !prefix.endsWith('/')) prefix += '/'

        for (const file of processedFiles) {
            const ext = file.name.substring(file.name.lastIndexOf('.')) || ''
            const timestamp = Date.now()
            const randomId = crypto.randomUUID().replace(/-/g, '')
            const key = `${prefix}${timestamp}_${randomId}${ext}`
            const url = `${customDomain}${key}`

            const parallelUpload = new Upload({
                client,
                params: {
                    Bucket: cfg.bucket,
                    Key: key,
                    Body: file,
                    ContentType: file.type
                }
            })
            parallelUpload.on("httpUploadProgress", (progress) => {
                onProgressCb && onProgressCb(file.name, Math.round((progress.loaded / progress.total) * 100))
            })
            await parallelUpload.done()
            uploadedUrls.push(url)
        }
        return uploadedUrls
    }

    // 删除文件
    async function deleteFile({ fileKey, cfg = config }) {
        const client = getS3Client(cfg)
        await client.send(new DeleteObjectCommand({ Bucket: cfg.bucket, Key: fileKey }))
        return true
    }

    return {
        encryptConfig,
        decryptConfig,
        getS3Client,
        saveConfig,
        listFiles,
        uploadFiles,
        deleteFile
    }
}