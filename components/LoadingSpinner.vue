<template>
  <div v-if="visible" class="fixed inset-0 bg-black/40 flex items-center justify-center z-10002">
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 w-64 relative">
      <div class="flex flex-col items-center justify-center">
        <svg
          class="animate-spin h-12 w-12 text-blue-500"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            class="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            stroke-width="4"
          />
          <path
            class="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
          />
        </svg>
        <p class="text-gray-600 dark:text-gray-300 text-center">{{ message }}</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const visible = ref(false)
const message = ref('加载中...')

// 显示加载弹窗
function show(loadingMessage = '加载中...') {
  visible.value = true
  message.value = loadingMessage
}

// 隐藏加载弹窗
function hide() {
  visible.value = false
}

defineExpose({
  show,
  hide
})
</script>