export default defineNuxtRouteMiddleware((to) => {
    if (process.server) return

    if (to.path === '/verify') return

    const verified = useCookie('admin_verified')
    if (!verified.value) {
        window.location.href = '/verify'
        return
    }

    // 获取密钥并验证有效性
    const getKey = () => {
        let key = localStorage.getItem('api_key')
        if (!key) {
            key = sessionStorage.getItem('api_key')
        }
        return key
    }

    const key = getKey()
    if (!key) {
        // 没有密钥，跳转到验证页面
        window.location.href = '/verify'
        return
    }

    verifyKey(key).then(isValid => {
        if (!isValid) {
            localStorage.removeItem('admin_verified')
            sessionStorage.removeItem('admin_verified')
            window.location.href = '/verify'
        }
    })
})

async function verifyKey(key) {
    try {
        const API_BASE = 'https://blog.api.zhengweixin.top'
        const res = await fetch(`${API_BASE}/api/article/edit`, {
            method: 'PUT',
            headers: { 'x-api-key': key, 'Content-Type': 'application/json' },
            body: JSON.stringify({ slug: 'U2FsdGVkX18hAHT7Y5p3rPyFRrDnpH4VVTixbEhXLqw=' })
        })
        // 401 表示密钥无效，429 表示被封禁
        return res.status !== 401 && res.status !== 429
    } catch (err) {
        console.error('验证密钥失败:', err)
        return false
    }
}
