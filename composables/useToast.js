import { ref } from 'vue'

// 全局 toast 列表
const toasts = ref([])
let seed = 0

// 默认停留时长(ms)，传 0 则不自动关闭
const DEFAULT_DURATION = 3000
// 同时最多显示的条数
const MAX_VISIBLE = 5

// 移除指定 toast（仅供自动消失与超出上限时调用）
function dismissToast(id) {
  const index = toasts.value.findIndex(t => t.id === id)
  if (index !== -1) toasts.value.splice(index, 1)
}

// 显示一条 toast
export function toast(message, duration = DEFAULT_DURATION) {
  if (message === undefined || message === null || message === '') return

  const id = ++seed
  toasts.value.push({ id, message: String(message), duration })

  // 超出上限时挤掉最早的一条
  while (toasts.value.length > MAX_VISIBLE) {
    dismissToast(toasts.value[0].id)
  }

  if (duration > 0) {
    setTimeout(() => dismissToast(id), duration)
  }
}

export function useToast() {
  return { toasts, toast }
}