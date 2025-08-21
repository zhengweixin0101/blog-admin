<template>
  <div class="flex">
    <main class="p-8 flex-1">
      <h1 class="text-2xl font-bold mb-4">文章列表</h1>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div v-for="article in articles" :key="article.slug" class="px-4 order rounded shadow">
          <h2 class="text-lg font-bold mb--2">{{ article.title }}</h2>
          <p class="text-sm text-gray-500 mb--2">{{ article.date }}</p>
          <p class="text-sm text-gray-700 mb-2">{{ article.description }}</p>

          <div class="text-sm text-gray-600 mb-2">
            <strong>标签:</strong>
            <span v-for="(tag, index) in article.tags" :key="index" class="ml-2 inline-block">
              {{ tag }}
            </span>
          </div>
          
          <div class="text-sm mb-2">
            <strong>状态:</strong> 
            <span class="ml-2" :class="article.published ? 'text-green-500' : 'text-red-500'">
              {{ article.published ? '已发布' : '未发布' }}
            </span>
          </div>

          <div class="flex gap-2 mb-4">
            <NuxtLink :to="`/edit/${article.slug}`" class="no-underline px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600">编辑</NuxtLink>
            <button @click="handleDelete(article.slug)" class="px-3 py-1 bg-red-500 text-white rounded border-none hover:bg-red-600">删除</button>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup>
import { onMounted } from 'vue'
import { useArticles } from '~/composables/useArticles.js'

const { articles, getList, deleteArticle } = useArticles()

onMounted(() => {
  getList()
})

const handleDelete = async (slug) => {
  if (!confirm('确定删除吗？')) return
  await deleteArticle(slug)
  alert('删除成功')
  getList()
}
</script>