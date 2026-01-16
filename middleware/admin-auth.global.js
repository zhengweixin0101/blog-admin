import { useToken } from '~/composables/useToken'

export default defineNuxtRouteMiddleware((to) => {
    if (process.server) return

    if (to.path === '/login') return

    const verified = useCookie('admin_verified')
    if (!verified.value) {
        window.location.href = '/login'
        return
    }

    // 获取Token并验证有效性
    const { getToken, isTokenExpired, clearAuthData } = useToken()

    const token = getToken()
    if (!token) {
        // 没有Token，跳转到验证页面
        window.location.href = '/login'
        return
    }

    // 检查Token是否过期
    if (isTokenExpired()) {
        // Token已过期，清除并跳转到验证页面
        clearAuthData()
        window.location.href = '/login'
        return
    }
})

