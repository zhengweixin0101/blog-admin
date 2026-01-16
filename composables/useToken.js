// 博客 API 认证相关的缓存 key 管理
const TOKEN_KEYS = {
    AUTH_TOKEN: 'auth_token',
    TOKEN_EXPIRES: 'token_expires',
    ADMIN_VERIFIED: 'admin_verified'
}

export function useToken() {
    // 获取 Token（优先 localStorage，其次 sessionStorage）
    const getToken = () => {
        let token = localStorage.getItem(TOKEN_KEYS.AUTH_TOKEN)
        if (!token) {
            token = sessionStorage.getItem(TOKEN_KEYS.AUTH_TOKEN)
        }
        return token
    }

    // 设置 Token
    const setToken = (token, persistent = true) => {
        if (persistent) {
            localStorage.setItem(TOKEN_KEYS.AUTH_TOKEN, token)
        } else {
            sessionStorage.setItem(TOKEN_KEYS.AUTH_TOKEN, token)
        }
    }

    // 删除 Token
    const removeToken = () => {
        localStorage.removeItem(TOKEN_KEYS.AUTH_TOKEN)
        sessionStorage.removeItem(TOKEN_KEYS.AUTH_TOKEN)
    }

    // 获取 Token 过期时间
    const getTokenExpires = () => {
        let expires = localStorage.getItem(TOKEN_KEYS.TOKEN_EXPIRES)
        if (!expires) {
            expires = sessionStorage.getItem(TOKEN_KEYS.TOKEN_EXPIRES)
        }
        return expires ? Number(expires) : 0
    }

    // 设置 Token 过期时间
    const setTokenExpires = (expires, persistent = true) => {
        if (persistent) {
            localStorage.setItem(TOKEN_KEYS.TOKEN_EXPIRES, String(expires))
        } else {
            sessionStorage.setItem(TOKEN_KEYS.TOKEN_EXPIRES, String(expires))
        }
    }

    // 删除 Token 过期时间
    const removeTokenExpires = () => {
        localStorage.removeItem(TOKEN_KEYS.TOKEN_EXPIRES)
        sessionStorage.removeItem(TOKEN_KEYS.TOKEN_EXPIRES)
    }

    // 清除所有认证相关数据
    const clearAuthData = () => {
        removeToken()
        removeTokenExpires()
        localStorage.removeItem(TOKEN_KEYS.ADMIN_VERIFIED)
        sessionStorage.removeItem(TOKEN_KEYS.ADMIN_VERIFIED)
    }

    // 检查 Token 是否过期
    const isTokenExpired = () => {
        const expires = getTokenExpires()
        return expires <= Date.now()
    }

    return {
        getToken,
        setToken,
        removeToken,
        getTokenExpires,
        setTokenExpires,
        removeTokenExpires,
        clearAuthData,
        isTokenExpired
    }
}
