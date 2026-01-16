import axios from 'axios'
import { useRouter } from 'vue-router'
import { siteConfig } from '@/site.config.js'
import { withLoading } from './useLoading.js'
import { useToken } from './useToken.js'

export function useArticleImportExport() {
    const API_BASE = siteConfig.apiUrl
    const router = useRouter()
    const { getToken, clearAuthData } = useToken()

    function ensureKey() {
        const key = getToken()
        if (!key) {
            clearAuthData()
            router.push('/login')
            throw new Error('Token missing, redirecting to login page')
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
                    headers: { 'Authorization': `Bearer ${key}` }
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
                        headers: { 'Authorization': `Bearer ${key}` }
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
                alert('登录已过期，请重新登录')
                clearAuthData()
                router.push('/login')
            } else if (status === 404) {
                alert('文章不存在，请检查 slug 是否正确')
            } else if (status === 409) {
                alert('slug 已存在，请更换后重试')
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

    // 解析 Markdown frontmatter
    const parseFrontmatter = (content) => {
        const frontmatterRegex = /^---\s*\n([\s\S]*?)\n---\s*\n([\s\S]*)$/
        const match = content.match(frontmatterRegex)
        
        if (!match) {
            return null
        }
        
        const frontmatterText = match[1]
        const articleContent = match[2]
        
        // 解析 frontmatter
        const frontmatter = {}
        const lines = frontmatterText.split('\n')
        
        for (const line of lines) {
            const colonIndex = line.indexOf(':')
            if (colonIndex > 0) {
                const key = line.substring(0, colonIndex).trim()
                let value = line.substring(colonIndex + 1).trim()
                
                // 移除引号
                if ((value.startsWith('"') && value.endsWith('"')) || 
                    (value.startsWith("'") && value.endsWith("'"))) {
                    value = value.slice(1, -1)
                }
                
                // 处理布尔值
                if (value === 'true') value = true
                if (value === 'false') value = false
                
                // 处理数组（tags）
                if (key === 'tags') {
                    const tags = []
                    const tagLines = frontmatterText.split('\n').filter(l => l.trim().startsWith('-'))
                    for (const tagLine of tagLines) {
                        const tag = tagLine.trim().substring(1).trim()
                        if (tag) tags.push(tag)
                    }
                    frontmatter[key] = tags
                } else {
                    frontmatter[key] = value
                }
            }
        }
        
        return {
            ...frontmatter,
            content: articleContent.trim()
        }
    }

    // 从 Markdown ZIP 压缩包导入
    const importFromMarkdownZip = async (zipFile) => {
        try {
            // 导入 JSZip
            const JSZip = (await import('jszip')).default
            const zip = await JSZip.loadAsync(zipFile)
            
            let successCount = 0
            let failCount = 0
            const results = []
            
            // 遍历 ZIP 中的所有文件
            for (const [filename, file] of Object.entries(zip.files)) {
                // 只处理 .md 和 .markdown 文件
                if (filename.endsWith('.md') || filename.endsWith('.markdown')) {
                    if (file.dir) continue
                    
                    try {
                        const text = await file.async('text')
                        const parsed = parseFrontmatter(text)
                        
                        if (!parsed) {
                            console.warn(`无法解析 ${filename} 的 frontmatter`)
                            failCount++
                            results.push({ success: false, error: '无法解析 frontmatter', filename })
                            continue
                        }
                        
                        // 验证必填字段
                        if (!parsed.slug) {
                            console.warn(`${filename} 缺少 slug 字段`)
                            failCount++
                            results.push({ success: false, error: '缺少 slug 字段', filename })
                            continue
                        }
                        
                        // 调用 API 创建文章
                        const key = ensureKey()
                        const res = await withLoading(
                            () => axios.post(`${API_BASE}/api/article/add`, parsed, {
                                headers: { 'Authorization': `Bearer ${key}` }
                            }),
                            `正在导入: ${filename}...`
                        )()
                        
                        successCount++
                        results.push({ success: true, data: res.data, filename })
                    } catch (err) {
                        console.error(`导入 ${filename} 失败:`, err)
                        failCount++
                        results.push({ success: false, error: err.message, filename })
                    }
                }
            }
            
            if (successCount === 0 && failCount === 0) {
                alert('压缩包中没有找到 Markdown 文件')
                return null
            }
            
            return { success: true, successCount, failCount, results }
        } catch (err) {
            console.error('解压 ZIP 文件失败:', err)
            alert('无法解压 ZIP 文件，请检查文件是否损坏')
            return null
        }
    }

    // 从 Markdown 文件导入
    const importFromMarkdown = async (file) => {
        try {
            const text = await file.text()
            const parsed = parseFrontmatter(text)
            
            if (!parsed) {
                alert('无法解析 Markdown 文件的 frontmatter')
                return null
            }
            
            // 验证必填字段
            if (!parsed.slug) {
                alert('Markdown 文件缺少 slug 字段')
                return null
            }
            
            // 调用 API 创建文章
            const key = ensureKey()
            const res = await withLoading(
                () => axios.post(`${API_BASE}/api/article/add`, parsed, {
                    headers: { 'Authorization': `Bearer ${key}` }
                }),
                '导入 Markdown 文章中...'
            )()
            
            return { success: true, data: res.data }
        } catch (err) {
            handleError(err)
            return null
        }
    }

    // 从 JSON 文件导入
    const importFromJSON = async (file) => {
        try {
            const text = await file.text()
            const articles = JSON.parse(text)
            
            // 确保是数组
            const articlesArray = Array.isArray(articles) ? articles : [articles]
            
            if (articlesArray.length === 0) {
                alert('JSON 文件中没有文章数据')
                return null
            }
            
            const key = ensureKey()
            const results = []
            
            for (const article of articlesArray) {
                try {
                    // 验证必填字段
                    if (!article.slug) {
                        console.warn('跳过没有 slug 的文章:', article.title || '无标题')
                        continue
                    }
                    
                    const res = await withLoading(
                        () => axios.post(`${API_BASE}/api/article/add`, article, {
                            headers: { 'Authorization': `Bearer ${key}` }
                        }),
                        `导入文章: ${article.title || article.slug}...`
                    )()
                    
                    results.push({ success: true, data: res.data, slug: article.slug })
                } catch (err) {
                    console.error(`导入文章 ${article.slug} 失败:`, err)
                    results.push({ success: false, error: err.message, slug: article.slug })
                }
            }
            
            const successCount = results.filter(r => r.success).length
            const failCount = results.length - successCount
            
            if (failCount > 0) {
                alert(`导入完成！成功 ${successCount} 篇，失败 ${failCount} 篇。请查看控制台了解详情。`)
            } else {
                alert(`导入成功！共导入 ${successCount} 篇文章。`)
            }
            
            return { success: true, results }
        } catch (err) {
            if (err instanceof SyntaxError) {
                alert('JSON 文件格式错误，请检查文件内容')
            } else {
                handleError(err)
            }
            return null
        }
    }

    return {
        exportAllArticles,
        exportToMarkdown,
        exportToJSON,
        importFromMarkdown,
        importFromMarkdownZip,
        importFromJSON
    }
}