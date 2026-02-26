import axios from 'axios'
import { siteConfig } from '@/site.config.js'
import { useToken } from './useToken.js'
import { useErrorHandler } from './useErrorHandler.js'

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

// 响应拦截器 - 处理token过期
api.interceptors.response.use(
    (response) => {
        return response
    },
    async (error) => {
        const originalRequest = error.config

        // 如果是401错误且不是重试请求
        if (error.response?.status === 401 && !originalRequest._retry) {
            const { getTokenRemainingTime, isTokenExpired } = useToken()
            
            // 记录调试信息
            console.log('Token验证失败:', {
                status: error.response.status,
                remainingTime: getTokenRemainingTime(),
                isExpired: isTokenExpired(),
                url: originalRequest.url
            })

            originalRequest._retry = true

            // Token已过期，清除认证数据并跳转到登录页
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