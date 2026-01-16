<template>
  <div v-if="visible" class="fixed inset-0 bg-black/40 flex items-center justify-center z-[9999] overflow-hidden" ref="modalRef">
    <div class="bg-white rounded-lg shadow-lg p-6 w-96 relative">
      <h2 class="text-lg font-bold mb-2 text-center">人机验证</h2>
      <p class="text-gray-600 mb-4 text-center text-sm">请完成以下验证以继续操作</p>

      <div ref="turnstileContainer" class="flex justify-center mb-4"></div>

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
import { ref, nextTick, computed, watch, onUnmounted } from 'vue'
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
         typeof window !== 'undefined'
})

// 等待 Turnstile 脚本加载完成
function waitForTurnstileLoad(timeout = 10000) {
  return new Promise((resolve, reject) => {
    if (window.turnstile) {
      resolve(true)
      return
    }

    const startTime = Date.now()
    const checkInterval = setInterval(() => {
      if (window.turnstile) {
        clearInterval(checkInterval)
        resolve(true)
      } else if (Date.now() - startTime > timeout) {
        clearInterval(checkInterval)
        reject(new Error('Turnstile failed to load'))
      }
    }, 100)
  })
}

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

function show() {
  // 如果未启用人机验证，直接返回一个伪 token
  if (!isTurnstileEnabled.value) {
    return Promise.resolve('bypass_turnstile')
  }

  visible.value = true
  loading.value = true

  return new Promise(async (resolve, reject) => {
    resolvePromise = resolve
    rejectPromise = reject

    try {
      // 等待 Turnstile 脚本加载完成
      await waitForTurnstileLoad()

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
    } catch (error) {
      visible.value = false
      if (rejectPromise) {
        rejectPromise(new Error('人机验证加载失败，请刷新页面重试'))
        rejectPromise = null
        resolvePromise = null
      }
    }
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
