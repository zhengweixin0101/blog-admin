<template>
  <div class="flex">
    <main class="p-8 flex-1">
      <h1 class="text-2xl font-bold mb-4">创建文章</h1>

      <!-- 标题 -->
      <input v-model="article.title" placeholder="标题" class="border p-2 w-full mb-4"/>

      <!-- Slug -->
      <input v-model="article.slug" placeholder="Slug" class="border p-2 w-full mb-4"/>

      <!-- 日期 -->
      <input v-model="article.date" type="date" class="border p-2 w-full mb-4"/>

      <!-- 描述 -->
      <textarea v-model="article.description" placeholder="描述" class="border p-2 w-full mb-4"></textarea>

      <!-- 标签 -->
      <input v-model="tagsString" placeholder="标签（逗号分隔）" class="border p-2 w-full mb-4"/>

      <!-- 已发布 -->
      <label class="flex items-center gap-2 mb-4">
        <input type="checkbox" v-model="article.published"/>
        已发布
      </label>

      <!-- Markdown 内容 -->
      <MarkdownEditor v-model="article.content"/>

      <div class="mt-4 flex gap-2">
        <button @click="create" class="btn">创建</button>
        <button @click="goBack" class="btn btn-gray">返回列表</button>
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useArticles } from '~/composables/useArticles.js'
import MarkdownEditor from '~/components/MarkdownEditor.vue'

const router = useRouter()
const { addArticle } = useArticles()

const article = ref({
  title: '',
  slug: '',
  date: '',
  description: '',
  tags: [],
  published: true,
  content: ''
})

// 标签字符串转换
const tagsString = computed({
  get: () => article.value.tags.join(','),
  set: val => {
    article.value.tags = val.split(',').map(t => t.trim()).filter(Boolean)
  }
})

const originalArticle = ref(JSON.parse(JSON.stringify(article.value)))
const isSaved = ref(false)

// 判断文章是否有修改
const hasChanges = () => {
  return JSON.stringify(article.value) !== JSON.stringify(originalArticle.value)
}

// 返回按钮逻辑
const goBack = () => {
  if (hasChanges() && !isSaved.value) {
    const confirmLeave = confirm('您有未保存的修改，确定要离开吗？')
    if (!confirmLeave) return
  }
  router.push('/list')
}

// 创建文章
const create = async () => {
  if (!article.value.title || !article.value.slug) {
    alert('标题和Slug不能为空')
    return
  }

  await addArticle(article.value)
  isSaved.value = true
  alert('创建成功')
  router.push('/list')
}
</script>