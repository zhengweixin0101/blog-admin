import axios from 'axios'
import { siteConfig } from '@/site.config.js'
import { withLoading } from './useLoading.js'
import { useToken } from './useToken.js'

export function useSettings() {
    const API_BASE = siteConfig.apiUrl
    const { getToken, clearAuthData } = useToken()

    function ensureKey() {
        const key = getToken()
        if (!key) {
            clearAuthData()
            window.location.href = '/login'
            throw new Error('API key missing')
        }
        return key
    }

    // 通用错误处理
    async function handleError(error) {
        if (error.response) {
            const { status, data } = error.response
            if (status === 401) {
                await alert('登录已过期，请重新登录')
                clearAuthData()
                window.location.href = '/login'
                return { success: false, error: '登录已过期' }
            }
            return data || { success: false, error: '操作失败' }
        } else if (error.message === 'API key missing') {
            return { success: false, error: '未登录' }
        }
        return { success: false, error: '网络错误或服务器异常' }
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
            return response.data
        } catch (error) {
            return await handleError(error)
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
            return response.data
        } catch (error) {
            return await handleError(error)
        }
    }

    // 创建新 Token
    const createToken = async ({ name, description, expiresIn }) => {
        const key = ensureKey()

        try {
            const response = await withLoading(async () => {
                return await axios.post(`${API_BASE}/api/tokens/create`, {
                    name,
                    description,
                    expiresIn
                }, {
                    headers: {
                        'Authorization': `Bearer ${key}`,
                        'Content-Type': 'application/json'
                    }
                })
            }, '创建中...')()
            return response.data
        } catch (error) {
            return await handleError(error)
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
            return response.data
        } catch (error) {
            return await handleError(error)
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
            return response.data
        } catch (error) {
            return await handleError(error)
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
            return response.data
        } catch (error) {
            return await handleError(error)
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
