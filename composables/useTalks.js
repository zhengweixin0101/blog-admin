import { ref } from 'vue'
import axios from 'axios'
import { useRouter } from 'vue-router'
import { siteConfig } from '@/site.config.js'
import { withLoading } from './useLoading.js'
import { alert, confirm } from '@/composables/useModal'
import { useToken } from './useToken.js'

export function useTalks() {
    const API_BASE = siteConfig.apiUrl
    const talks = ref([])
    const router = useRouter()
    const { getToken, clearAuthData } = useToken()

    function ensureKey() {
        const key = getToken()
        if (!key) {
            clearAuthData()
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

            // 如果后端返回needTurnstile标志且启用了Turnstile则弹窗验证后重试
            if (err.response?.data?.needTurnstile && window.showTurnstileModal && siteConfig.turnstileSiteKey) {
                try {
                    const token = await window.showTurnstileModal()
                    // 带上人机验证令牌重试
                    return await requestFn(token)
                } catch (verifyErr) {
                    // 用户取消验证时直接抛出错误，不继续处理
                    const error = new Error('已取消人机验证')
                    error.isTurnstileCancelled = true
                    throw error
                }
            } else {
                throw err
            }
        }
    }

    const getTalks = async (params = {}) => {
        const res = await withLoading(
            () => axios.get(`${API_BASE}/api/talks/get`, { params }),
            '加载说说中...'
        )()

        const response = res.data
        if (response.success && response.data) {
            if (params.page && params.page > 1) {
                talks.value.push(...response.data)
            } else {
                talks.value = response.data
            }
        }

        return response
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
            if (!payload.location) delete payload.location

            const res = await requestWithTurnstile(async (turnstileToken) => {
                const requestPayload = { ...payload }
                if (turnstileToken) {
                    requestPayload.turnstileToken = turnstileToken
                }

                return await withLoading(
                    () => axios.post(`${API_BASE}/api/talks/add`, requestPayload, {
                        headers: { 'Authorization': `Bearer ${key}` }
                    }),
                    '添加说说中...'
                )()
            })

            if (showAlert) await alert('说说添加成功！')
            const response = res.data
            return { success: true, talk: response.talk, message: response.message }
        } catch (err) {
            handleError(err)
            return null
        }
    }

    // 编辑说说
    const editTalk = async (talk) => {
        if (!talk.id) {
            await alert('缺少 ID，无法更新说说')
            return null
        }
        try {
            const key = ensureKey()
            if (talk.links) {
                if (!Array.isArray(talk.links)) talk.links = [talk.links]
                talk.links = talk.links.map(l => typeof l === 'string' ? { text: l, url: l } : l)
            }

            const res = await requestWithTurnstile(async (turnstileToken) => {
                const payload = { ...talk }
                if (turnstileToken) {
                    payload.turnstileToken = turnstileToken
                }

                return await withLoading(
                    () => axios.put(`${API_BASE}/api/talks/edit`, payload, {
                        headers: { 'Authorization': `Bearer ${key}` }
                    }),
                    '编辑说说中...'
                )()
            })

            await alert('说说修改成功！')
            const response = res.data
            return { success: true, talk: response.talk, message: response.message }
        } catch (err) {
            handleError(err)
            return null
        }
    }

    // 删除说说
    const deleteTalk = async (id) => {
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
                    () => axios.delete(`${API_BASE}/api/talks/delete`, {
                        headers,
                        data: { id }
                    }),
                    '删除说说中...'
                )()
            })

            await alert('说说删除成功！')
            return { success: true }
        } catch (err) {
            handleError(err)
            return null
        }
    }

    // 导出说说
    const exportMemos = async () => {
        if (!talks.value || talks.value.length === 0) {
            await alert('暂无说说可导出')
            return
        }

        const dataStr = JSON.stringify(talks.value, null, 2)

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
                let text = await file.text()

                let importedTalks = JSON.parse(text)
                if (!Array.isArray(importedTalks)) {
                    await alert('导入文件格式不正确！')
                    return
                }

                importedTalks.sort((a, b) => a.id - b.id)

                // 获取现有说说数据检测重复
                await getTalks()
                const existingTalks = talks.value || []

                // 根据 content 和 created_at 判重
                const existingSet = new Set(existingTalks.map(t => `${t.content?.trim()}_${t.created_at}`))

                const uniqueTalks = importedTalks.filter(t => !existingSet.has(`${t.content?.trim()}_${t.created_at}`))
                const duplicateTalks = importedTalks.filter(t => existingSet.has(`${t.content?.trim()}_${t.created_at}`))

                let successCount = 0

                // 先上传不重复的
                for (const talk of uniqueTalks) {
                    if (talk.content && talk.content.trim()) {
                        try {
                            await addTalkInternal(talk, false)
                            successCount++
                        } catch (err) {
                            // 静默失败，跳过
                        }
                    }
                }

                let duplicateCount = 0

                // 询问是否导入重复内容
                if (duplicateTalks.length > 0) {
                    const confirmDup = await confirm(
                        `检测到 ${duplicateTalks.length} 条重复说说。\n是否继续导入这些重复内容？`
                    )
                    if (confirmDup) {
                        for (const talk of duplicateTalks) {
                            try {
                                await addTalkInternal(talk, false)
                                duplicateCount++
                            } catch (err) {
                                // 静默失败，跳过
                            }
                        }
                    }
                }

                await getTalks()
                await alert(`导入完成！\n成功导入：${successCount} 条${duplicateCount ? `\n重复内容：${duplicateCount} 条` : ''}`)
            } catch (err) {
                await alert('导入失败，请检查文件格式是否正确！')
            }
        }
        input.click()
    }


    function getApiError(error) {
        return error?.response?.data?.error || error?.response?.data?.message || '未知错误'
    }

    async function handleError(err) {
        // 如果是用户取消人机验证，则不显示错误提示
        if (err.isTurnstileCancelled) {
            return
        }

        if (err.response) {
            // 如果需要人机验证，显示统一的验证错误提示
            if (err.response?.data?.needTurnstile) {
                alert(err.response.data.error || '请完成人机验证后重试')
                return
            }

            const { status } = err.response
            if (status === 401) {
                await alert('登录已过期，请重新登录')
                clearAuthData()
                router.push('/login')
            } else if (status === 404) {
                await alert('说说不存在，请检查 ID 是否正确')
            } else {
                const errorMsg = getApiError(err)
                await alert(errorMsg || '操作失败，请稍后重试')
            }
        } else {
            await alert('网络错误或服务器异常')
        }
    }

    return { talks, getTalks, addTalkInternal, editTalk, deleteTalk, exportMemos, importMemos }
}