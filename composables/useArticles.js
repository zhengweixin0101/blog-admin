import { ref } from 'vue'
import axios from 'axios'

const API_BASE = 'https://article.api.zhengweixin.top/api'

export function useArticles() {
    const articles = ref([])

    // 获取文章列表
    const fetchArticles = async () => {
        const res = await axios.get(`${API_BASE}/list`)
        articles.value = res.data
    }

    // 获取文章内容
    const getArticle = async (slug) => {
        const res = await axios.get(`${API_BASE}/article`, { params: { slug } })
        return res.data
    }

    // 编辑或创建文章
    const saveArticle = async (article) => {
        await axios.put(`${API_BASE}/edit`, article)
    }

    // 删除文章
    const deleteArticle = async (slug) => {
        await axios.delete(`${API_BASE}/delete`, { data: { slug } })
    }

    return { articles, fetchArticles, getArticle, saveArticle, deleteArticle }
}