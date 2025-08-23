<template>
  <div class="p-8">
    <h1 class="text-2xl font-bold mb-6">图片管理</h1>

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
      <svg class="w-12 h-12 text-gray-400 mb-2" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" d="M4 16v4a2 2 0 002 2h12a2 2 0 002-2v-4M12 12v8M12 12l-4-4m4 4l4-4M12 4v4" />
      </svg>
      <p class="text-gray-600 mb-1">点击选择文件或拖拽文件到此区域上传</p>
      <input ref="fileInput" type="file" class="hidden" multiple @change="handleFileSelect" />
    </div>

    <!-- 图片列表 -->
    <div class="columns-2 sm:columns-3 md:columns-4 lg:columns-5 gap-4">
      <div v-for="img in images" :key="img.name" class="mb-4 break-inside-avoid relative group rounded shadow overflow-hidden">
        <img :src="img.url" alt="image" class="w-full rounded" />
        <!-- 删除按钮 -->
        <button
          @click="confirmDelete(img)"
          class="absolute top-2 right-2 bg-red-500 text-white px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity"
        >
          删除
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import axios from 'axios'

const owner = 'zhengweixin0101'
const repo = 'CDN'
const branch = 'main'
const path = 'blog/posts'

const images = ref([])
const dragOver = ref(false)
const fileInput = ref(null)
let token = ''

function getToken() {
  if (!token) token = localStorage.getItem('github_token') || ''
  if (!token) {
    token = prompt('请输入 GitHub Token')
    if (token) localStorage.setItem('github_token', token)
  }
  return token
}

async function fetchImages() {
  const t = getToken()
  if (!t) return

  try {
    const res = await axios.get(`https://api.github.com/repos/${owner}/${repo}/contents/${path}?ref=${branch}`, {
      headers: { Authorization: `token ${t}` }
    })

    images.value = res.data
      .filter(item => item.type === 'file' && /\.(png|jpe?g|gif|webp|svg)$/i.test(item.name))
      .map(item => ({
        name: item.name,
        sha: item.sha,
        url: `https://cdn.zhengweixin.top/blog/posts/${item.name}`
      }))
  } catch (err) {
    alert('获取图片列表失败: ' + err.message)
  }
}

async function confirmDelete(img) {
  if (!confirm(`确定删除 ${img.name} 吗？`)) return
  const t = getToken()
  if (!t) return

  try {
    await axios.delete(`https://api.github.com/repos/${owner}/${repo}/contents/${path}/${img.name}`, {
      headers: { Authorization: `token ${t}` },
      data: { message: `Delete ${img.name}`, sha: img.sha, branch }
    })
    alert(`${img.name} 已删除`)
    fetchImages()
  } catch (err) {
    alert('删除失败: ' + err.message)
  }
}

function selectFile() {
  fileInput.value.click()
}

async function uploadFile(file) {
  const t = getToken()
  if (!t) return

  if (!/\.(png|jpe?g|gif|webp|svg)$/i.test(file.name)) {
    alert(`文件 ${file.name} 不是图片，已跳过`)
    return
  }

  const reader = new FileReader()
  reader.onload = async () => {
    const arrayBuffer = reader.result
    const bytes = new Uint8Array(arrayBuffer)
    let binary = ''
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i])
    }
    const content = btoa(binary)

    const ext = file.name.substring(file.name.lastIndexOf('.')) || ''
    const newFileName = crypto.randomUUID().replace(/-/g, '') + ext

    try {
      await axios.put(`https://api.github.com/repos/${owner}/${repo}/contents/${path}/${newFileName}`, {
        message: `Upload ${newFileName}`,
        content,
        branch
      }, {
        headers: { Authorization: `token ${t}` }
      })

      const cdnLink = `https://cdn.zhengweixin.top/blog/posts/${newFileName}`
      await navigator.clipboard.writeText(cdnLink)
      alert(`${newFileName} 上传成功！链接已复制到剪贴板。`)
      fetchImages()
    } catch (err) {
      alert('上传失败: ' + err.message)
    }
  }

  reader.readAsArrayBuffer(file)
}

function handleFileSelect(event) {
  const files = event.target.files
  if (!files.length) return

  for (const file of files) {
    uploadFile(file)
  }
}

function handleDrop(event) {
  dragOver.value = false
  const files = event.dataTransfer.files
  if (!files.length) return

  for (const file of files) {
    uploadFile(file)
  }
}

onMounted(fetchImages)
</script>