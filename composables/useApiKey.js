const KEY_NAME = 'api_key'

export function useApiKey() {
  const getKey = () => {
    // 优先从 localStorage 获取，其次从 sessionStorage 获取
    let key = localStorage.getItem(KEY_NAME)
    if (!key) {
      key = sessionStorage.getItem(KEY_NAME)
    }
    return key
  }

  return {
    getKey
  }
}
