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
import { ref, onMounted } from 'vue'
import Sidebar from '~/components/sidebar.vue'

const showVerifyOverlay = ref(true)

onMounted(() => {
  const verified = localStorage.getItem('admin_verified')
  if (verified) {
    showVerifyOverlay.value = false
  } else {
    navigateTo('/verify')
  }
})
</script>

<style>
html, body, #__nuxt {
  height: 100%;
  margin: 0;
}
</style>