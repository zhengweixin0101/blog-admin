<template>
  <div class="flex h-screen">
    <main class="p-8 flex-1 flex flex-col">
      <h1 class="text-2xl font-bold mb-4">编辑文章</h1>

      <div class="space-y-3 flex-shrink-0">
        <!-- 标题 -->
        <div class="flex gap-2">
          <input v-model="article.title" id="title" placeholder="标题" class="border rounded p-2 flex-1"/>
          <button @click="generateTitle">AI生成</button>
        </div>

        <!-- 描述 -->
        <div class="flex gap-2">
          <input v-model="article.description" id="description" placeholder="描述" class="border rounded p-2 flex-1"/>
          <button @click="generateSummary">AI生成</button>
        </div>

        <!-- Slug、标签、日期 -->
        <div class="flex gap-2">
          <input v-model="article.slug" 
                 id="slug" 
                 placeholder="Slug" 
                 class="border rounded box-border p-2 flex-1 underline cursor-pointer hover:bg-blue-50 transition-colors"
                 readonly
                 @click="openArticle"
                 :title="`点击查看文章: ${article.slug || ''}`"/>
          <input v-model="tagsString" id="tags" placeholder="标签（逗号分隔）" class="border box-border rounded p-2 flex-1"/>
          <input v-model="article.date" id="date" type="date" placeholder="日期" class="border box-border rounded p-2 flex-1"/>
        </div>

        <!-- 发布状态 -->
        <div class="flex gap-4">
          <label class="flex items-center">
            <input type="radio" name="published" :value="true" v-model="article.published"/>
            发布
          </label>
          <label class="flex items-center">
            <input type="radio" name="published" :value="false" v-model="article.published"/>
            草稿
          </label>
        </div>
      </div>

      <!-- Markdown 内容 -->
      <div class="flex-1 flex flex-col min-h-0 mt-4">
        <MarkdownEditor
          v-model="article.content"
          @onSave="handleSave"
          class="flex-1 rounded"
        />
        <div class="mt-4 flex gap-2 flex-shrink-0">
          <button @click="save">保存</button>
          <button @click="goBack">返回列表</button>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { useRoute, useRouter, onBeforeRouteLeave } from 'vue-router'
import { useArticles } from '~/composables/useArticles.js'
import MarkdownEditor from '~/components/MarkdownEditor.vue'
import { useAI } from '~/composables/useAI.js'
import { withLoading } from '~/composables/useLoading.js'
import { useToken } from '@/composables/useToken.js'
import { siteConfig } from '~/site.config.js'

const { getToken } = useToken()
const { sendMessage } = useAI()

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
    article.value.tags = val.split(/[,，]/).map(t => t.trim()).filter(Boolean)
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
onBeforeRouteLeave(async (to, from, next) => {
  if (hasChanges() && !isSaved.value) {
    const confirmed = await confirm('您有未保存的修改，确定要离开吗？')
    if (confirmed) {
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
    await alert('文章没有修改，无需保存')
    return
  }

  const result = await editArticle(article.value)
  if (!result) return

  isSaved.value = true
  originalArticle.value = JSON.parse(JSON.stringify(article.value))
  await alert('保存成功')
}

// 生成AI标题
const generateTitle = async () => {
  if (!article.value.content.trim()) {
    await alert('请先输入文章内容')
    return
  }

  try {
    const token = getToken()
    if (!token) {
      await alert('请先登录')
      return
    }

    const result = await withLoading(
      () => sendMessage({
        messages: [
          { role: 'user', content: `请为以下文章生成一个20字以内吸引人的标题：\n${article.value.content}` }
        ]
      }),
      'AI生成中...'
    )()

    if (!result.success) {
      throw new Error(result.error)
    }

    article.value.title = result.content
    await alert('标题生成成功！')
  } catch (error) {
    console.error('生成标题失败:', error)
    await alert(`生成标题失败：${error.message}`)
  }
}

// 生成AI摘要
const generateSummary = async () => {
  if (!article.value.content.trim()) {
    await alert('请先输入文章内容')
    return
  }

  try {
    const token = getToken()
    if (!token) {
      await alert('请先登录')
      return
    }

    const result = await withLoading(
      () => sendMessage({
        messages: [
          { role: 'user', content: `请为以下文章生成一个用于博客前台展示的50字以内的简洁摘要：\n${article.value.content}` }
        ]
      }),
      'AI生成中...'
    )()

    if (!result.success) {
      throw new Error(result.error)
    }

    article.value.description = result.content
    await alert('摘要生成成功！')
  } catch (error) {
    console.error('生成摘要失败:', error)
    await alert(`生成摘要失败：${error.message}`)
  }
}

// 打开博客前台文章页面
const openArticle = () => {
  if (!article.value.slug) return
  
  const url = `${siteConfig.blogUrl}/posts/${article.value.slug}`
  window.open(url, '_blank')
}

//编辑器事件绑定
// 保存
function handleSave(val) {
  save()
}
</script>