import { ref } from 'vue'
import axios from 'axios'
import { siteConfig } from '@/site.config.js'
import { withLoading } from './useLoading.js'
import { useToken } from './useToken.js'
import { useErrorHandler } from './useErrorHandler.js'

export function useArticles() {
    const API_BASE = siteConfig.apiUrl
    const articles = ref([])
    const { getToken, clearAuthData } = useToken()
    const { handleError, extractErrorMessage } = useErrorHandler()

    function ensureKey() {
        const key = getToken()
        if (!key) {
            clearAuthData()
            window.location.href = '/login'
            throw new Error('API key missing')
        }
        return key
    }

    async function requestWithTurnstile(requestFn) {
        // 第一次请求无需人机验证
        try {
            return await requestFn(null)
        } catch (err) {
            // 如果后端返回needTurnstile标志且启用了Turnstile则弹窗验证后重试
            if (err.response?.data?.needTurnstile && window.showTurnstileModal && siteConfig.turnstileSiteKey) {
                try {
                    const token = await window.showTurnstileModal()
                    return await requestFn(token)
                } catch (verifyErr) {
                    const error = new Error('已取消人机验证')
                    error.isTurnstileCancelled = true
                    throw error
                }
            }
            throw err
        }
    }

    // 获取文章列表
    const getList = async () => {
        try {
            const res = await withLoading(
                () => axios.get(`${API_BASE}/api/article/list?posts=all`),
                '加载文章列表中...'
            )()

            const response = res.data
            if (response.success && response.data) {
                articles.value = response.data.map(article => ({
                    slug: article.slug,
                    title: article.title || '无标题',
                    date: article.date || '未指定日期',
                    description: article.description || '暂无描述',
                    tags: article.tags || ['未指定标签'],
                    published: article.published !== undefined ? article.published : false
                }))
                return { success: true }
            }
            return { success: false, error: '获取文章列表失败' }
        } catch (err) {
            handleError(err)
            return { success: false, error: extractErrorMessage(err) }
        }
    }

    // 获取文章内容
    const getArticle = async (slug) => {
        try {
            const res = await withLoading(
                () => axios.get(`${API_BASE}/api/article/get`, { params: { slug } }),
                '加载文章内容中...'
            )()

            const response = res.data
            if (response.success) {
                return {
                    success: true,
                    frontmatter: response.frontmatter,
                    content: response.content
                }
            }
            return { success: false, error: '获取文章内容失败' }
        } catch (err) {
            handleError(err)
            return { success: false, error: extractErrorMessage(err) }
        }
    }

    // 新建文章
    const addArticle = async (article) => {
        try {
            const key = ensureKey()

            const res = await requestWithTurnstile(async (turnstileToken) => {
                const requestPayload = { ...article }
                if (turnstileToken) {
                    requestPayload.turnstileToken = turnstileToken
                }

                return await withLoading(
                    () => axios.post(`${API_BASE}/api/article/add`, requestPayload, {
                        headers: { 'Authorization': `Bearer ${key}` }
                    }),
                    '创建文章中...'
                )()
            })

            const response = res.data
            if (response.success && response.article) {
                return { success: true, article: response.article, message: response.message || '文章创建成功' }
            }
            return { success: false, error: response.error || '文章创建失败' }
        } catch (err) {
            handleError(err)
            return { success: false, error: extractErrorMessage(err) }
        }
    }

    // 更新文章
    const editArticle = async (article) => {
        if (!article.slug) {
            return alert('缺少 slug，无法更新文章'), { success: false, error: '缺少 slug' }
        }

        const payload = { slug: article.slug }
        if (article.title) payload.title = article.title
        if (article.content) payload.content = article.content
        if (article.date) payload.date = article.date
        if (article.description) payload.description = article.description
        if (article.tags && article.tags.length > 0) payload.tags = article.tags
        if (typeof article.published === 'boolean') payload.published = article.published

        try {
            const key = ensureKey()

            const res = await requestWithTurnstile(async (turnstileToken) => {
                const requestPayload = { ...payload }
                if (turnstileToken) {
                    requestPayload.turnstileToken = turnstileToken
                }

                return await withLoading(
                    () => axios.put(`${API_BASE}/api/article/edit`, requestPayload, {
                        headers: { 'Authorization': `Bearer ${key}` }
                    }),
                    '更新文章中...'
                )()
            })

            const response = res.data
            if (response.success && response.article) {
                return { success: true, article: response.article, message: response.message || '文章更新成功' }
            }
            return { success: false, error: response.error || '文章更新失败' }
        } catch (err) {
            handleError(err)
            return { success: false, error: extractErrorMessage(err) }
        }
    }

    // 修改文章 slug
    const editSlug = async (oldSlug, newSlug) => {
        if (!oldSlug || !newSlug) {
            return alert('旧 slug 或新 slug 不能为空'), { success: false, error: 'slug 不能为空' }
        }

        try {
            const key = ensureKey()

            const res = await requestWithTurnstile(async (turnstileToken) => {
                const payload = { oldSlug, newSlug }
                if (turnstileToken) {
                    payload.turnstileToken = turnstileToken
                }

                return await withLoading(
                    () => axios.put(`${API_BASE}/api/article/edit-slug`, payload, {
                        headers: { 'Authorization': `Bearer ${key}` }
                    }),
                    '修改文章链接中...'
                )()
            })

            const response = res.data
            if (response.success && response.article) {
                return { success: true, article: response.article, message: response.message || 'slug 修改成功' }
            }
            return { success: false, error: response.error || 'slug 修改失败' }
        } catch (err) {
            handleError(err)
            return { success: false, error: extractErrorMessage(err) }
        }
    }

    // 删除文章
    const deleteArticle = async (slug) => {
        try {
            const key = ensureKey()

            const res = await requestWithTurnstile(async (turnstileToken) => {
                const headers = {
                    'Authorization': `Bearer ${key}`
                }
                if (turnstileToken) {
                    headers['x-turnstile-token'] = turnstileToken
                }

                return await withLoading(
                    () => axios.delete(`${API_BASE}/api/article/delete`, {
                        headers,
                        data: { slug }
                    }),
                    '删除文章中...'
                )()
            })

            return { success: true, message: res.data?.message || '文章删除成功' }
        } catch (err) {
            handleError(err)
            return { success: false, error: extractErrorMessage(err) }
        }
    }

    return { articles, getList, getArticle, addArticle, editArticle, editSlug, deleteArticle }
}