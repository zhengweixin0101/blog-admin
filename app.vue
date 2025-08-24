<template>
  <div class="flex h-screen">
    <Sidebar />
    <div class="flex-1 overflow-x ml-20 md:ml-40 pl-8">
      <NuxtPage />
    </div>
    <div
      v-if="showVerifyOverlay"
      class="fixed inset-0 z-50 bg-white dark:bg-black flex items-center justify-center"
    >
      <p>输入访问验证密钥后才能继续访问......</p>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import Sidebar from '~/components/sidebar.vue'
import { useCookie } from '#app'
import { useRoute } from 'vue-router'

const showVerifyOverlay = ref(true)
const route = useRoute()
const verified = useCookie('admin_verified')

if (verified.value) showVerifyOverlay.value = false

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