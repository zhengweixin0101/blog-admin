import axios from 'axios'
import { siteConfig } from '@/site.config.js'
import { useToken } from './useToken.js'
import { useErrorHandler } from './useErrorHandler.js'
import { useCrypto } from './useCrypto.js'

// 创建 axios 实例
const api = axios.create({
    baseURL: siteConfig.apiUrl,
    timeout: 30000, // 30秒超时
    headers: {
        'Content-Type': 'application/json'
    }
})

// 请求拦截器 - 添加认证token
api.interceptors.request.use(
    (config) => {
        const { getToken } = useToken()
        const token = getToken()
        if (token) {
            config.headers.Authorization = `Bearer ${token}`
        }
        return config
    },
    (error) => {
        return Promise.reject(error)
    }
)

// 防止并发自动登录
let isRefreshing = false
let refreshPromise = null

// 响应拦截器 - 处理token过期，自动续期
api.interceptors.response.use(
    (response) => {
        return response
    },
    async (error) => {
        const originalRequest = error.config

        // 如果是401错误且不是重试请求，且不是登录接口本身
        if (error.response?.status === 401 && !originalRequest._retry && !originalRequest.url?.includes('/api/system/login')) {
            const { getTokenRemainingTime, isTokenExpired } = useToken()
            
            // 记录调试信息
            console.log('Token验证失败:', {
                status: error.response.status,
                remainingTime: getTokenRemainingTime(),
                isExpired: isTokenExpired(),
                url: originalRequest.url
            })

            originalRequest._retry = true

            // 尝试用缓存凭证自动重新登录
            const { getCredentials, hasCredentials, removeCredentials } = useCrypto()
            if (hasCredentials()) {
                // 避免并发登录请求
                if (!isRefreshing) {
                    isRefreshing = true
                    refreshPromise = (async () => {
                        try {
                            const creds = await getCredentials()
                            if (!creds) return null

                            const loginRes = await axios.post(`${siteConfig.apiUrl}/api/system/login`, {
                                username: creds.username,
                                password: creds.password
                            })

                            if (loginRes.data?.success) {
                                const { setToken, setTokenExpires } = useToken()
                                const newToken = loginRes.data.token
                                setToken(newToken, true)
                                setTokenExpires(Date.now() + loginRes.data.expiresIn, true)
                                return newToken
                            }
                            return null
                        } catch {
                            return null
                        } finally {
                            isRefreshing = false
                        }
                    })()
                }

                const newToken = await refreshPromise
                if (newToken) {
                    // 用新 token 重试原始请求
                    originalRequest.headers.Authorization = `Bearer ${newToken}`
                    return api(originalRequest)
                }

                // 自动登录失败，清除凭证
                removeCredentials()
            }

            // 无法自动续期，清除认证数据并跳转登录页
            const { clearAuthData } = useToken()
            clearAuthData()
            
            // 避免在登录页面重复跳转
            if (window.location.pathname !== '/login') {
                window.location.href = '/login'
            }
        }

        return Promise.reject(error)
    }
)

export default api