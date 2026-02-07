import { useToken } from './useToken.js'

/**
 * 统一错误处理 Composable
 */
export function useErrorHandler() {
    const { clearAuthData } = useToken()

    /**
     * 提示对话框
     * @param {string} message - 提示信息
     */
    async function alert(message) {
        const { alert } = await import('@/composables/useModal')
        await alert(message)
    }

    /**
     * 确认对话框
     * @param {string} message - 确认信息
     * @returns {Promise<boolean>} 用户是否确认
     */
    async function confirm(message) {
        const { confirm } = await import('@/composables/useModal')
        return await confirm(message)
    }

    /**
     * 根据状态码获取错误信息
     * @param {number} status - HTTP状态码
     * @param {Object} data - 响应数据
     * @returns {string} 错误信息
     */
    function getErrorByStatus(status, data = {}) {
        const statusMessages = {
            400: data.error || '请求参数错误，请检查输入',
            401: '登录已过期，请重新登录',
            403: data.error || '权限不足',
            404: data.error || '请求的资源不存在',
            409: data.error || '数据冲突，记录已存在',
            422: data.error || '数据验证失败',
            429: '请求过于频繁，请稍后重试',
            500: '服务器内部错误',
            502: '网关错误',
            503: '服务暂时不可用',
            504: '请求超时'
        }
        return statusMessages[status] || '操作失败，请稍后重试'
    }

    /**
     * 从错误对象中提取错误信息
     * @param {Error} err - 错误对象
     * @returns {string} 错误信息
     */
    function extractErrorMessage(err) {
        // 优先使用响应数据中的错误信息
        if (err.response?.data) {
            const { data } = err.response
            if (data.error) return data.error
            if (data.message) return data.message
            if (data.details && Array.isArray(data.details)) {
                return data.details.map(d => d.message).join('; ')
            }
        }
        // 使用错误对象的message
        if (err.message) return err.message
        return '未知错误'
    }

    /**
     * 判断是否为特定类型的错误
     * @param {Error} err - 错误对象
     * @returns {Object} 错误类型判断结果
     */
    function classifyError(err) {
        const result = {
            isNetworkError: false,
            isAuthError: false,
            isValidationError: false,
            isConflictError: false,
            isNotFoundError: false,
            isServerError: false,
            isTurnstileError: false,
            isTurnstileCancelled: false
        }

        if (!err.response) {
            result.isNetworkError = true
            return result
        }

        const { status, data } = err.response

        switch (status) {
            case 401:
                result.isAuthError = true
                break
            case 400:
                result.isValidationError = true
                break
            case 404:
                result.isNotFoundError = true
                break
            case 409:
                result.isConflictError = true
                break
            default:
                if (status >= 500) result.isServerError = true
        }

        if (data?.needTurnstile) {
            result.isTurnstileError = true
        }

        if (err.isTurnstileCancelled) {
            result.isTurnstileCancelled = true
        }

        return result
    }

    /**
     * 处理认证错误，清除认证数据并跳转到登录页
     */
    function handleAuthError() {
        clearAuthData()
        window.location.href = '/login'
    }

    /**
     * 核心错误处理函数
     * @param {Error} err - 错误对象
     * @param {Object} options - 处理选项
     * @param {boolean} options.showAlert - 是否显示弹窗提示，默认true
     * @param {boolean} options.silent - 是否静默处理，默认false
     * @param {Function} options.onAuthError - 认证错误回调
     * @param {Function} options.onError - 通用错误回调
     * @returns {Object} 处理结果
     */
    async function handleError(err, options = {}) {
        const {
            showAlert = true,
            silent = false,
            onAuthError,
            onError
        } = options

        const classification = classifyError(err)

        // 静默模式：只返回结果，不显示提示
        if (silent) {
            return {
                success: false,
                error: extractErrorMessage(err),
                classification
            }
        }

        // Turnstile取消验证：不显示错误
        if (classification.isTurnstileCancelled) {
            return {
                success: false,
                error: null,
                classification
            }
        }

        const errorMsg = extractErrorMessage(err)

        // 执行自定义回调
        if (onError) {
            onError(err, errorMsg, classification)
        }

        // 显示错误提示
        if (showAlert) {
            await alert(errorMsg)
        }

        // 处理认证错误
        if (classification.isAuthError) {
            if (onAuthError) {
                onAuthError()
            } else {
                handleAuthError()
            }
        }

        return {
            success: false,
            error: errorMsg,
            classification
        }
    }

    /**
     * 用于 API 请求的包装器，自动处理错误
     * @param {Function} requestFn - 请求函数
     * @param {Object} options - 处理选项
     * @returns {Promise<any>} 请求结果或null
     */
    async function withErrorHandling(requestFn, options = {}) {
        try {
            const response = await requestFn()
            return response
        } catch (err) {
            handleError(err, options)
            return null
        }
    }

    /**
     * 判断错误是否可重试
     * @param {Error} err - 错误对象
     * @returns {boolean}
     */
    function isRetryable(err) {
        const classification = classifyError(err)
        return (
            classification.isNetworkError ||
            classification.isServerError ||
            (err.code && ['ECONNRESET', 'ETIMEDOUT', 'ECONNREFUSED'].includes(err.code))
        )
    }

    /**
     * 重试装饰器
     * @param {Function} requestFn - 请求函数
     * @param {number} maxRetries - 最大重试次数
     * @param {number} delay - 重试延迟(ms)
     * @returns {Promise<any>}
     */
    async function withRetry(requestFn, maxRetries = 3, delay = 1000) {
        let lastError = null

        for (let i = 0; i <= maxRetries; i++) {
            try {
                return await requestFn()
            } catch (err) {
                lastError = err
                if (i < maxRetries && isRetryable(err)) {
                    await new Promise(resolve => setTimeout(resolve, delay * (i + 1)))
                    continue
                }
                throw err
            }
        }

        throw lastError
    }

    return {
        getErrorByStatus,
        extractErrorMessage,
        classifyError,
        handleAuthError,
        handleError,
        withErrorHandling,
        isRetryable,
        withRetry
    }
}
