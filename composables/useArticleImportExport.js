import axios from 'axios'
import { useRouter } from 'vue-router'
import { siteConfig } from '@/site.config.js'
import { withLoading } from './useLoading.js'

export function useArticleImportExport() {
    const API_BASE = siteConfig.apiUrl
    const router = useRouter()

    function ensureKey() {
        const key = localStorage.getItem('api_key')
        if (!key) {
            localStorage.removeItem('admin_verified')
            router.push('/verify')
            throw new Error('API key missing, redirecting to verify page')
        }
        return key
    }

    // 获取全部文章
    const exportAllArticles = async (pageSize = 5) => {
        try {
            const key = ensureKey()

            // 先请求第一页
            const firstRes = await withLoading(
                () => axios.get(`${API_BASE}/api/article/all`, {
                    params: { page: 1, pageSize },
                    headers: { 'x-api-key': key }
                }),
                '正在加载第 1 页...'
            )()
            const firstBody = firstRes.data
            if (!firstBody || !Array.isArray(firstBody.data)) return { data: [], page: 1, pageSize, total: 0, totalPages: 0 }

            const all = [...firstBody.data]
            const total = firstBody.total ?? all.length
            const totalPages = firstBody.totalPages ?? Math.ceil(total / pageSize)

            if (totalPages <= 1) {
                return { data: all, page: 1, pageSize, total, totalPages }
            }

            // 请求剩余页
            for (let p = 2; p <= totalPages; p++) {
                const res = await withLoading(
                    () => axios.get(`${API_BASE}/api/article/all`, {
                        params: { page: p, pageSize },
                        headers: { 'x-api-key': key }
                    }),
                    `正在加载第 ${p} 页...`
                )()
                const body = res.data
                if (body && Array.isArray(body.data) && body.data.length > 0) {
                    all.push(...body.data)
                } else {
                    break
                }
            }

            return { data: all, page: 1, pageSize, total, totalPages }
        } catch (err) {
            handleError(err)
            return null
        }
    }

    // 通用错误处理
    function handleError(err) {
        if (err.response) {
            const { status } = err.response
            if (status === 401) {
                alert('API Key 错误或已过期，请重新验证')
                localStorage.removeItem('api_key')
                localStorage.removeItem('admin_verified')
                router.push('/verify')
            } else if (status === 404) {
                alert('文章不存在，请检查 slug 是否正确')
            } else if (status === 409) {
                alert('slug 已存在，请更换后重试')
            } else if (status === 429) {
                alert('错误次数过多，IP 已封禁十年')
            } else if (status === 400) {
                alert('slug 是必填项，请检查后重试')
            } else {
                alert('操作失败，请稍后重试')
            }
        } else {
            console.error(err)
            alert('网络错误或服务器异常')
        }
    }

    // 导出为 Markdown 文件
    const exportToMarkdown = async () => {
        try {
            const result = await exportAllArticles(10)
            if (!result || !result.data || result.data.length === 0) {
                alert('没有文章可以导出')
                return
            }

            // 导入 JSZip
            const JSZip = (await import('jszip')).default
            const zip = new JSZip()

            result.data.forEach(article => {
                // 生成tags的YAML列表
                const tagsArray = article.tags || []
                let tagsYaml = 'tags:\n'
                if (tagsArray.length === 0) {
                    tagsYaml += '  - 未指定标签\n'
                } else {
                    tagsYaml += tagsArray.map(tag => `  - ${tag}`).join('\n')
                }

                const frontmatter = `---
title: "${article.title || '无标题'}"
slug: "${article.slug || Math.random().toString(36).substring(2, 8)}"
date: ${article.date || new Date().toISOString().split('T')[0]}
description: "${article.description || '暂无描述'}"
${tagsYaml}
published: ${article.published !== undefined ? article.published : false}
---

`

                const content = frontmatter + (article.content || '')
                
                zip.file(`${article.slug || Math.random().toString(36).substring(2, 8)}.md`, content)
            })

            // 生成zip并下载
            const zipBlob = await zip.generateAsync({ type: 'blob' })
            const url = URL.createObjectURL(zipBlob)
            const link = document.createElement('a')
            link.href = url
            link.download = `exportArticles-${Date.now()}.zip`
            document.body.appendChild(link)
            link.click()
            document.body.removeChild(link)
            URL.revokeObjectURL(url)

            return { success: true }
        } catch (err) {
            console.error('导出失败:', err)
            alert('导出失败，请稍后重试')
            return null
        }
    }

    // 导出为 JSON 文件
    const exportToJSON = async () => {
        try {
            const result = await exportAllArticles(10)
            if (!result || !result.data || result.data.length === 0) {
                alert('没有文章可以导出')
                return
            }

            const jsonData = JSON.stringify(result.data, null, 2)
            const blob = new Blob([jsonData], { type: 'application/json' })
            const url = URL.createObjectURL(blob)
            const link = document.createElement('a')
            link.href = url
            link.download = `exportArticles-${Date.now()}.json`
            document.body.appendChild(link)
            link.click()
            document.body.removeChild(link)
            URL.revokeObjectURL(url)

            return { success: true }
        } catch (err) {
            console.error('导出JSON失败:', err)
            alert('导出JSON失败，请稍后重试')
            return null
        }
    }

    // 导出为加密文件
    const exportToEncrypted = async () => {
        try {
            const result = await exportAllArticles(10)
            if (!result || !result.data || result.data.length === 0) {
                alert('没有文章可以导出')
                return
            }

            // 使用key进行加密
            const key = ensureKey()

            const jsonData = JSON.stringify(result.data)

            const encryptedData = xorEncrypt(jsonData, key)
            
            // 创建加密文件
            const blob = new Blob([encryptedData], { type: 'application/octet-stream' })
            const url = URL.createObjectURL(blob)
            const link = document.createElement('a')
            link.href = url
            link.download = `exportArticles-${Date.now()}`
            document.body.appendChild(link)
            link.click()
            document.body.removeChild(link)
            URL.revokeObjectURL(url)

            return { success: true }
        } catch (err) {
            console.error('导出加密文件失败:', err)
            alert('导出加密文件失败，请稍后重试')
            return null
        }
    }

    // XOR加密函数
    const xorEncrypt = (text, key) => {
        // 将字符串转换为UTF-8字节数组
        const textBytes = new TextEncoder().encode(text)
        const keyBytes = new TextEncoder().encode(key)
        
        // 加密
        const encryptedBytes = textBytes.map((byte, i) => byte ^ keyBytes[i % keyBytes.length])
        
        // 转换为Base64
        return btoa(String.fromCharCode(...encryptedBytes))
    }

    return {
        exportAllArticles,
        exportToMarkdown,
        exportToJSON,
        exportToEncrypted
    }
}