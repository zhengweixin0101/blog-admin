import CryptoJS from 'crypto-js'
import { S3Client, ListObjectsV2Command, DeleteObjectCommand } from '@aws-sdk/client-s3'
import { Upload } from "@aws-sdk/lib-storage"

export function useS3({ config, apiKey, onProgress } = {}) {
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

    // 上传文件
    async function uploadFiles({ files, cfg = config, prefix = '', customDomain = '', onProgressCb = onProgress }) {
        if (!files || files.length === 0) return []
        const client = getS3Client(cfg)
        const uploadedUrls = []

        if (prefix && !prefix.endsWith('/')) prefix += '/'

        for (const file of files) {
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