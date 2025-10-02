import { ref } from 'vue'
import axios from 'axios'
import { useRouter } from 'vue-router'
import { siteConfig } from '@/site.config.js'

export function useTalks() {
    const API_BASE = siteConfig.apiUrl
    const talks = ref([])
    const router = useRouter()

    function ensureKey() {
        const key = localStorage.getItem('article_api_key')
        if (!key) {
            localStorage.removeItem('admin_verified')
            router.push('/verify')
            throw new Error('API key missing, redirecting to verify page')
        }
        return key
    }

    // 获取说说列表
    const getTalks = async (params = {}) => {
        const res = await axios.get(`${API_BASE}/api/talks/get`, { params })
        talks.value = res.data.data
        return res.data
    }

    // 添加说说
    const addTalk = async (talk) => {
        try {
            const key = ensureKey()
            const res = await axios.post(`${API_BASE}/api/talks/add`, talk, {
                headers: { 'x-api-key': key }
            })
            alert('说说添加成功！')
            return res.data
        } catch (err) {
            handleError(err)
            return null
        }
    }

    // 编辑说说
    const editTalk = async (talk) => {
        if (!talk.id) return alert('缺少 ID，无法更新说说'), null
        try {
            const key = ensureKey()
            const res = await axios.put(`${API_BASE}/api/talks/edit`, talk, {
                headers: { 'x-api-key': key }
            })
            alert('说说修改成功！')
            return res.data
        } catch (err) {
            handleError(err)
            return null
        }
    }

    // 删除说说
    const deleteTalk = async (id) => {
        try {
            const key = ensureKey()
            await axios.delete(`${API_BASE}/api/talks/delete`, {
                headers: { 'x-api-key': key },
                data: { id }
            })
            alert('说说删除成功！')
            return { success: true }
        } catch (err) {
            handleError(err)
            return null
        }
    }

    function handleError(err) {
        if (err.response) {
            const { status } = err.response
            if (status === 401) {
                alert('API Key 错误或已过期，请重新验证')
                localStorage.removeItem('article_api_key')
                localStorage.removeItem('admin_verified')
                router.push('/verify')
            } else if (status === 404) {
                alert('说说不存在，请检查 ID 是否正确')
            } else if (status === 429) {
                alert('错误次数过多，IP 已封禁十年')
            } else {
                alert('操作失败，请稍后重试')
            }
        } else {
            console.error(err)
            alert('网络错误或服务器异常')
        }
    }

    return { talks, getTalks, addTalk, editTalk, deleteTalk }
}