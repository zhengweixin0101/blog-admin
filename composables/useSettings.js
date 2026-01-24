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
            return response.data
        } catch (error) {
            return error.response?.data || { success: false, error: '更新账号失败' }
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
            return error.response?.data || { success: false, error: '获取 Token 列表失败' }
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
            return error.response?.data || { success: false, error: '创建 Token 失败' }
        }
    }

    // 删除 Token
    const revokeToken = async (id) => {
        const key = ensureKey()

        try {
            const response = await withLoading(async () => {
                return await axios.delete(`${API_BASE}/api/tokens/revoke`, {
                    data: { id },
                    headers: {
                        'Authorization': `Bearer ${key}`,
                        'Content-Type': 'application/json'
                    }
                })
            }, '删除中...')()
            return response.data
        } catch (error) {
            return error.response?.data || { success: false, error: '删除 Token 失败' }
        }
    }

    return {
        updateAccount,
        getTokensList,
        createToken,
        revokeToken
    }
}
