export default defineNuxtRouteMiddleware((to) => {
    if (process.server) return

    if (to.path === '/verify') return

    const verified = useCookie('admin_verified')
    if (!verified.value) {
        window.location.href = '/verify'
        return
    }

    // 获取Token并验证有效性
    const getToken = () => {
        let token = localStorage.getItem('auth_token')
        if (!token) {
            token = sessionStorage.getItem('auth_token')
        }
        return token
    }

    const token = getToken()
    if (!token) {
        // 没有Token，跳转到验证页面
        window.location.href = '/verify'
        return
    }

    // 检查Token是否过期
    const getExpires = () => {
        let expires = localStorage.getItem('token_expires')
        if (!expires) {
            expires = sessionStorage.getItem('token_expires')
        }
        return expires ? Number(expires) : 0
    }

    const expires = getExpires()
    if (expires <= Date.now()) {
        // Token已过期，清除并跳转到验证页面
        localStorage.removeItem('auth_token')
        localStorage.removeItem('token_expires')
        sessionStorage.removeItem('auth_token')
        sessionStorage.removeItem('token_expires')
        localStorage.removeItem('admin_verified')
        sessionStorage.removeItem('admin_verified')
        window.location.href = '/verify'
        return
    }
})

