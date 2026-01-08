const TOKEN_NAME = 'auth_token'

export function useApiKey() {
  const getKey = () => {
    // 优先从 localStorage 获取，其次从 sessionStorage 获取
    let token = localStorage.getItem(TOKEN_NAME)
    if (!token) {
      token = sessionStorage.getItem(TOKEN_NAME)
    }
    return token
  }

  return {
    getKey
  }
}
