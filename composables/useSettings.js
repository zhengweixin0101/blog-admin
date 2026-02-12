import axios from 'axios'
import { siteConfig } from '@/site.config.js'
import { withLoading } from './useLoading.js'
import { useToken } from './useToken.js'
import { useErrorHandler } from './useErrorHandler.js'

export function useSettings() {
    const API_BASE = siteConfig.apiUrl
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
                return await axios.post(`${API_BASE}/api/system/updateAccount`, {
                    username,
                    password,
                    currentPassword
                }, {
                    headers: {
                        'Authorization': `Bearer ${key}`,
                        'Content-Type': 'application/json'
                    }
                })
            }, '更新中...')()
            return { success: true, ...response.data }
        } catch (error) {
            handleError(error), { success: false, error: extractErrorMessage(error) }
            return { success: false, error: extractErrorMessage(error) }
        }
    }

    // 获取所有 Token 列表
    const getTokensList = async () => {
        const key = ensureKey()

        try {
            const response = await axios.get(`${API_BASE}/api/tokens/list`, {
                headers: {
                    'Authorization': `Bearer ${key}`
                }
            })
            return { success: true, ...response.data }
        } catch (error) {
            handleError(error, { showAlert: false }), { success: false, error: extractErrorMessage(error) }
            return { success: false, error: extractErrorMessage(error) }
        }
    }

    // 创建新 Token
    const createToken = async ({ name, description, expiresIn, permissions }) => {
        const key = ensureKey()

        try {
            const response = await withLoading(async () => {
                return await axios.post(`${API_BASE}/api/tokens/create`, {
                    name,
                    description,
                    expiresIn,
                    permissions
                }, {
                    headers: {
                        'Authorization': `Bearer ${key}`,
                        'Content-Type': 'application/json'
                    }
                })
            }, '创建中...')()
            return { success: true, ...response.data }
        } catch (error) {
            handleError(error), { success: false, error: extractErrorMessage(error) }
            return { success: false, error: extractErrorMessage(error) }
        }
    }

    // 删除 Token
    const deleteToken = async (id) => {
        const key = ensureKey()

        try {
            const response = await withLoading(async () => {
                return await axios.delete(`${API_BASE}/api/tokens/delete`, {
                    data: { id },
                    headers: {
                        'Authorization': `Bearer ${key}`,
                        'Content-Type': 'application/json'
                    }
                })
            }, '删除中...')()
            return { success: true, ...response.data }
        } catch (error) {
            handleError(error), { success: false, error: extractErrorMessage(error) }
            return { success: false, error: extractErrorMessage(error) }
        }
    }

    // 获取配置
    const getConfig = async (key) => {
        const authKey = ensureKey()

        try {
            const response = await axios.get(`${API_BASE}/api/config/get`, {
                params: { key },
                headers: {
                    'Authorization': `Bearer ${authKey}`
                }
            })
            return { success: true, ...response.data }
        } catch (error) {
            handleError(error, { showAlert: false }), { success: false, error: extractErrorMessage(error) }
            return { success: false, error: extractErrorMessage(error) }
        }
    }

    // 设置配置
    const setConfig = async ({ key, value, description }) => {
        const authKey = ensureKey()

        try {
            const response = await withLoading(async () => {
                return await axios.post(`${API_BASE}/api/config/set`, {
                    key,
                    value,
                    description
                }, {
                    headers: {
                        'Authorization': `Bearer ${authKey}`,
                        'Content-Type': 'application/json'
                    }
                })
            }, '保存中...')()
            return { success: true, ...response.data }
        } catch (error) {
            handleError(error), { success: false, error: extractErrorMessage(error) }
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
