<template>
  <div class="flex">
    <main class="p-8 flex-1">
      <div class="flex items-center">
        <h1 class="text-2xl font-bold mb-4">文章列表</h1>
        <div v-if="articles && articles.length" class="ml-auto transition-color">
          <button @click="deleteAll" class="cursor-pointer bg-transparent border-none text-gray-400 hover:text-blue-500 cursor-pointer">全部删除</button>
          <button @click="openPanel('import')" class="cursor-pointer bg-transparent border-none text-gray-400 hover:text-blue-500 cursor-pointer">导入文章</button>
          <button @click="openPanel('export')" class="cursor-pointer bg-transparent border-none text-gray-400 hover:text-blue-500 cursor-pointer">导出文章</button>
        </div>
      </div>

      <div v-if="articles && articles.length" class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div v-for="article in articles" :key="article.slug" class="px-4 order rounded shadow">
          <h2 class="text-lg font-bold mb-2">{{ article.title }}</h2>
          <p class="text-sm text-gray-500 mb-2 flex items-center">
            {{ article.date }} |
            <a :href="`${siteConfig.blogUrl}/posts/${article.slug}`" target="_blank" class="text-gray-500 hover:text-blue-500 transition-color ml-1">
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
            <button @click="handleDelete(article.slug)" class="cursor-pointer px-3 py-1 bg-red-500 text-white rounded border-none hover:bg-red-600 transition-colors">删除</button>
            <NuxtLink :to="`/articles/edit/${article.slug}`" class="text-14px no-underline px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors">编辑</NuxtLink>
          </div>
        </div>
      </div>

      <div v-else class="flex flex-col items-center justify-center w-full my-60">
        <div class="text-center text-gray-500">
          <svg class="mx-auto mb-4" width="64" height="64" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M3 6H21" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M3 12H21" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M3 18H21" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          <p class="text-lg font-medium">暂无文章</p>
          <p class="text-sm mt-2">您可以导入或创建第一篇文章。</p>
        </div>
        <div class="mt-4 flex items-center gap-3">
          <button @click="goCreate" class="px-4 py-2 bg-gray-100 text-gray-700 rounded border-1 hover:bg-gray-200 transition-colors cursor-pointer">创建文章</button>
          <button @click="openPanel('import')" class="px-4 py-2 bg-gray-100 text-gray-700 rounded border-1 hover:bg-gray-200 transition-colors cursor-pointer">导入文章</button>
        </div>
      </div>
    </main>

    <!-- 操作面板弹窗 -->
    <div v-if="showPanel" class="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div class="bg-white rounded-lg shadow-lg p-6 w-96 relative">
        <h2 class="text-lg font-bold mb-4 text-center">{{ panelType === 'export' ? '导出文章' : '导入文章' }}</h2>
        <div v-if="panelType === 'export'" class="space-y-3">
          <button class="w-full py-2 rounded bg-gray-100 hover:bg-gray-200 transition cursor-pointer border-1" @click="handleExportMarkdown">导出为 Markdown</button>
          <button class="w-full py-2 rounded bg-gray-100 hover:bg-gray-200 transition cursor-pointer border-1" @click="handleExportJSON">导出为 Json</button>
          <button class="w-full py-2 rounded bg-gray-100 hover:bg-gray-200 transition cursor-pointer border-1" @click="handleExportEncrypted">导出为加密文件</button>
        </div>
        <div v-if="panelType === 'import'" class="space-y-3">
          <button class="w-full py-2 rounded bg-gray-100 hover:bg-gray-200 transition cursor-pointer border-1" @click="handleImportMarkdown">从 Markdown 导入</button>
          <button class="w-full py-2 rounded bg-gray-100 hover:bg-gray-200 transition cursor-pointer border-1" @click="handleImportJSON">从 Json 导入</button>
          <button class="w-full py-2 rounded bg-gray-100 hover:bg-gray-200 transition cursor-pointer border-1" @click="handleImportEncrypted">从加密文件导入</button>
        </div>
        <button @click="closePanel" class="absolute top-2 right-3 bg-transparent border-none text-lg text-gray-400 hover:text-gray-600 cursor-pointer">✕</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useArticles } from '~/composables/useArticles.js'
import { useArticleImportExport } from '~/composables/useArticleImportExport.js'
import { alert, confirm } from '@/composables/useModal'
import { siteConfig } from '@/site.config.js'
import { useRouter } from 'vue-router'

const { articles, getList, deleteArticle, editSlug } = useArticles()
const { exportToMarkdown, exportToJSON, exportToEncrypted, importFromMarkdown, importFromMarkdownZip, importFromJSON, importFromEncrypted } = useArticleImportExport()

const router = useRouter()
const goCreate = () => {
  router.push('/articles/create')
}

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

