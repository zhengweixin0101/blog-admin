<template>
  <div class="p-8">
    <h1 class="text-2xl font-bold mb-6">图片管理</h1>

    <div class="mb-4 flex gap-2">
      <button @click="refreshImages" class="px-4 py-2 bg-blue-500 text-white rounded border-none hover:bg-blue-600 cursor-pointer">
        刷新缓存
      </button>

      <button @click="clearToken" class="px-4 py-2 bg-red-500 text-white rounded border-none hover:bg-red-600 cursor-pointer">
        删除 Token
      </button>
    </div>

    <!-- 上传区域 -->
    <div
      ref="uploadArea"
      class="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg mb-6 p-8 flex flex-col items-center justify-center text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors"
      @click="selectFile"
      @dragover.prevent="dragOver = true"
      @dragleave.prevent="dragOver = false"
      @drop.prevent="handleDrop"
      :class="{ 'bg-blue-50 border-blue-400': dragOver }"
    >
      <svg t="1757760551745" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="5687" width="48" height="48"><path d="M112 928a47.936 47.936 0 0 1-47.936-47.936v-224a48 48 0 1 1 96 0v176.064h704v-176.064a48 48 0 1 1 96 0v224a47.936 47.936 0 0 1-47.936 47.936z m352-263.936v-416L327.744 364.48a48.32 48.32 0 0 1-31.232 11.584 47.296 47.296 0 0 1-36.352-16.896 47.808 47.808 0 0 1 5.312-67.648l215.424-184.128a48.32 48.32 0 0 1 62.336 0l215.232 184.128a48 48 0 0 1-62.336 72.96L559.872 248.064v416a48 48 0 0 1-96 0z" fill="#585858" p-id="5688"></path></svg>
      <p class="text-gray-600 mb-1">点击选择文件或拖拽文件到此区域上传</p>
      <input ref="fileInput" type="file" class="hidden" multiple @change="handleFileSelect" />
    </div>

    <!-- 图片列表 -->
    <div ref="masonryContainer" class="w-full">
      <div
        v-for="img in images"
        :key="img.sha"
        class="mb-4 relative group rounded-lg overflow-hidden shadow-2xl"
      >
        <img
          :src="img.url"
          alt="image"
          class="w-full block"
          @click="copyLink(img.url)"
        />
        <button
          @click="confirmDelete(img)"
          class="absolute top-2 right-2 bg-red-500 text-white px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
        >
          删除
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick } from 'vue'
import { siteConfig } from '@/site.Config.js'
import axios from 'axios'
import imagesLoaded from 'imagesloaded'

const owner = siteConfig.image.owner
const repo = siteConfig.image.repo
const branch = siteConfig.image.branch
const path = siteConfig.image.path
const cdnBaseURL = siteConfig.image.cdnBaseUrl

const images = ref([])
const dragOver = ref(false)
const fileInput = ref(null)
const masonryContainer = ref(null)
let token = ''
let macyInstance = null

// 缓存有效期
const CACHE_DURATION = siteConfig.image.cacheDuration || 30 * 60 * 1000

// 保存缓存
function saveImagesToCache(list) {
  try {
    const data = {
      timestamp: Date.now(),
      images: list
    }
    localStorage.setItem('images_cache', JSON.stringify(data))
  } catch (err) {
    console.warn('缓存保存失败', err)
  }
}

// 读取本地缓存
function loadImagesFromCache() {
  try {
    const cached = localStorage.getItem('images_cache')
    if (!cached) return []
    const data = JSON.parse(cached)
    if (Date.now() - data.timestamp > CACHE_DURATION) {
      alert('缓存过期，重新拉取')
      return []
    }
    return data.images || []
  } catch {
    return []
  }
}

// 获取Token
function getToken() {
  if (token) return token
  token = localStorage.getItem('github_token') || ''
  if (!token) {
    const input = prompt('请输入 GitHub Token')?.trim()
    if (!input) {
      alert('操作已取消！')
      return null
    }
    token = input
    localStorage.setItem('github_token', token)
  }
  return token
}

// 删除 Token
function clearToken() {
  if (confirm('确定删除已保存的 GitHub Token 吗？')) {
    localStorage.removeItem('github_token')
    token = ''
    alert('GitHub Token 已删除，下次操作将需要重新输入。')
  }
}

// Masonry
async function initMasonry() {
  if (typeof window === 'undefined' || !masonryContainer.value) return
  const Macy = (await import('macy')).default
  await nextTick()
  imagesLoaded(masonryContainer.value, () => {
    if (macyInstance) {
      macyInstance.reInit()
    } else {
      macyInstance = Macy({
        container: masonryContainer.value,
        trueOrder: false,
        waitForImages: true,
        margin: 14,
        columns: 5,
        breakAt: { 640: 1, 1024: 2, 1280: 3, 1920: 4, 2560: 5 }
      })
    }
  })
}

