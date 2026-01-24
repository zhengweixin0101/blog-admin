<template>
  <div v-if="visible" class="fixed inset-0 bg-black/40 flex items-center justify-center z-10001 overflow-hidden" tabindex="-1" @keydown.space.prevent="handleSpaceKey" @keydown.esc="handleCancel" ref="modalRef">
    <div class="bg-white rounded-lg shadow-lg p-6 w-96 relative">
      <h2 class="text-lg font-bold mb-4 text-center">{{ title }}</h2>
      <p class="text-gray-600 mb-4 whitespace-pre-line">{{ message }}</p>

      <input
        v-if="type === 'prompt'"
        v-model="inputValue"
        ref="inputRef"
        class="w-full p-2 box-border border rounded mb-4"
        :class="{ 'border-red-500': showError }"
        :placeholder="placeholder"
        @keydown.enter="handleConfirm"
        @keydown.escape="handleCancel"
        @keydown.space.stop.prevent="handleCancel"
        @input="showError = false"
      />

      <div v-if="type === 'prompt' && showError" class="bg-red-50 border border-red-200 rounded-md px-2 py-0.5 mb-4">
        <p class="text-sm text-red-600">请输入内容</p>
      </div>

      <div class="flex gap-2 mt-2">
        <button
          v-if="type === 'confirm' || type === 'prompt'"
          @click="handleCancel"
          class="flex-1 px-4 py-2 bg-gray-400 text-white rounded-lg hover:bg-gray-500 transition border-none cursor-pointer"
        >
          {{ cancelText }}
        </button>
        <button
          @click="handleConfirm"
          class="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition border-none cursor-pointer"
        >
          {{ confirmText }}
        </button>
      </div>
      <button
        @click="handleCancel"
        class="absolute top-2 right-3 bg-transparent border-none text-lg text-gray-400 hover:text-gray-600 cursor-pointer"
      >
        ✕
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, nextTick, watch, onUnmounted } from 'vue'

const visible = ref(false)
const title = ref('')
const message = ref('')
const type = ref('alert') // 'alert', 'confirm', 'prompt'
const confirmText = ref('确定')
const cancelText = ref('取消')
const inputValue = ref('')
const placeholder = ref('')
const inputRef = ref(null)
const modalRef = ref(null)
const showError = ref(false)
let resolvePromise = null

// 控制 body 滚动
watch(visible, (newVal) => {
  if (newVal) {
    document.body.style.overflow = 'hidden'
  } else {
    document.body.style.overflow = ''
  }
})

// 组件卸载时恢复滚动
onUnmounted(() => {
  document.body.style.overflow = ''
})

// 显示弹窗
function show(options = {}) {
  visible.value = true
  title.value = options.title || '提示'
  message.value = options.message || ''
  type.value = options.type || 'alert'
  confirmText.value = options.confirmText || '确定'
  cancelText.value = options.cancelText || '取消'
  inputValue.value = options.defaultValue || ''
  placeholder.value = options.placeholder || ''

  if (type.value === 'prompt') {
    nextTick(() => {
      if (inputRef.value) {
        inputRef.value.focus()
        inputRef.value.select()
      }
    })
  } else {
    nextTick(() => {
      if (modalRef.value) {
        modalRef.value.focus()
      }
    })
  }

  return new Promise((resolve) => {
    resolvePromise = resolve
  })
}

function handleConfirm() {
  if (type.value === 'prompt' && !inputValue.value.trim()) {
    showError.value = true
    return
  }

  visible.value = false
  showError.value = false
  if (resolvePromise) {
    if (type.value === 'prompt') {
      resolvePromise(inputValue.value)
    } else {
      resolvePromise(true)
    }
    resolvePromise = null
  }
}

function handleCancel() {
  visible.value = false
  showError.value = false
  if (resolvePromise) {
    if (type.value === 'prompt') {
      resolvePromise(null)
    } else {
      resolvePromise(type.value === 'confirm' ? false : true)
    }
    resolvePromise = null
  }
}

function handleSpaceKey() {
  if (type.value === 'alert') {
    handleCancel()
  } else if (type.value === 'confirm') {
    handleCancel()
  } else if (type.value === 'prompt') {
    handleCancel()
  }
}

defineExpose({
  show
})
</script>