// 删除全部文章
const deleteAll = async () => {
  // 获取文章数组
  const arr = Array.isArray(articles) ? articles : (articles?.value || [])
  if (!arr.length) {
    await alert('当前没有文章可删除。')
    return
  }

  const confirmed = await confirm('确定删除全部文章？此操作不可撤销。')
  if (!confirmed) return

  // 输入Yes确认
  const inputYes = await prompt('请输入 "Yes" 以确认删除全部文章：','No','确认删除','输入 "Yes" 进行删除')
  if (inputYes !== 'Yes') {
    await alert('操作已取消。')
    return
  }

  try {
    // 导出全部文章
    await alert('需要先导出文章才能删除')
    const backupResult = await exportToJSON()
    
    if (!backupResult) {
      const continueWithoutBackup = await confirm('导出失败，是否继续删除操作？')
      if (!continueWithoutBackup) {
        await alert('操作已取消。')
        return
      }
    } else {
      const backupConfirmed = await confirm('文章已导出，请检查备份文件。确认无误后点击"确定"继续删除。')
      if (!backupConfirmed) {
        await alert('操作已取消。')
        return
      }
    }

    // 逐条删除
    let deletedCount = 0
    let failedCount = 0
    
    for (const item of arr) {
      const slug = item?.slug ?? item
      try {
        await deleteArticle(slug)
        deletedCount++
      } catch (e) {
        console.error(`删除文章 ${slug} 失败:`, e)
        failedCount++
      }
    }

    let message = `删除完成！成功删除 ${deletedCount} 篇文章。`
    if (failedCount > 0) {
      message += `失败 ${failedCount} 篇文章。`
    }
    
    await alert(message)
    await getList()
    
  } catch (e) {
    console.error('删除全部文章时发生错误:', e)
    await alert('删除过程中发生错误，操作已中止。请检查控制台了解详情。')
  }
}

// 修改 slug
const handleEditSlug = async (article) => {
  const newSlug = await prompt('请输入新的 slug:', article.slug, '修改 Slug', '不能为空！')
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
  // 禁用页面滚动
  document.body.style.overflow = 'hidden'
  document.body.style.position = 'fixed'
  document.body.style.top = `-${window.scrollY}px`
  document.body.style.width = '100%'
}

const closePanel = () => {
  showPanel.value = false
  // 恢复页面滚动
  const scrollY = document.body.style.top
  document.body.style.overflow = ''
  document.body.style.position = ''
  document.body.style.top = ''
  document.body.style.width = ''
  if (scrollY) {
    window.scrollTo(0, parseInt(scrollY || '0') * -1)
  }
}

// 导出为 Markdown
const handleExportMarkdown = async () => {
  closePanel()
  const result = await exportToMarkdown()
  if (result) {
    await alert('导出成功！')
  }
}

// 导出为 JSON
const handleExportJSON = async () => {
  closePanel()
  const result = await exportToJSON()
  if (result) {
    await alert('导出成功！')
  }
}

// 导出为加密文件
const handleExportEncrypted = async () => {
  closePanel()
  await alert('将使用本站的API密钥进行加解密，若密钥被修改将无法导入！')
  const result = await exportToEncrypted()
  if (result) {
    await alert('导出成功！')
  }
}

// 从 Markdown 导入
const handleImportMarkdown = async () => {
  closePanel()

  const input = document.createElement('input')
  input.type = 'file'
  input.accept = '.zip,.md,.markdown'
  input.multiple = false
  
  input.onchange = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    
    let successCount = 0
    let failCount = 0
    
    // 检查文件类型
    if (file.name.endsWith('.zip')) {
      // 处理压缩包
      const result = await importFromMarkdownZip(file)
      if (result) {
        successCount = result.successCount
        failCount = result.failCount
      } else {
        failCount = 1
      }
    } else if (file.name.endsWith('.md') || file.name.endsWith('.markdown')) {
      // 处理单个 MD 文件
      const result = await importFromMarkdown(file)
      if (result) {
        successCount = 1
      } else {
        failCount = 1
      }
    } else {
      await alert('不支持的文件类型，请选择 .md/.markdown 文件或 .zip 压缩包')
      return
    }
    
    if (failCount > 0) {
      await alert(`导入完成！成功 ${successCount} 篇文章，失败 ${failCount} 篇文章。`)
    } else {
      await alert(`导入成功！共导入 ${successCount} 篇文章。`)
    }

    getList()
  }
  
  input.click()
}

// 从 JSON 导入
const handleImportJSON = async () => {
  closePanel()
  
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = '.json'
  
  input.onchange = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    
    const result = await importFromJSON(file)
    if (result) {
      getList()
    }
  }
  
  input.click()
}

// 从加密文件导入
const handleImportEncrypted = async () => {
  closePanel()
  
  await alert('将使用本站的API密钥进行解密，请确保密钥与导出时一致！')
  
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = '*'
  
  input.onchange = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    
    const result = await importFromEncrypted(file)
    if (result) {
      getList()
    }
  }
  
  input.click()
}
</script>