import { ref } from 'vue'
import axios from 'axios'
import { useRouter } from 'vue-router'
import { siteConfig } from '@/site.config.js'
import { withLoading } from './useLoading.js'
import { useApiKey } from './useApiKey.js'

export function useArticles() {
    const API_BASE = siteConfig.apiUrl
    const articles = ref([])
    const router = useRouter()
    const { getKey } = useApiKey()

    function ensureKey() {
        const key = getKey()
        if (!key) {
            localStorage.removeItem('admin_verified')
            sessionStorage.removeItem('admin_verified')
            router.push('/login')
            throw new Error('API key missing, redirecting to login page')
        }
        return key
    }

    async function requestWithTurnstile(requestFn) {
        let lastError = null

        // 第一次请求无需人机验证
        try {
            return await requestFn(null)
        } catch (err) {
            lastError = err

            // 如果错误是403验证失败且启用了Turnstile则弹窗验证后重试
            if (err.response?.status === 403 && window.showTurnstileModal && siteConfig.turnstileSiteKey) {
                try {
                    const token = await window.showTurnstileModal()
                    // 带上人机验证令牌
                    return await requestFn(token)
                } catch (verifyErr) {
                    console.error('Turnstile verification failed:', verifyErr)
                    throw new Error('验证失败,操作已取消')
                }
            } else {
                throw err
            }
        }
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
                    headers: { 'Authorization': `Bearer ${key}` }
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

            await requestWithTurnstile(async (turnstileToken) => {
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

            return { success: true }
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
                localStorage.removeItem('auth_token')
                localStorage.removeItem('token_expires')
                sessionStorage.removeItem('auth_token')
                sessionStorage.removeItem('token_expires')
                localStorage.removeItem('admin_verified')
                sessionStorage.removeItem('admin_verified')
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

    return { articles, getList, getArticle, addArticle, editArticle, editSlug, deleteArticle }
}