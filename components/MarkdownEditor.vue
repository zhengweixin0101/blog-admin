<template>
  <client-only>
    <MdEditor 
      v-model="localValue"
      :onSave="props.handleSave"
      :onUploadImg="handleUploadImg"
    />
  </client-only>
</template>

<script setup>
import { ref, watch } from 'vue'
import { MdEditor } from 'md-editor-v3'
import 'md-editor-v3/lib/style.css'
import axios from 'axios'
import { siteConfig } from '@/site.config.js'

const props = defineProps({
  modelValue: String,
  onSave: Function
})
const emit = defineEmits(['update:modelValue'])

const localValue = ref(props.modelValue)
watch(() => props.modelValue, val => localValue.value = val)
watch(localValue, val => emit('update:modelValue', val))

// 本地缓存操作
function saveImagesToCache(list) {
  try {
    localStorage.setItem('images_cache', JSON.stringify(list))
  } catch (err) {
    alert('保存缓存失败' + err.message)
  }
}

function loadImagesFromCache() {
  try {
    const cached = localStorage.getItem('images_cache')
    const parsed = cached ? JSON.parse(cached) : []
    return Array.isArray(parsed) ? parsed : []
  } catch (err) {
    console.warn('读取缓存失败', err)
    return []
  }
}

// 图片上传
const owner = siteConfig.image.owner
const repo = siteConfig.image.repo
const branch = siteConfig.image.branch
const path = siteConfig.image.path
const cdnBaseURL = siteConfig.image.cdnBaseUrl
let token = ''

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

async function handleUploadImg(files, callback) {
  const uploadedUrls = []

  for (const file of files) {
    const t = getToken()
    if (!t) break

    if (!/\.(png|jpe?g|gif|webp|svg)$/i.test(file.name)) {
      alert(`文件 ${file.name} 不是图片，已跳过`)
      continue
    }

    try {
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

      const res = await axios.put(
        `https://api.github.com/repos/${owner}/${repo}/contents/${path}/${newFileName}`,
        { message: `Upload ${newFileName}`, content, branch },
        { headers: { Authorization: `token ${t}` } }
      )

      const cdnLink = `${cdnBaseURL}${newFileName}`
      uploadedUrls.push(cdnLink)

      const cachedList = loadImagesFromCache()
      cachedList.unshift({
        name: newFileName,
        sha: res.data.content.sha,
        url: cdnLink,
        timestamp
      })
      saveImagesToCache(cachedList)
    } catch (err) {
      if (err.response && err.response.status === 401) {
        alert('GitHub Token 无效，请重新输入')
        localStorage.removeItem('github_token')
        token = ''
      } else {
        const retry = confirm(`上传 ${file.name} 失败: ${err.message}\n是否重试？`)
        if (!retry) break
        localStorage.removeItem('github_token')
        token = ''
      }
    }
  }

  if (uploadedUrls.length > 0) {
    callback(uploadedUrls)
    alert(`上传成功！共 ${uploadedUrls.length} 张图片，链接已复制到剪贴板。`)
    await navigator.clipboard.writeText(uploadedUrls.join('\n'))
  }
}
</script>