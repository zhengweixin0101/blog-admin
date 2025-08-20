<template>
  <div class="flex">
    <Sidebar />
    <main class="p-8 flex-1">
      <h1 class="text-2xl font-bold mb-4">文章列表</h1>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div v-for="article in articles" :key="article.slug" class="p-4 border rounded shadow">
          <h2 class="text-lg font-bold">{{ article.title }}</h2>
          <p class="text-sm text-gray-500">{{ article.date }}</p>
          <div class="mt-2 flex gap-2">
            <NuxtLink :to="`/edit/${article.slug}`" class="btn">编辑</NuxtLink>
            <button @click="handleDelete(article.slug)" class="btn btn-danger">删除</button>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup>
import Sidebar from '~/components/sidebar.vue'
import { onMounted } from 'vue'
import { useArticles } from '~/composables/useArticles.js'

const { articles, fetchArticles, deleteArticle } = useArticles()

onMounted(() => {
  fetchArticles()
})

const handleDelete = async (slug) => {
  if (confirm('确定删除吗？')) {
    await deleteArticle(slug)
    fetchArticles()
  }
}
</script>

<style scoped>
.btn { @apply px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600; }
.btn-danger { @apply bg-red-500 hover:bg-red-600; }
</style>
