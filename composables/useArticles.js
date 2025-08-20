import { ref } from 'vue'
import axios from 'axios'

const API_BASE = 'https://article.api.zhengweixin.top/api'
const API_SECRET = 'q%t}o0B6+aLxCkMKEBhL}RujiWgH}?XWD%rn.KPVHNnr:9_=Z^Y:1.N:-5Le9=3CYrc3WA%Tdv*Yp**LcA*-9}e5:#Wee4Lr,%m3'

export function useArticles() {
    const articles = ref([])

    // 获取文章列表
    const fetchArticles = async () => {
        const res = await axios.get(`${API_BASE}/list?posts=all`, {
            headers: { 'x-api-key': API_SECRET }
        })
        articles.value = res.data
    }

    // 获取文章内容
    const getArticle = async (slug) => {
        const res = await axios.get(`${API_BASE}/article`, {
            headers: { 'x-api-key': API_SECRET },
            params: { slug }
        })
        return res.data
    }

    // 编辑或创建文章
    const saveArticle = async (article) => {
        const payload = {}
        if (article.slug) payload.slug = article.slug
        if (article.title) payload.title = article.title
        if (article.content) payload.content = article.content
        if (article.date) payload.date = article.date
        if (article.description) payload.description = article.description
        if (article.tags && article.tags.length > 0) payload.tags = article.tags
        if (typeof article.published === 'boolean') payload.published = article.published

        const res = await axios.put(`${API_BASE}/edit`, payload, {
            headers: { 'x-api-key': API_SECRET }
        })
        return res.data
    }

    // 删除文章
    const deleteArticle = async (slug) => {
        await axios.delete(`${API_BASE}/delete`, {
            headers: { 'x-api-key': API_SECRET },
            data: { slug }
        })
    }

    return { articles, fetchArticles, getArticle, saveArticle, deleteArticle }
}