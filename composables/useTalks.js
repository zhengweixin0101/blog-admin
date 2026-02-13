import { ref } from 'vue'
import axios from 'axios'
import { siteConfig } from '@/site.config.js'
import { withLoading } from './useLoading.js'
import { alert, confirm } from '@/composables/useModal'
import { useToken } from './useToken.js'
import { useErrorHandler } from './useErrorHandler.js'

export function useTalks() {
    const API_BASE = siteConfig.apiUrl
    const talks = ref([])
    const { getToken, clearAuthData } = useToken()
    const { handleError, extractErrorMessage } = useErrorHandler()

    function ensureKey() {
        const key = getToken()
        if (!key) {
            clearAuthData()
            window.location.href = '/login'
            throw new Error('API key missing')
        }
        return key
    }

    async function requestWithTurnstile(requestFn) {
        try {
            return await requestFn(null)
        } catch (err) {
            if (err.response?.data?.needTurnstile && window.showTurnstileModal && siteConfig.turnstileSiteKey) {
                try {
                    const token = await window.showTurnstileModal()
                    return await requestFn(token)
                } catch (verifyErr) {
                    const error = new Error('已取消人机验证')
                    error.isTurnstileCancelled = true
                    throw error
                }
            }
            throw err
        }
    }

    const getTalks = async (params = {}) => {
        try {
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
        } catch (err) {
            handleError(err), { success: false, error: extractErrorMessage(err), data: [] }
            return { success: false, error: extractErrorMessage(err), data: [] }
        }
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

            const response = res.data
            return { success: true, talk: response.talk, message: response.message || '说说添加成功' }
        } catch (err) {
            handleError(err), { success: false, error: extractErrorMessage(err) }
            return { success: false, error: extractErrorMessage(err) }
        }
    }

    // 编辑说说
    const editTalk = async (talk) => {
        if (!talk.id) {
            return alert('缺少 ID，无法更新说说'), { success: false, error: '缺少 ID' }
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

            const response = res.data
            return { success: true, talk: response.talk, message: response.message || '说说修改成功' }
        } catch (err) {
            handleError(err), { success: false, error: extractErrorMessage(err) }
            return { success: false, error: extractErrorMessage(err) }
        }
    }

    // 删除说说
    const deleteTalk = async (id) => {
        try {
            const key = ensureKey()

            const res = await requestWithTurnstile(async (turnstileToken) => {
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

            return { success: true, message: res.data?.message || '说说删除成功' }
        } catch (err) {
            handleError(err), { success: false, error: extractErrorMessage(err) }
            return { success: false, error: extractErrorMessage(err) }
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


    return { talks, getTalks, addTalkInternal, editTalk, deleteTalk, exportMemos, importMemos }
}