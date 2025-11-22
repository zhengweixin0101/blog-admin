import { ref } from 'vue'
import axios from 'axios'
import { useRouter } from 'vue-router'
import { siteConfig } from '@/site.config.js'
import { withLoading } from './useLoading.js'

export function useArticles() {
    const API_BASE = siteConfig.apiUrl
    const articles = ref([])
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

    // 获取文章列表
    const getList = async () => {
        const res = await withLoading(
            () => axios.get(`${API_BASE}/api/article/list?posts=all`),
            '加载文章列表中...'
        )()
        articles.value = res.data.map(article => ({
            slug: article.slug,
            title: article.title || '无标题',
            date: article.date || '未指定日期',
            description: article.description || '暂无描述',
            tags: article.tags || ['未指定标签'],
            published: article.published !== undefined ? article.published : false
        }))
    }

    // 获取文章内容
    const getArticle = async (slug) => {
        const res = await withLoading(
            () => axios.get(`${API_BASE}/api/article/get`, { params: { slug } }),
            '加载文章内容中...'
        )()
        return res.data
    }

    // 新建文章
    const addArticle = async (article) => {
        try {
            const key = ensureKey()
            const res = await withLoading(
                () => axios.post(`${API_BASE}/api/article/add`, article, {
                    headers: { 'x-api-key': key }
                }),
                '创建文章中...'
            )()
            return res.data
        } catch (err) {
            handleError(err)
            return null
        }
    }

    // 更新文章
    const editArticle = async (article) => {
        if (!article.slug) return alert('缺少 slug，无法更新文章'), null

        const payload = { slug: article.slug }
        if (article.title) payload.title = article.title
        if (article.content) payload.content = article.content
        if (article.date) payload.date = article.date
        if (article.description) payload.description = article.description
        if (article.tags && article.tags.length > 0) payload.tags = article.tags
        if (typeof article.published === 'boolean') payload.published = article.published

        try {
            const key = ensureKey()
            const res = await withLoading(
                () => axios.put(`${API_BASE}/api/article/edit`, payload, {
                    headers: { 'x-api-key': key }
                }),
                '更新文章中...'
            )()
            return res.data
        } catch (err) {
            handleError(err)
            return null
        }
    }

    // 修改文章 slug
    const editSlug = async (oldSlug, newSlug) => {
        if (!oldSlug || !newSlug) return alert('旧 slug 或新 slug 不能为空'), null

        try {
            const key = ensureKey()
            const res = await withLoading(
                () => axios.put(`${API_BASE}/api/article/edit-slug`, { oldSlug, newSlug }, {
                    headers: { 'x-api-key': key }
                }),
                '修改文章链接中...'
            )()
            return res.data
        } catch (err) {
            handleError(err)
            return null
        }
    }

    // 删除文章
    const deleteArticle = async (slug) => {
        try {
            const key = ensureKey()
            await withLoading(
                () => axios.delete(`${API_BASE}/api/article/delete`, {
                    headers: { 'x-api-key': key },
                    data: { slug }
                }),
                '删除文章中...'
            )()
            return { success: true }
        } catch (err) {
            handleError(err)
            return null
        }
    }

    // 导出全部文章
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

    // 导出为 Markdown 文件
    const exportToMarkdown = async () => {
        try {
            const result = await exportAllArticles(10)
            if (!result || !result.data || result.data.length === 0) {
                alert('没有文章可以导出')
                return
            }

            const JSZip = await import('jszip')
            const zip = new JSZip.default()

            result.data.forEach(article => {
                // 生成 tags 的 YAML 列表
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
                
                zip.file(`${article.slug || Math.random().toString(36).substring(2, 8)}}.md`, content)
            })

            // 生成zip并下载
            const zipBlob = await zip.generateAsync({ type: 'blob' })
            const url = URL.createObjectURL(zipBlob)
            const link = document.createElement('a')
            link.href = url
            link.download = `articles-${new Date().toISOString().split('T')[0]}.zip`
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

    return { articles, getList, getArticle, addArticle, editArticle, editSlug, deleteArticle, exportAllArticles, exportToMarkdown }
}