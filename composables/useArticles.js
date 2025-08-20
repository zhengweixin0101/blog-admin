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
        // 只保留有值的字段
        const payload = {}
        if (article.slug) payload.slug = article.slug
        if (article.title) payload.title = article.title
        if (article.content) payload.content = article.content
        if (article.date) payload.date = article.date
        if (article.description) payload.description = article.description
        if (article.tags && article.tags.length > 0) payload.tags = article.tags
        if (typeof article.published === 'boolean') payload.published = article.published

        const res = await axios.put(`${API_BASE}/edit`, payload)
        return res.data
    }

    // 删除文章
    const deleteArticle = async (slug) => {
        await axios.delete(`${API_BASE}/delete`, { data: { slug } })
    }

    return { articles, fetchArticles, getArticle, saveArticle, deleteArticle }
}