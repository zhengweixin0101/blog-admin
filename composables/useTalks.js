import { ref } from 'vue'
import CryptoJS from 'crypto-js'
import axios from 'axios'
import { useRouter } from 'vue-router'
import { siteConfig } from '@/site.config.js'
import { withLoading } from './useLoading.js'
import { alert, confirm } from '@/composables/useModal'

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

    const getTalks = async (params = {}) => {
        const res = await withLoading(
            () => axios.get(`${API_BASE}/api/talks/get`, { params }),
            '加载说说中...'
        )()

        if (params.page && params.page > 1) {
            talks.value.push(...res.data.data)
        } else {
            talks.value = res.data.data
        }

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
            if (!payload.location) delete payload.location

            const res = await withLoading(
                () => axios.post(`${API_BASE}/api/talks/add`, payload, {
                    headers: { 'x-api-key': key }
                }),
                '添加说说中...'
            )()
            if (showAlert) await alert('说说添加成功！')
            return res.data
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

            const res = await withLoading(
                () => axios.put(`${API_BASE}/api/talks/edit`, talk, {
                    headers: { 'x-api-key': key }
                }),
                '编辑说说中...'
            )()
            await alert('说说修改成功！')
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
            await withLoading(
                () => axios.delete(`${API_BASE}/api/talks/delete`, {
                    headers: { 'x-api-key': key },
                    data: { id }
                }),
                '删除说说中...'
            )()
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

        const password = await prompt('设置导入密钥密钥（留空则不加密）', '');
        if (password === null) {
            return;
        }

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
                const password = await prompt('请输入入密钥密钥（未加密则留空）', '');
                if (password === null) {
                    return;
                }

                let text = await file.text()

                if (password) {
                    try {
                        const bytes = CryptoJS.AES.decrypt(text, password)
                        text = bytes.toString(CryptoJS.enc.Utf8)
                        if (!text) throw new Error('解密失败，请检查密码！')
                    } catch (err) {
                        await alert('解密失败，请检查密码！')
                        return
                    }
                }

                let importedTalks = JSON.parse(text)
                if (!Array.isArray(importedTalks)) {
                    await alert('密钥错误或导入文件格式不正确！')
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
                            console.error('添加失败：', talk, err)
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
                                console.error('添加失败：', talk, err)
                            }
                        }
                    }
                }

                await getTalks()
                await alert(`导入完成！\n成功导入：${successCount} 条${duplicateCount ? `\n重复内容：${duplicateCount} 条` : ''}`)
            } catch (err) {
                console.error(err)
                await alert('导入失败，请检查密钥或文件格式是否正确！')
            }
        }
        input.click()
    }


    async function handleError(err) {
        if (err.response) {
            const { status } = err.response
            if (status === 401) {
                await alert('API Key 错误或已过期，请重新验证')
                localStorage.removeItem('api_key')
                localStorage.removeItem('admin_verified')
                router.push('/verify')
            } else if (status === 404) {
                await alert('说说不存在，请检查 ID 是否正确')
            } else if (status === 429) {
                await alert('错误次数过多，IP 已封禁十年')
            } else {
                await alert('操作失败，请稍后重试')
            }
        } else {
            console.error(err)
            await alert('网络错误或服务器异常')
        }
    }

    return { talks, getTalks, addTalkInternal, editTalk, deleteTalk, exportMemos, importMemos }
}