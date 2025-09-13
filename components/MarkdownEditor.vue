<template>
  <client-only>
    <MdEditor 
      v-model="localValue"
      :onSave="handleSave"
      :onUploadImg="handleUploadImg"
    />
  </client-only>
</template>

<script setup>
import { ref, watch } from 'vue'
import { MdEditor } from 'md-editor-v3'
import 'md-editor-v3/lib/style.css'
import axios from 'axios'

const props = defineProps({
  modelValue: String,
  onSave: Function
})
const emit = defineEmits(['update:modelValue'])

const localValue = ref(props.modelValue)
watch(localValue, val => emit('update:modelValue', val))
watch(() => props.modelValue, val => {
  if (val !== localValue.value) localValue.value = val
})

// 图片上传
const owner = 'zhengweixin0101'
const repo = 'CDN'
const branch = 'main'
const path = 'blog/posts'
const cdnBaseURL = 'https://cdn.zhengweixin.top/blog/posts/'
let token = ''

function getToken() {
  if (!token) token = localStorage.getItem('github_token') || ''
  while (!token) {
    const input = prompt('请输入 GitHub Token')?.trim()
    if (!input) {
      alert('操作已取消！')
      localStorage.removeItem('github_token')
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
    while (true) {
      const t = getToken()
      if (!t) break

      if (!/\.(png|jpe?g|gif|webp|svg)$/i.test(file.name)) {
        alert(`文件 ${file.name} 不是图片，已跳过`)
        break
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

        await axios.put(
          `https://api.github.com/repos/${owner}/${repo}/contents/${path}/${newFileName}`,
          { message: `Upload ${newFileName}`, content, branch },
          { headers: { Authorization: `token ${t}` } }
        )

        const cdnLink = `${cdnBaseURL}${newFileName}`
        await navigator.clipboard.writeText(cdnLink)
        alert(`${cdnLink} 上传成功！链接已复制到剪贴板。`)
        uploadedUrls.push(cdnLink)
        break

      } catch (err) {
        if (err.response && err.response.status === 401) {
          alert('GitHub Token 无效，请重新输入')
          localStorage.removeItem('github_token')
          token = ''
        } else {
          const retry = confirm(`上传 ${file.name} 失败: ${err.message}\n\n是否重试？`)
          if (!retry) break
          localStorage.removeItem('github_token')
          token = ''
        }
      }
    }
  }

  if (uploadedUrls.length > 0) callback(uploadedUrls)
}
</script>