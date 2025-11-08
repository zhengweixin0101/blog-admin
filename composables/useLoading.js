import { ref } from 'vue'

// 全局加载实例
const loadingRef = ref(null)

// 设置加载实例
export function setLoading(ref) {
  loadingRef.value = ref
}

// 显示加载弹窗
export function showLoading(message = '加载中...') {
  if (!loadingRef.value) {
    console.warn('Loading component not mounted yet')
    return
  }
  loadingRef.value.show(message)
}

// 隐藏加载弹窗
export function hideLoading() {
  if (!loadingRef.value) {
    console.warn('Loading component not mounted yet')
    return
  }
  loadingRef.value.hide()
}

// 包装异步函数，自动显示/隐藏加载状态
export function withLoading(asyncFn, message = '加载中...') {
  return async (...args) => {
    showLoading(message)
    try {
      const result = await asyncFn(...args)
      return result
    } finally {
      hideLoading()
    }
  }
}