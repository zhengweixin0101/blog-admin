<template>
  <div class="flex">
    <main class="p-8 flex-1">
      <div class="flex items-center">
        <h1 class="text-2xl font-bold mb-4">文章列表</h1>
        <div class="ml-auto transition-color">
          <button @click="openPanel('export')" class="cursor-pointer bg-transparent border-none text-gray-400 hover:text-blue-500 cursor-pointer">导出文章</button>
          <button @click="openPanel('import')" class="cursor-pointer bg-transparent border-none text-gray-400 hover:text-blue-500 cursor-pointer">导入文章</button>
        </div>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div v-for="article in articles" :key="article.slug" class="px-4 order rounded shadow">
          <h2 class="text-lg font-bold mb-2">{{ article.title }}</h2>
          <p class="text-sm text-gray-500 mb-2 flex items-center">
            {{ article.date }} |
            <a :href="`${siteConfig.blogUrl}/posts/${article.slug}`" target="_blank" class="text-gray-500 hover:text-blue-500 transition-color duration-300 ml-1">
              {{ article.slug }}
            </a>
            <button @click="handleEditSlug(article)" class="ml-0.5 mt-0.5 w-3.5 h-3.5 flex items-center justify-center cursor-pointer bg-transparent border-none p-0">
              <svg viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg" fill="currentColor">
                <path d="M783.673469 929.959184H177.632653c-45.97551 0-83.591837-37.616327-83.591837-83.591837V240.326531c0-45.97551 37.616327-83.591837 83.591837-83.591837h407.510204c11.493878 0 20.897959 9.404082 20.897959 20.897959s-9.404082 20.897959-20.897959 20.897959H177.632653c-22.987755 0-41.795918 18.808163-41.795918 41.795919v606.040816c0 22.987755 18.808163 41.795918 41.795918 41.795918h606.040816c22.987755 0 41.795918-18.808163 41.795919-41.795918V438.857143c0-11.493878 9.404082-20.897959 20.897959-20.897959s20.897959 9.404082 20.897959 20.897959v407.510204c0 45.97551-37.616327 83.591837-83.591837 83.591837z"></path>
                <path d="M498.938776 563.722449c-9.926531 0-19.330612-4.179592-27.167347-11.493878-11.493878-11.493878-14.628571-28.212245-7.836735-42.840816l31.346939-66.873469c9.926531-21.420408 23.510204-40.75102 39.706122-56.946939l272.718367-272.718367c26.644898-26.644898 72.097959-25.6 100.310205 3.134693 28.734694 28.734694 29.779592 73.665306 3.134693 100.310205l-272.718367 272.718367c-16.718367 16.718367-35.526531 29.779592-56.946939 39.706122l-66.873469 31.346939c-5.22449 2.612245-10.44898 3.657143-15.673469 3.657143zM854.726531 135.836735c-6.791837 0-13.061224 2.612245-17.763266 7.314285L564.244898 415.346939c-13.061224 13.061224-23.510204 28.212245-31.346939 44.930612l-27.167347 57.469388 57.469388-27.167347c16.718367-7.836735 31.869388-18.285714 44.930612-31.346939l272.718368-272.718367c4.702041-4.702041 7.314286-11.493878 6.791836-19.330613-0.522449-8.359184-4.179592-16.195918-9.92653-21.942857-6.269388-6.269388-14.106122-9.926531-21.942857-9.92653-0.522449 0.522449-0.522449 0.522449-1.044898 0.522449z"></path>
                <path d="M621.714286 497.371429c-5.22449 0-10.44898-2.089796-14.628572-6.269388L532.897959 417.436735c-8.359184-8.359184-8.359184-21.420408 0-29.779592 8.359184-8.359184 21.420408-8.359184 29.779592 0l73.665306 73.665306c8.359184 8.359184 8.359184 21.420408 0 29.779592-4.179592 4.179592-9.404082 6.269388-14.628571 6.269388z"></path>
              </svg>
            </button>
          </p>

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

          <div class="flex gap-2 mb-4 justify-end">
            <NuxtLink :to="`/articles/edit/${article.slug}`" class="text-14px no-underline px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600">编辑</NuxtLink>
            <button @click="handleDelete(article.slug)" class="cursor-pointer px-3 py-1 bg-red-500 text-white rounded border-none hover:bg-red-600">删除</button>
          </div>
        </div>
      </div>
    </main>

    <!-- 操作面板弹窗 -->
    <div v-if="showPanel" class="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 w-96 relative">
        <h2 class="text-lg font-bold mb-4 text-center">{{ panelType === 'export' ? '导出文章' : '导入文章' }}</h2>
        <div class="space-y-3">
          <button class="w-full py-2 rounded bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 transition cursor-pointer" @click="selectSource('1')">一个界面而已，没有实际功能。</button>
          <button class="w-full py-2 rounded bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 transition cursor-pointer" @click="selectSource('2')">一个界面而已，没有实际功能。</button>
          <button class="w-full py-2 rounded bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 transition cursor-pointer" @click="selectSource('3')">一个界面而已，没有实际功能。</button>
        </div>
        <button @click="closePanel" class="absolute top-2 right-3 bg-transparent border-none text-lg text-gray-400 hover:text-gray-600 cursor-pointer">✕</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useArticles } from '~/composables/useArticles.js'
import { alert, confirm } from '@/composables/useModal'
import { siteConfig } from '@/site.config.js'

const { articles, getList, deleteArticle, editSlug } = useArticles()

onMounted(() => {
  getList()
})

// 删除文章
const handleDelete = async (slug) => {
  const confirmed = await confirm('确定删除吗？')
  if (!confirmed) return
  const result = await deleteArticle(slug)
  if (!result) return
  await alert('删除成功')
  getList()
}

// 修改 slug
const handleEditSlug = async (article) => {
  const newSlug = await prompt('请输入新的 slug:', article.slug)
  if (!newSlug || newSlug === article.slug) return
  const confirmed = await confirm(`确认将 slug "${article.slug}" 修改为 "${newSlug}" 吗？`)
  if (!confirmed) return

  const result = await editSlug(article.slug, newSlug)
  if (!result) return
  await alert('修改成功')
  getList()
}

// 导入导出相关
const showPanel = ref(false)
const panelType = ref('export')

const openPanel = (type) => {
  panelType.value = type
  showPanel.value = true
}

const closePanel = () => {
  showPanel.value = false
}

const selectSource = async (source) => {
  await alert(`都说了没有实际功能，你还想干啥？`)
  closePanel()
  await alert(`喜欢点是吧？那就一只点吧。`)
  for (let i = 1; i <= 999999; i++) {
    await alert(`第 ${i} 次`)
  }
}
</script>