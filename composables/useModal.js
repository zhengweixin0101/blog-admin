import { ref } from 'vue'

// 全局弹窗实例
const modalRef = ref(null)

// 设置弹窗实例
export function setModal(ref) {
  modalRef.value = ref
}

// 显示弹窗
export function showModal(options) {
  if (!modalRef.value) {
    console.warn('Modal component not mounted yet')
    return Promise.resolve(false)
  }
  return modalRef.value.show(options)
}

// 快捷方法
export function alert(message, title = '提示') {
  return showModal({
    title,
    message,
    type: 'alert'
  })
}

export function confirm(message, title = '确认') {
  return showModal({
    title,
    message,
    type: 'confirm'
  })
}

export function prompt(message, defaultValue = '', title = '输入', placeholder = '') {
  return showModal({
    title,
    message,
    type: 'prompt',
    defaultValue,
    placeholder: placeholder
  })
}