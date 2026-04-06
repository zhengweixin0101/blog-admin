import { ref } from 'vue'
import axios from 'axios'
import { siteConfig } from '@/site.config.js'
import { withLoading } from './useLoading.js'
import { useToken } from './useToken.js'
import { useErrorHandler } from './useErrorHandler.js'

export function useLogs() {
    const API_BASE = siteConfig.apiUrl
    const logs = ref([])
    const pagination = ref({
        page: 1,
        pageSize: 20,
        total: 0,
        totalPages: 0
    })
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

    // 获取日志列表
    const getLogs = async (options = {}) => {
        const {
            page = 1,
            pageSize = 20,
            action = '',
            method = '',
            status = '',
            startDate = '',
            endDate = ''
        } = options

        try {
            const key = ensureKey()
            
            const params = { page, pageSize }
            if (action) params.action = action
            if (method) params.method = method
            if (status) params.status = status
            if (startDate) params.startDate = startDate
            if (endDate) params.endDate = endDate

            const res = await withLoading(
                () => axios.get(`${API_BASE}/api/logs`, {
                    params,
                    headers: { 'Authorization': `Bearer ${key}` }
                }),
                '加载日志列表中...'
            )()

            const response = res.data
            if (response.success) {
                logs.value = response.data?.list || []
                pagination.value = response.data?.pagination || {
                    page: 1,
                    pageSize: 20,
                    total: 0,
                    totalPages: 0
                }
                return { success: true }
            }
            return { success: false, error: response.error || '获取日志列表失败' }
        } catch (err) {
            handleError(err)
            return { success: false, error: extractErrorMessage(err) }
        }
    }

    // 清空日志
    const clearLogs = async (days = 0) => {
        try {
            const key = ensureKey()

            const res = await withLoading(
                () => axios.delete(`${API_BASE}/api/logs`, {
                    params: { days },
                    headers: { 'Authorization': `Bearer ${key}` }
                }),
                days > 0 ? `正在清理${days}天前的日志...` : '正在清空日志...'
            )()

            const response = res.data
            if (response.success) {
                // 刷新日志列表
                await getLogs({ page: pagination.value.page })
                return { success: true, message: response.message, deletedCount: response.data?.deletedCount }
            }
            return { success: false, error: response.error || '清空日志失败' }
        } catch (err) {
            handleError(err)
            return { success: false, error: extractErrorMessage(err) }
        }
    }

    return {
        logs,
        pagination,
        getLogs,
        clearLogs
    }
}
