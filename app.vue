<template>
  <div class="flex h-screen">
    <!-- 侧边栏 -->
    <Sidebar />

    <!-- 主内容区域 -->
    <div class="flex-1 overflow-auto">
      <NuxtPage />
    </div>
  </div>
</template>

<script setup>
import Sidebar from '~/components/sidebar.vue'
</script>

<style>
html, body, #__nuxt {
  height: 100%;
  margin: 0;
}
</style>