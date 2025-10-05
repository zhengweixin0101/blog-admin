import { ref } from 'vue'
import CryptoJS from 'crypto-js'
import axios from 'axios'
import { useRouter } from 'vue-router'
import { siteConfig } from '@/site.config.js'

export function useTalks() {
    const API_BASE = siteConfig.apiUrl
    const talks = ref([])
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

    // 获取说说列表
    const getTalks = async (params = {}) => {
        const res = await axios.get(`${API_BASE}/api/talks/get`, { params })
        talks.value = res.data.data
        return res.data
    }

    // 添加说说
    const addTalkInternal = async (talk, showAlert = false) => {
        try {
            const key = ensureKey()
            if (talk.links) {
                if (!Array.isArray(talk.links)) talk.links = [talk.links]
                talk.links = talk.links.map(l => typeof l === 'string' ? { text: l, url: l } : l)
            } else {
                talk.links = []
            }

            const payload = { ...talk }
            if (!payload.created_at) delete payload.created_at

            const res = await axios.post(`${API_BASE}/api/talks/add`, payload, {
                headers: { 'x-api-key': key }
            })
            if (showAlert) alert('说说添加成功！')
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
            if (talk.links) {
                if (!Array.isArray(talk.links)) talk.links = [talk.links]
                talk.links = talk.links.map(l => typeof l === 'string' ? { text: l, url: l } : l)
            }

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

    // 导出说说
    const exportMemos = () => {
        if (!talks.value || talks.value.length === 0) return alert('暂无说说可导出')

        const password = prompt('请输入导出密码（留空则不加密）', '')?.trim()

        let dataStr = JSON.stringify(talks.value, null, 2)
        if (password) {
            dataStr = CryptoJS.AES.encrypt(dataStr, password).toString()
        }

        const blob = new Blob([dataStr], { type: 'application/json' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `talks_export_${Date.now()}.json`
        a.click()
        URL.revokeObjectURL(url)
    }

    // 导入说说
    const importMemos = () => {
        const input = document.createElement('input')
        input.type = 'file'
        input.accept = '.json,application/json'
        input.onchange = async (e) => {
            const file = e.target.files[0]
            if (!file) return

            try {
                const password = prompt('请输入导入密钥（未加密则留空）', '')?.trim()
                let text = await file.text()

                if (password) {
                    try {
                        const bytes = CryptoJS.AES.decrypt(text, password)
                        text = bytes.toString(CryptoJS.enc.Utf8)
                        if (!text) throw new Error('解密失败，请检查密码！')
                    } catch (err) {
                        return alert('解密失败，请检查密码！')
                    }
                }

                let importedTalks = JSON.parse(text)
                if (!Array.isArray(importedTalks)) return alert('密钥错误或导入文件格式不正确！')

                importedTalks.sort((a, b) => a.id - b.id)

                let successCount = 0
                for (const talk of importedTalks) {
                    if (talk.content && talk.content.trim()) {
                        try {
                            await addTalkInternal(talk, false)
                            successCount++
                        } catch (err) {
                            console.error('添加失败：', talk, err)
                        }
                    }
                }

                await getTalks()
                alert(`导入完成，成功导入 ${successCount} 条说说！`)
            } catch (err) {
                console.error(err)
                alert('导入失败，请检查密钥或文件格式是否正确！')
            }
        }
        input.click()
    }

    function handleError(err) {
        if (err.response) {
            const { status } = err.response
            if (status === 401) {
                alert('API Key 错误或已过期，请重新验证')
                localStorage.removeItem('api_key')
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

    return { talks, getTalks, addTalkInternal, editTalk, deleteTalk, exportMemos, importMemos }
}