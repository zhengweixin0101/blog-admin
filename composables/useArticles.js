import { ref } from 'vue'
import axios from 'axios'

const API_BASE = 'https://article.api.zhengweixin.top/api'

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

    // 编辑或创建文章
    const saveArticle = async (article) => {
        const apiKey = prompt('请输入 API Key，用于保存文章：')
        if (!apiKey) {
            alert('未输入 API Key，操作取消')
            return
        }

        const payload = {}
        if (article.slug) payload.slug = article.slug
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
            } else {
                alert('保存失败，请稍后重试')
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

    return { articles, fetchArticles, getArticle, saveArticle, deleteArticle }
}