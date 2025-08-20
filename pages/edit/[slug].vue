<template>
  <div class="flex">
    <main class="p-8 flex-1">
      <h1 class="text-2xl font-bold mb-4">编辑文章</h1>

      <!-- 标题 -->
      <input v-model="article.title" placeholder="标题" class="border p-2 w-full mb-4"/>

      <!-- Slug (只读) -->
      <input v-model="article.slug" placeholder="Slug" class="border p-2 w-full mb-4" readonly/>

      <!-- 日期 -->
      <input v-model="article.date" type="date" class="border p-2 w-full mb-4"/>

      <!-- 描述 -->
      <textarea v-model="article.description" placeholder="描述" class="border p-2 w-full mb-4"></textarea>

      <!-- 标签 -->
      <input v-model="tagsString" placeholder="标签，逗号分隔" class="border p-2 w-full mb-4"/>

      <!-- 已发布 -->
      <label class="flex items-center gap-2 mb-4">
        <input type="checkbox" v-model="article.published"/>
        已发布
      </label>

      <!-- Markdown 内容 -->
      <MarkdownEditor v-model="article.content"/>

      <div class="mt-4 flex gap-2">
        <button @click="save" class="btn">保存</button>
        <NuxtLink to="/list" class="btn btn-gray">返回列表</NuxtLink>
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useArticles } from '~/composables/useArticles.js'
import MarkdownEditor from '~/components/MarkdownEditor.vue'

const route = useRoute()
const router = useRouter()
const { getArticle, saveArticle } = useArticles()

const article = ref({
  slug: '',
  title: '',
  date: '',
  description: '',
  tags: [],
  published: false,
  content: ''
})

// 标签字符串绑定
const tagsString = ref('')
watch(tagsString, (newVal) => {
  article.value.tags = newVal.split(',').map(t => t.trim()).filter(Boolean)
})

onMounted(async () => {
  const data = await getArticle(route.params.slug)
  
  // frontmatter 对应字段
  const fm = data.frontmatter || {}
  
  article.value = {
    slug: fm.slug || '',
    title: fm.title || '',
    date: fm.date || '',
    description: fm.description || '',
    tags: fm.tags || [],
    published: fm.published || false,
    content: data.content || ''
  }

  tagsString.value = article.value.tags.join(',')
})

const save = async () => {
  await saveArticle(article.value)
  alert('保存成功')
  router.push('/list')
}
</script>

<style scoped>
.btn { @apply px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600; }
.btn-gray { @apply bg-gray-500 hover:bg-gray-600; }
</style>
