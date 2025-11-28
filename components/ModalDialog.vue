<template>
  <div v-if="visible" class="fixed inset-0 bg-black/40 flex items-center justify-center z-10001" tabindex="-1" @keydown.space.prevent="handleSpaceKey" ref="modalRef">
    <div class="bg-white rounded-lg shadow-lg p-6 w-96 relative">
      <h2 class="text-lg font-bold mb-4 text-center">{{ title }}</h2>
      <p class="text-gray-600 mb-4 whitespace-pre-line">{{ message }}</p>

      <input
        v-if="type === 'prompt'"
        v-model="inputValue"
        ref="inputRef"
        class="w-full p-2 box-border border rounded mb-4"
        :placeholder="placeholder"
        @keydown.enter="handleConfirm"
        @keydown.escape="handleCancel"
        @keydown.space.stop.prevent="handleCancel"
      />
      
      <div class="flex gap-4 justify-end">
        <button 
          v-if="type === 'confirm' || type === 'prompt'"
          @click="handleCancel"
          class=" px-4 py-2 bg-gray-400 text-white rounded hover:bg-gray-500 transition border-none rounded cursor-pointer"
        >
          {{ cancelText }}
        </button>
        <button 
          @click="handleConfirm"
          class=" px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition border-none rounded cursor-pointer"
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
import { ref, nextTick } from 'vue'

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
let resolvePromise = null

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
  visible.value = false
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