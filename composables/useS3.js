import CryptoJS from 'crypto-js'
import { S3Client, ListObjectsV2Command, DeleteObjectCommand } from '@aws-sdk/client-s3'
import { Upload } from "@aws-sdk/lib-storage"
import { siteConfig } from '@/site.config.js'
import { confirm } from '@/composables/useModal'

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
    
    // 显示图片对比弹窗
    async function showImageComparison(originalFile, compressedResult) {
        return new Promise((resolve) => {
            // 保存当前滚动位置和样式
            const scrollY = window.scrollY
            const originalOverflow = document.body.style.overflow
            const originalPosition = document.body.style.position
            
            // 禁用页面滚动
            document.body.style.overflow = 'hidden'
            document.body.style.position = 'fixed'
            document.body.style.top = `-${scrollY}px`
            document.body.style.width = '100%'
            
            // 创建弹窗容器
            const modalContainer = document.createElement('div')
            modalContainer.className = 'fixed inset-0 bg-black/40 flex items-center justify-center'
            modalContainer.style.zIndex = '99999'
            document.body.appendChild(modalContainer)
            
            // 创建弹窗内容
            const modalContent = document.createElement('div')
            modalContent.className = 'bg-white rounded-lg shadow-lg p-6 w-96 max-w-lg relative'
            
            const originalUrl = URL.createObjectURL(originalFile)
            const compressedUrl = URL.createObjectURL(compressedResult.file)
            let originalDimensions = '加载中...'
            let compressedDimensions = '加载中...'
            
            function formatFileSize(bytes) {
                if (bytes === 0) return '0 Bytes'
                const k = 1024
                const sizes = ['Bytes', 'KB', 'MB', 'GB']
                const i = Math.floor(Math.log(bytes) / Math.log(k))
                return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
            }
            
            function getImageDimensions(file, callback) {
                const img = new Image()
                img.onload = () => {
                    callback(`${img.width} × ${img.height}`)
                }
                img.onerror = () => {
                    callback('未知')
                }
                img.src = URL.createObjectURL(file)
            }
            
            // 获取图片尺寸
            getImageDimensions(originalFile, (dims) => {
                originalDimensions = dims
                updateDimensionsDisplay()
            })
            getImageDimensions(compressedResult.file, (dims) => {
                compressedDimensions = dims
                updateDimensionsDisplay()
            })
            
            function updateDimensionsDisplay() {
                const originalDimEl = modalContent.querySelector('#original-dimensions')
                const compressedDimEl = modalContent.querySelector('#compressed-dimensions')
                if (originalDimEl) originalDimEl.textContent = originalDimensions
                if (compressedDimEl) compressedDimEl.textContent = compressedDimensions
            }
            
            modalContent.innerHTML = `
                <div>
                    <div class="flex justify-between items-center">
                        <h2 class="text-lg font-bold text-center flex-1">上传图片</h2>
                        <button id="close-btn" class="absolute top-2 right-3 bg-transparent border-none text-lg text-gray-400 hover:text-gray-600 cursor-pointer">
                            ✕
                        </button>
                    </div>
                    
                    <div>
                        <p class="text-sm text-gray-600 mb-2 truncate" title="${originalFile.name}">文件名：${originalFile.name}</p>
                        <div class="flex gap-3 text-sm bg-blue-50 p-2 rounded">
                            <div class="flex-1">
                                <p class="font-semibold text-blue-800">原图</p>
                                <p>大小：${formatFileSize(originalFile.size)}</p>
                                <p>尺寸：<span id="original-dimensions">${originalDimensions}</span></p>
                            </div>
                            <div class="flex-1">
                                <p class="font-semibold text-green-800">压缩后</p>
                                <p>大小：${formatFileSize(compressedResult.compressedSize)}</p>
                                <p>尺寸：<span id="compressed-dimensions">${compressedDimensions}</span></p>
                            </div>
                        </div>
                        <!-- p class="text-green-600 text-sm font-semibold">压缩率：${compressedResult.compressionRatio.toFixed(1)}%</p -->
                    </div>

                    <div class="flex mt-3 mb-6 justify-center">
                        <div class="flex-1 max-w-[160px]">
                            <div class="overflow-hidden h-32 flex items-center justify-center">
                                <img src="${originalUrl}" alt="原图" style="max-width: 160px; max-height: 128px; width: auto; height: auto; object-fit: contain;" />
                            </div>
                        </div>
                        <div class="flex-1 max-w-[160px]">
                            <div class="overflow-hidden h-32 flex items-center justify-center">
                                <img src="${compressedUrl}" alt="压缩后" style="max-width: 160px; max-height: 128px; width: auto; height: auto; object-fit: contain;" />
                            </div>
                        </div>
                    </div>

                    <div class="flex gap-2 justify-end">
                        <button id="original-btn" class="px-4 py-2 bg-gray-400 text-white rounded hover:bg-gray-500 transition border-none rounded cursor-pointer">
                            使用原图
                        </button>
                        <button id="confirm-btn" class="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition border-none rounded cursor-pointer">
                            使用压缩图
                        </button>
                    </div>
                </div>
            `
            
            modalContainer.appendChild(modalContent)
            
            // 绑定事件
            document.getElementById('confirm-btn').onclick = () => {
                cleanup()
                resolve({ action: 'compress', file: compressedResult.file })
            }
            
            document.getElementById('original-btn').onclick = () => {
                cleanup()
                resolve({ action: 'skip', file: originalFile })
            }

            document.getElementById('close-btn').onclick = () => {
                cleanup()
                resolve({ action: 'cancel', file: originalFile })
            }
            

            
            function cleanup() {
                URL.revokeObjectURL(originalUrl)
                URL.revokeObjectURL(compressedUrl)
                document.body.removeChild(modalContainer)
                
                // 恢复页面滚动
                document.body.style.overflow = originalOverflow
                document.body.style.position = originalPosition
                document.body.style.top = ''
                document.body.style.width = ''
                
                // 恢复滚动位置
                window.scrollTo(0, scrollY)
            }
        })
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
            
            // 显示对比弹窗
            const choice = await showImageComparison(file, compressedResult)
            
            return choice
            
        } catch (error) {
            console.error('压缩失败:', error)
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
                // 跳过该文件继续处理其他文件
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