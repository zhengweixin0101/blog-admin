<template>
  <div class="flex">
    <main class="p-8 flex-1">
      <h1 class="text-2xl font-bold mb-4">创建文章</h1>
      <input v-model="article.title" placeholder="标题" class="border p-2 w-full mb-4"/>
      <input v-model="article.slug" placeholder="Slug" class="border p-2 w-full mb-4"/>
      <input v-model="article.date" type="date" class="border p-2 w-full mb-4"/>
      <MarkdownEditor v-model="article.content"/>
      <div class="mt-4 flex gap-2">
        <button @click="create" class="btn">创建</button>
        <NuxtLink to="/list" class="btn btn-gray">返回列表</NuxtLink>
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useArticles } from '~/composables/useArticles.js'
import Sidebar from '~/components/sidebar.vue'
import MarkdownEditor from '~/components/MarkdownEditor.vue'

const router = useRouter()
const { saveArticle } = useArticles()
const article = ref({ title: '', slug: '', content: '', date: '', tags: [], description: '', published: false })

const create = async () => {
  if (!article.value.title || !article.value.slug) { 
    alert('标题和Slug不能为空'); 
    return 
  }
  await saveArticle(article.value)
  alert('创建成功')
  router.push('/list')
}
</script>

<style scoped>
.btn { @apply px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600; }
.btn-gray { @apply bg-gray-500 hover:bg-gray-600; }
</style>
