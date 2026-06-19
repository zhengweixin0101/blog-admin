import { S3Client, ListObjectsV2Command, DeleteObjectCommand } from '@aws-sdk/client-s3'
import { Upload } from "@aws-sdk/lib-storage"
import { siteConfig } from '@/site.config.js'
import { confirm } from '@/composables/useModal'
import { useErrorHandler } from './useErrorHandler.js'

export function useS3({ config, onProgress } = {}) {
    const { handleError } = useErrorHandler()
    // 获取压缩配置
    const compressionConfig = siteConfig.imageCompression || {
        enabled: false,
        quality: 0.85,
        maxWidth: 1920,
        minSize: 80 * 1024
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

    // 列出文件
    async function listFiles({ prefix = '', cfg = config } = {}) {
        try {
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
        } catch (error) {
            await handleError(error, {
                showAlert: false,
                onError: () => console.error('S3 listFiles error:', error)
            })
            return []
        }
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

    // 显示图片对比弹窗
    async function showImageComparison(originalFile, compressedResult) {
        return await window.showImageComparisonDialog(originalFile, compressedResult)
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
            // 先进行压缩
            const compressedResult = await compressImage(file)
            
            // 检查压缩后大小
            if (compressedResult.compressedSize >= file.size) {
                return { action: 'skip', file }
            }
            
            // 显示对比弹窗
            const choice = await showImageComparison(file, compressedResult)
            
            return choice

        } catch (error) {
            const useOriginal = await confirm(`文件 "${file.name}" 压缩失败，是否使用原文件上传？

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
                continue
            }
            processedFiles.push(result.file)
        }

        if (processedFiles.length === 0) {
            return []
        }

        try {
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
        } catch (error) {
            await handleError(error, {
                showAlert: true,
                onError: () => console.error('S3 uploadFiles error:', error)
            })
            return []
        }
    }

    // 测试连接
    async function testConnection({ cfg = config }) {
        try {
            const client = getS3Client(cfg)
            // 尝试列出存储桶中的文件来测试连接
            await client.send(new ListObjectsV2Command({ Bucket: cfg.bucket, MaxKeys: 1 }))
            return { 
                success: true, 
                message: 'S3 连接测试成功！' 
            }
        } catch (error) {
            let errorMessage = 'S3 连接测试失败：'
            
            // 根据错误类型提供更具体的错误信息
            if (error.name === 'NoSuchBucket') {
                errorMessage += '存储桶不存在'
            } else if (error.name === 'InvalidAccessKeyId') {
                errorMessage += 'Access Key ID 无效'
            } else if (error.name === 'SignatureDoesNotMatch') {
                errorMessage += 'Access Key Secret 无效'
            } else if (error.name === 'NetworkingError') {
                errorMessage += '网络连接失败，请检查 Endpoint 地址'
            } else if (error.name === 'Forbidden') {
                errorMessage += '权限不足，请检查访问权限配置'
            } else {
                errorMessage += error.message || '未知错误'
            }
            
            return { 
                success: false, 
                error: errorMessage 
            }
        }
    }

    // 删除文件
    async function deleteFile({ fileKey, cfg = config }) {
        try {
            const client = getS3Client(cfg)
            await client.send(new DeleteObjectCommand({ Bucket: cfg.bucket, Key: fileKey }))
            return { success: true }
        } catch (error) {
            await handleError(error, {
                showAlert: false,
                onError: () => console.error('S3 deleteFile error:', error)
            })
            return { success: false }
        }
    }

    return {
        getS3Client,
        listFiles,
        uploadFiles,
        deleteFile,
        testConnection
    }
}