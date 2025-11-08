<template>
  <div v-if="visible" class="fixed inset-0 bg-black/40 flex items-center justify-center z-10002">
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 w-64 relative">
      <div class="flex flex-col items-center justify-center">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4"></div>
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