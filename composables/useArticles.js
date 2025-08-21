import { ref } from 'vue'
import axios from 'axios'

// const API_BASE = 'https://article.api.zhengweixin.top/api'
const API_BASE = 'http://127.0.0.1:8000/api'

export function useArticles() {
    const articles = ref([])

    // 获取文章列表
    const fetchArticles = async () => {
        const res = await axios.get(`${API_BASE}/list?posts=all`)
        articles.value = res.data
    }

    // 获取文章内容
    const getArticle = async (slug) => {
        const res = await axios.get(`${API_BASE}/article`, { params: { slug } })
        return res.data
    }

    // 新建文章
    const addArticle = async (article) => {
        const apiKey = prompt('请输入 API Key，用于新建文章：')
        if (!apiKey) {
            alert('未输入 API Key，操作取消')
            return
        }

        try {
            const res = await axios.post(`${API_BASE}/add`, article, {
                headers: { 'x-api-key': apiKey }
            })
            return res.data
        } catch (err) {
            if (err.response && (err.response.status === 401 || err.response.status === 403)) {
                alert('API Key 错误，请检查后重试')
            } else {
                alert('新建文章失败，请稍后重试')
            }
            throw err
        }
    }

    // 更新文章
    const editArticle = async (article) => {
        if (!article.slug) {
            alert('缺少 slug，无法更新文章')
            return
        }

        const apiKey = prompt('请输入 API Key，用于更新文章：')
        if (!apiKey) {
            alert('未输入 API Key，操作取消')
            return
        }

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
            if (err.response && (err.response.status === 401 || err.response.status === 403)) {
                alert('API Key 错误，请检查后重试')
            } else if (err.response && err.response.status === 404) {
                alert('未找到对应文章，更新失败')
            } else {
                alert('更新文章失败，请稍后重试')
            }
            throw err
        }
    }

    // 删除文章
    const deleteArticle = async (slug) => {
        const apiKey = prompt('请输入 API Key，用于删除文章：')
        if (!apiKey) {
            alert('未输入 API Key，操作取消')
            return
        }

        try {
            await axios.delete(`${API_BASE}/delete`, {
                headers: { 'x-api-key': apiKey },
                data: { slug }
            })
        } catch (err) {
            if (err.response && (err.response.status === 401 || err.response.status === 403)) {
                alert('API Key 错误，请检查后重试')
            } else {
                alert('删除失败，请稍后重试')
            }
            throw err
        }
    }

    return { articles, fetchArticles, getArticle, addArticle, editArticle, deleteArticle }
}