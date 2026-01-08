<template>
  <div v-if="visible" class="fixed inset-0 bg-black/40 flex items-center justify-center z-[9999]" ref="modalRef">
    <div class="bg-white rounded-lg shadow-lg p-6 w-96 relative">
      <h2 class="text-lg font-bold mb-2 text-center">人机验证</h2>
      <p class="text-gray-600 mb-4 text-center text-sm">请完成以下验证以继续操作</p>

      <div ref="turnstileContainer" class="flex justify-center mb-4"></div>

      <div class="flex justify-center">
        <button
          v-if="loading"
          disabled
          class="px-4 py-2 bg-gray-400 text-white rounded cursor-not-allowed"
        >
          验证中...
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
import { ref, nextTick, computed } from 'vue'
import { siteConfig } from '@/site.config.js'

const visible = ref(false)
const loading = ref(true)
const turnstileContainer = ref(null)
const turnstileWidgetId = ref(null)
let resolvePromise = null
let rejectPromise = null

// 判断是否启用人机验证
const isTurnstileEnabled = computed(() => {
  return siteConfig.turnstileSiteKey &&
         siteConfig.turnstileSiteKey.trim() !== '' &&
         typeof window !== 'undefined' &&
         window.turnstile
})

function show() {
  // 如果未启用人机验证，直接返回一个伪 token
  if (!isTurnstileEnabled.value) {
    return Promise.resolve('bypass_turnstile')
  }

  visible.value = true
  loading.value = true

  return new Promise((resolve, reject) => {
    resolvePromise = resolve
    rejectPromise = reject

    nextTick(() => {
      if (turnstileContainer.value) {
        turnstileWidgetId.value = window.turnstile.render(turnstileContainer.value, {
          sitekey: siteConfig.turnstileSiteKey,
          theme: 'light',
          callback: (token) => {
            loading.value = false
            setTimeout(() => {
              visible.value = false
              if (resolvePromise) {
                resolvePromise(token)
                resolvePromise = null
                rejectPromise = null
              }
            }, 200)
          },
          'error-callback': () => {
            loading.value = false
            if (rejectPromise) {
              rejectPromise(new Error('验证失败'))
              rejectPromise = null
              resolvePromise = null
            }
          },
          'expired-callback': () => {
            loading.value = false
            if (rejectPromise) {
              rejectPromise(new Error('验证已过期'))
              rejectPromise = null
              resolvePromise = null
            }
          }
        })
      }
    })
  })
}

function handleCancel() {
  visible.value = false
  if (rejectPromise) {
    rejectPromise(new Error('用户取消验证'))
    rejectPromise = null
    resolvePromise = null
  }
}

defineExpose({
  show
})
</script>
