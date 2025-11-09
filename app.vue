<template>
  <div v-if="route.path === '/verify'">
    <NuxtPage />
  </div>
  <div v-else class="flex h-screen">
    <Sidebar />
    <div class="flex-1 overflow-x ml-20 md:ml-40 pl-8">
      <NuxtPage />
    </div>
    <ModalDialog ref="modalRef" />
    <LoadingSpinner ref="loadingRef" />
    <div
      v-if="showVerifyOverlay"
      class="fixed inset-0 z-50 bg-white dark:bg-black flex items-center justify-center"
    >
      <p>输入访问验证密钥后才能继续访问......</p>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, onMounted } from 'vue'
import Sidebar from '~/components/sidebar.vue'
import ModalDialog from '~/components/ModalDialog.vue'
import LoadingSpinner from '~/components/LoadingSpinner.vue'
import { setModal } from '~/composables/useModal'
import { setLoading } from '~/composables/useLoading'
import { useCookie } from '#app'
import { useRoute } from 'vue-router'

const showVerifyOverlay = ref(true)
const modalRef = ref(null)
const loadingRef = ref(null)
const route = useRoute()
const verified = useCookie('admin_verified')

if (verified.value) showVerifyOverlay.value = false

onMounted(() => {
  if (modalRef.value) {
    setModal(modalRef.value)
  }
  if (loadingRef.value) {
    setLoading(loadingRef.value)
  }
})

watch(
  () => route.fullPath,
  () => {
    if (verified.value) {
      showVerifyOverlay.value = false
    } else {
      showVerifyOverlay.value = true
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