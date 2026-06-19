import api from './useApi.js'
import { siteConfig } from '@/site.config.js'
import { withLoading } from './useLoading.js'
import { useToken } from './useToken.js'
import { useErrorHandler } from './useErrorHandler.js'

export function useSettings() {
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

    // 更新账号信息（用户名或密码）
    const updateAccount = async ({ username, password, currentPassword }) => {
        const key = ensureKey()

        try {
            const response = await withLoading(async () => {
                return await api.post('/api/system/updateAccount', {
                    username,
                    password,
                    currentPassword
                })
            }, '更新中...')()
            return { success: true, ...response.data }
        } catch (error) {
            handleError(error)
            return { success: false, error: extractErrorMessage(error) }
        }
    }

    // 获取所有 Token 列表
    const getTokensList = async () => {
        const key = ensureKey()

        try {
            const response = await api.get('/api/system/tokens')
            return { success: true, ...response.data }
        } catch (error) {
            if (error.response?.status === 404 || error.response?.status === 500) {
                return { success: true, data: [] }
            }
            handleError(error, { showAlert: false })
            return { success: false, error: extractErrorMessage(error) }
        }
    }

    // 创建新 Token
    const createToken = async ({ name, description, expiresIn, permissions }) => {
        const key = ensureKey()

        try {
            const response = await withLoading(async () => {
                return await api.post('/api/system/tokens', {
                    name,
                    description,
                    expiresIn,
                    permissions
                })
            }, '创建中...')()
            return { success: true, ...response.data }
        } catch (error) {
            handleError(error)
            return { success: false, error: extractErrorMessage(error) }
        }
    }

    // 删除 Token
    const deleteToken = async (id) => {
        const key = ensureKey()

        try {
            const response = await withLoading(async () => {
                return await api.delete('/api/system/tokens', {
                    data: { id }
                })
            }, '删除中...')()
            return { success: true, ...response.data }
        } catch (error) {
            handleError(error)
            return { success: false, error: extractErrorMessage(error) }
        }
    }

    // 获取配置
    const getConfig = async (key) => {
        const authKey = ensureKey()

        try {
            const response = await api.get('/api/system/config', {
                params: { key }
            })
            return { success: true, ...response.data }
        } catch (error) {
            handleError(error, { showAlert: false })
            return { success: false, error: extractErrorMessage(error) }
        }
    }

    // 设置配置
    const setConfig = async ({ key, value, description }) => {
        const authKey = ensureKey()

        try {
            const response = await withLoading(async () => {
                return await api.post('/api/system/config', {
                    key,
                    value,
                    description
                })
            }, '保存中...')()
            return { success: true, ...response.data }
        } catch (error) {
            handleError(error)
            return { success: false, error: extractErrorMessage(error) }
        }
    }

    return {
        updateAccount,
        getTokensList,
        createToken,
        deleteToken,
        getConfig,
        setConfig
    }
}
