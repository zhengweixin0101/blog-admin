import { ref } from 'vue'

// 全局加载实例
const loadingRef = ref(null)

// 设置加载实例
export function setLoading(ref) {
  loadingRef.value = ref
}

// 等待加载组件挂载
const waitForLoading = () => {
  return new Promise((resolve) => {
    const checkLoading = () => {
      if (loadingRef.value) {
        resolve(loadingRef.value)
      } else {
        setTimeout(checkLoading, 10)
      }
    }
    checkLoading()
  })
}

// 显示加载弹窗
export async function showLoading(message = '加载中...') {
  if (!loadingRef.value) {
    await waitForLoading()
  }
  if (loadingRef.value) {
    loadingRef.value.show(message)
  }
}

// 隐藏加载弹窗
export async function hideLoading() {
  if (!loadingRef.value) {
    await waitForLoading()
  }
  if (loadingRef.value) {
    loadingRef.value.hide()
  }
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