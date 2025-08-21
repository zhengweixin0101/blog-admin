import { ref } from 'vue'
import axios from 'axios'

export function useArticles() {

    const config = useRuntimeConfig()
    const API_BASE = config.public.apiBase

    const articles = ref([])

    // 获取文章列表
    const getList = async () => {
        const res = await axios.get(`${API_BASE}/list?posts=all`)
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
        const res = await axios.get(`${API_BASE}/article`, { params: { slug } })
        return res.data
    }

    // 新建文章
    const addArticle = async (article) => {
        const apiKey = prompt('请输入 API Key：')
        if (!apiKey) return alert('未输入 API Key，操作取消'), null

        try {
            const res = await axios.post(`${API_BASE}/add`, article, {
                headers: { 'x-api-key': apiKey }
            })
            return res.data
        } catch (err) {
            if (err.response && err.response.status === 401) alert('API Key 错误，请检查后重试')
            else if (err.response && err.response.status === 400) alert('slug 是必填项，请检查后重试')
            else if (err.response && err.response.status === 409) alert('文章已存在，请修改 slug 后重试')
            else if (err.response && err.response.status === 429) alert('错误次数过多，IP已封禁十年')
            else alert('新建文章失败，请稍后重试')
            return null
        }
    }

    // 更新文章
    const editArticle = async (article) => {
        if (!article.slug) return alert('缺少 slug，无法更新文章'), null
        const apiKey = prompt('请输入 API Key：')
        if (!apiKey) return alert('未输入 API Key，操作取消'), null

        const payload = { slug: article.slug }
        if (article.title) payload.title = article.title
        if (article.content) payload.content = article.content
        if (article.date) payload.date = article.date
        if (article.description) payload.description = article.description
        if (article.tags && article.tags.length > 0) payload.tags = article.tags
        if (typeof article.published === 'boolean') payload.published = article.published

        try {
            const res = await axios.put(`${API_BASE}/edit`, payload, {
                headers: { 'x-api-key': apiKey }
            })
            return res.data
        } catch (err) {
            if (err.response && err.response.status === 401) alert('API Key 错误，请检查后重试')
            else if (err.response && err.response.status === 404) alert('文章不存在，请检查 slug 是否正确')
            else if (err.response && err.response.status === 429) alert('错误次数过多，IP已封禁十年')
            else alert('更新文章失败，请稍后重试')
            return null
        }
    }

    // 修改文章 slug
    const editSlug = async (oldSlug, newSlug) => {
        if (!oldSlug || !newSlug) return alert('旧 slug 或新 slug 不能为空'), null
        const apiKey = prompt('请输入 API Key：')
        if (!apiKey) return alert('未输入 API Key，操作取消'), null

        try {
            const res = await axios.put(`${API_BASE}/edit-slug`, { oldSlug, newSlug }, {
                headers: { 'x-api-key': apiKey }
            })
            return res.data
        } catch (err) {
            if (err.response && err.response.status === 401) alert('API Key 错误，请检查后重试')
            else if (err.response && err.response.status === 404) alert('文章不存在，请检查旧 slug 是否正确')
            else if (err.response && err.response.status === 409) alert('新 slug 已存在，请更换后重试')
            else if (err.response && err.response.status === 429) alert('错误次数过多，IP已封禁十年')
            else alert('修改 slug 失败，请稍后重试')
            return null
        }
    }

    // 删除文章
    const deleteArticle = async (slug) => {
        const apiKey = prompt('请输入 API Key：')
        if (!apiKey) return alert('未输入 API Key，操作取消'), null

        try {
            await axios.delete(`${API_BASE}/delete`, {
                headers: { 'x-api-key': apiKey },
                data: { slug }
            })
            return { success: true }
        } catch (err) {
            if (err.response && err.response.status === 401) alert('API Key 错误，请检查后重试')
            else if (err.response && err.response.status === 404) alert('文章不存在，请检查 slug 是否正确')
            else if (err.response && err.response.status === 429) alert('错误次数过多，IP已封禁十年')
            else if (err.response && err.response.status === 400) alert('slug 是必填项，请检查后重试')
            else alert('删除文章失败，请稍后重试')
            return null
        }
    }

    return { articles, getList, getArticle, addArticle, editArticle, editSlug, deleteArticle }
}