// 获取列表
async function fetchImagesFromGitHub() {
  const t = getToken()
  if (!t) return null
  try {
    const res = await axios.get(`https://api.github.com/repos/${owner}/${repo}/contents/${path}?ref=${branch}`, {
      headers: { Authorization: `token ${t}` }
    })
    const list = res.data
      .filter(item => item.type === 'file' && /\.(png|jpe?g|gif|webp|svg)$/i.test(item.name))
      .map(item => ({
        name: item.name,
        sha: item.sha,
        url: `${cdnBaseURL}${item.name}`,
        timestamp: parseInt(item.name.split('_')[0]) || 0
      }))
      .sort((a, b) => b.timestamp - a.timestamp)
    return list
  } catch (err) {
    console.warn('获取 GitHub 列表失败', err)
    return null
  }
}

// 刷新列表
async function refreshImages() {
  const list = await fetchImagesFromGitHub()
  if (list) {
    images.value = list
    saveImagesToCache(list)
    alert('刷新成功！')
    await nextTick()
    initMasonry()
  }
}

// 上传
function selectFile() {
  fileInput.value.click()
}

function handleFileSelect(e) {
  const files = e.target.files
  for (const file of files) uploadFile(file)
}

function handleDrop(e) {
  dragOver.value = false
  const files = e.dataTransfer.files
  for (const file of files) uploadFile(file)
}

async function uploadFile(file) {
  const t = getToken()
  if (!t) return

  if (!/\.(png|jpe?g|gif|webp|svg)$/i.test(file.name)) {
    alert(`文件 ${file.name} 不是图片，已跳过`)
    return
  }

  const arrayBuffer = await new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = reject
    reader.readAsArrayBuffer(file)
  })

  const bytes = new Uint8Array(arrayBuffer)
  let binary = ''
  for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i])
  const content = btoa(binary)

  const ext = file.name.substring(file.name.lastIndexOf('.')) || ''
  const timestamp = Date.now()
  const newFileName = `${timestamp}_${crypto.randomUUID().replace(/-/g, '')}${ext}`

  try {
    const res = await axios.put(
      `https://api.github.com/repos/${owner}/${repo}/contents/${path}/${newFileName}`,
      { message: `Upload ${newFileName}`, content, branch },
      { headers: { Authorization: `token ${t}` } }
    )

    const cdnLink = `${cdnBaseURL}${newFileName}`
    images.value.unshift({
      name: newFileName,
      sha: res.data.content.sha,
      url: cdnLink,
      timestamp
    })
    saveImagesToCache(images.value)

    await nextTick()
    if (macyInstance) macyInstance.reInit()

    alert(`${newFileName}\n上传成功！链接已复制到剪贴板。`)
    await navigator.clipboard.writeText(cdnLink)
  } catch (err) {
    alert('上传失败: ' + err.message)
  }
}

// 删除
async function confirmDelete(img) {
  if (!confirm(`确定删除 ${img.name} 吗？`)) return
  const t = getToken()
  if (!t) return

  try {
    await axios.delete(`https://api.github.com/repos/${owner}/${repo}/contents/${path}/${img.name}`, {
      headers: { Authorization: `token ${t}` },
      data: { message: `Delete ${img.name}`, sha: img.sha, branch }
    })

    images.value = images.value.filter(i => i.sha !== img.sha)
    saveImagesToCache(images.value)

    await nextTick()
    if (macyInstance) macyInstance.reInit()

    alert(`${img.name} 已删除`)
  } catch (err) {
    if (err.response && err.response.status === 404) {
      images.value = images.value.filter(i => i.name !== img.name || i.sha !== img.sha)
      saveImagesToCache(images.value)

      await nextTick()
      if (macyInstance) macyInstance.reInit()

      alert(`${img.name} 在 GitHub 上已不存在，本地列表已移除`)
    } else {
      alert('删除失败: ' + err.message)
    }
  }
}

// 复制链接
async function copyLink(url) {
  try {
    await navigator.clipboard.writeText(url)
    alert('图片链接已复制到剪贴板:\n' + url)
  } catch (err) {
    alert('复制失败: ' + err.message)
  }
}

// 初始化
onMounted(async () => {
  images.value = loadImagesFromCache()
  await nextTick()
  initMasonry()

  if (!images.value.length) refreshImages()
})
</script>