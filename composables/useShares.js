import { ref } from 'vue'
import api from './useApi.js'
import { siteConfig } from '@/site.config.js'
import { withLoading } from './useLoading.js'
import { useToken } from './useToken.js'
import { useErrorHandler } from './useErrorHandler.js'

export function useShares() {
    const shares = ref([])
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

    // 获取分享列表
    const getShares = async ({ silent = false } = {}) => {
        try {
            const request = () => api.get('/api/shares')
            const res = silent
                ? await request()
                : await withLoading(request, '加载分享中...')()

            const response = res.data
            if (response.success && response.data) {
                shares.value = response.data
            }
            return response
        } catch (err) {
            handleError(err)
            return { success: false, error: extractErrorMessage(err), data: [] }
        }
    }

    // 添加/编辑分享（不传 id 为新增，传 id 为修改，id 不存在时以该 id 新增）
    const saveShare = async (share) => {
        try {
            ensureKey()

            const payload = { ...share }
            if (!payload.id) delete payload.id
            if (!payload.description) payload.description = ''

            const res = await requestWithTurnstile(async (turnstileToken) => {
                const requestPayload = { ...payload }
                if (turnstileToken) {
                    requestPayload.turnstileToken = turnstileToken
                }

                return await withLoading(
                    () => api.post('/api/shares', requestPayload),
                    '保存分享中...'
                )()
            })

            const response = res.data
            return { success: true, share: response.share, message: response.message || '分享保存成功' }
        } catch (err) {
            handleError(err)
            return { success: false, error: extractErrorMessage(err) }
        }
    }

    // 删除分享
    const deleteShare = async (id) => {
        try {
            ensureKey()

            const res = await requestWithTurnstile(async (turnstileToken) => {
                const headers = {}
                if (turnstileToken) {
                    headers['x-turnstile-token'] = turnstileToken
                }

                return await withLoading(
                    () => api.delete('/api/shares', {
                        headers,
                        data: { id }
                    }),
                    '删除分享中...'
                )()
            })

            return { success: true, message: res.data?.message || '分享删除成功' }
        } catch (err) {
            handleError(err)
            return { success: false, error: extractErrorMessage(err) }
        }
    }

    return { shares, getShares, saveShare, deleteShare }
}
