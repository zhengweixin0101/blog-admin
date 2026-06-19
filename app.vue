<template>
  <div>
    <div v-if="route.path === '/login'">
      <NuxtPage />
    </div>
    <div v-else class="flex h-screen">
      <Sidebar />
      <div class="flex-1 overflow-x ml-20 md:ml-40 pl-8">
        <NuxtPage />
      </div>
      <ModalDialog ref="modalRef" />
      <LoadingSpinner ref="loadingRef" />
      <TurnstileDialog ref="turnstileDialogRef" />
      <ImageComparisonDialog
        ref="imageComparisonRef"
        :visible="imageComparisonVisible"
        :original-file="imageComparisonOriginal"
        :compressed-result="imageComparisonCompressed"
        @confirm="handleImageComparisonConfirm"
        @skip="handleImageComparisonSkip"
        @cancel="handleImageComparisonCancel"
      />
      <div
        v-if="showLoginOverlay"
        class="fixed inset-0 z-50 bg-white flex items-center justify-center"
      >
        <p>登录后才能继续访问......</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, onMounted } from 'vue'
import Sidebar from '~/components/sidebar.vue'
import ModalDialog from '~/components/ModalDialog.vue'
import LoadingSpinner from '~/components/LoadingSpinner.vue'
import TurnstileDialog from '~/components/TurnstileDialog.vue'
import ImageComparisonDialog from '~/components/ImageComparisonDialog.vue'
import { setModal } from '~/composables/useModal'
import { setLoading } from '~/composables/useLoading'
import { useCookie } from '#app'
import { useRoute } from 'vue-router'

const showLoginOverlay = ref(true)
const modalRef = ref(null)
const loadingRef = ref(null)
const turnstileDialogRef = ref(null)
const imageComparisonRef = ref(null)
const imageComparisonVisible = ref(false)
const imageComparisonOriginal = ref(null)
const imageComparisonCompressed = ref(null)
let imageComparisonResolve = null

const route = useRoute()
const verified = useCookie('admin_verified')

if (verified.value) showLoginOverlay.value = false

function handleImageComparisonConfirm() {
  imageComparisonVisible.value = false
  if (imageComparisonResolve) {
    imageComparisonResolve({ action: 'compress', file: imageComparisonCompressed.value.file })
    imageComparisonResolve = null
  }
}

function handleImageComparisonSkip() {
  imageComparisonVisible.value = false
  if (imageComparisonResolve) {
    imageComparisonResolve({ action: 'skip', file: imageComparisonOriginal.value })
    imageComparisonResolve = null
  }
}

function handleImageComparisonCancel() {
  imageComparisonVisible.value = false
  if (imageComparisonResolve) {
    imageComparisonResolve({ action: 'cancel', file: imageComparisonOriginal.value })
    imageComparisonResolve = null
  }
}

function showImageComparisonDialog(originalFile, compressedResult) {
  return new Promise((resolve) => {
    imageComparisonOriginal.value = originalFile
    imageComparisonCompressed.value = compressedResult
    imageComparisonResolve = resolve
    imageComparisonVisible.value = true
  })
}

onMounted(() => {
  if (modalRef.value) {
    setModal(modalRef.value)
  }
  if (loadingRef.value) {
    setLoading(loadingRef.value)
  }

  loadTurnstile()
  initTurnstileModal()

  // 注册图片对比弹窗全局函数
  if (typeof window !== 'undefined') {
    window.showImageComparisonDialog = showImageComparisonDialog
  }
})

function loadTurnstile() {
  if (typeof window === 'undefined' || window.turnstile) return

  const script = document.createElement('script')
  script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit'
  script.async = true
  script.defer = true
  document.head.appendChild(script)
}

function initTurnstileModal() {
  if (typeof window === 'undefined') return

  // 全局函数供外部调用
  window.showTurnstileModal = async () => {
    if (turnstileDialogRef.value) {
      return turnstileDialogRef.value.show()
    }
    return null
  }
}

watch(
  () => route.fullPath,
  () => {
    if (verified.value) {
      showLoginOverlay.value = false
    } else {
      showLoginOverlay.value = true
    }
  }
)
</script>

<style>
html, body, #__nuxt {
  height: 100%;
  margin: 0;
}
</style>