<template>
  <div class="flex">
    <main class="p-8 flex-1">
      <h1 class="text-2xl font-bold mb-4">编辑文章</h1>

      <!-- 标题 -->
      <input v-model="article.title" id="title" placeholder="标题" class="border p-2 w-full mb-4"/>

      <!-- Slug (只读) -->
      <input v-model="article.slug" id="slug" placeholder="Slug" class="border p-2 w-full mb-4" readonly/>

      <!-- 日期 -->
      <input v-model="article.date" id="date" type="date" class="border p-2 w-full mb-4"/>

      <!-- 描述 -->
      <input v-model="article.description" id="description" placeholder="描述" class="border p-2 w-full mb-4"></input>

      <!-- 标签 -->
      <input v-model="tagsString" id="tags" placeholder="标签（逗号分隔）" class="border p-2 w-full mb-4"/>

      <!-- 已发布 -->
      <label class="flex items-center gap-2 mb-4">
        <input id="published" type="checkbox" v-model="article.published"/>
        已发布
      </label>

      <!-- Markdown 内容 -->
      <MarkdownEditor 
        v-model="article.content"
        @onSave="handleSave"
      />

      <div class="mt-4 flex gap-2">
        <button @click="save">保存</button>
        <button @click="goBack">返回列表</button>
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { useRoute, useRouter, onBeforeRouteLeave } from 'vue-router'
import { useArticles } from '~/composables/useArticles.js'
import MarkdownEditor from '~/components/MarkdownEditor.vue'

const route = useRoute()
const router = useRouter()
const { getArticle, editArticle } = useArticles()

const article = ref({
  slug: '',
  title: '',
  date: '',
  description: '',
  tags: [],
  published: false,
  content: ''
})

const originalArticle = ref({})

const tagsString = computed({
  get: () => article.value.tags.join(','),
  set: val => {
    article.value.tags = val.split(',').map(t => t.trim()).filter(Boolean)
  }
})

onMounted(async () => {
  const data = await getArticle(route.params.slug)
  const fm = data.frontmatter || {}

  article.value.slug = fm.slug || ''
  article.value.title = fm.title || ''
  article.value.date = fm.date || ''
  article.value.description = fm.description || ''
  article.value.tags = fm.tags || []
  article.value.published = fm.published || false
  article.value.content = data.content || ''

  tagsString.value = article.value.tags.join(',')

  // 保存初始数据
  originalArticle.value = JSON.parse(JSON.stringify(article.value))
})

const isSaved = ref(false)

// 判断文章是否有修改
const hasChanges = () => {
  return JSON.stringify(article.value) !== JSON.stringify(originalArticle.value)
}

// 页面离开拦截
onBeforeRouteLeave((to, from, next) => {
  if (hasChanges() && !isSaved.value) {
    if (confirm('您有未保存的修改，确定要离开吗？')) {
      next()
    } else {
      next(false) // 阻止导航
    }
  } else {
    next()
  }
})

// 页面刷新或关闭时提示
const beforeUnloadHandler = (e) => {
  if (hasChanges() && !isSaved.value) {
    e.preventDefault()
    e.returnValue = ''
  }
}

onMounted(() => {
  window.addEventListener('beforeunload', beforeUnloadHandler)
})

onBeforeUnmount(() => {
  window.removeEventListener('beforeunload', beforeUnloadHandler)
})

// 返回按钮
const goBack = () => {
  router.push('/articles')
}

// 保存文章
const save = async () => {
  if (!hasChanges()) {
    alert('文章没有修改，无需保存')
    return
  }

  const result = await editArticle(article.value)
  if (!result) return

  isSaved.value = true
  originalArticle.value = JSON.parse(JSON.stringify(article.value))
  alert('保存成功')
}

//编辑器事件绑定
// 保存
function handleSave(val) {
  save()
}
</script>