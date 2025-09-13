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

const props = defineProps({ modelValue: String })
const emit = defineEmits(['update:modelValue'])

const localValue = ref(props.modelValue)

watch(localValue, val => emit('update:modelValue', val))

watch(() => props.modelValue, val => {
  if (val !== localValue.value) localValue.value = val
})

// 上传图片
const owner = 'zhengweixin0101'
const repo = 'CDN'
const branch = 'main'
const path = 'blog/posts'
const cdnBaseURL = 'https://cdn.zhengweixin.top/blog/posts/'
let token = ''

function getToken() {
  if (!token) token = localStorage.getItem('github_token') || ''
  if (!token) {
    const input = prompt('请输入 GitHub Token')
    if (!input) {
      window.history.back()
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
    if (!t) continue

    if (!/\.(png|jpe?g|gif|webp|svg)$/i.test(file.name)) {
      alert(`文件 ${file.name} 不是图片，已跳过`)
      continue
    }

    const reader = new FileReader()
    const urlPromise = new Promise((resolve, reject) => {
      reader.onload = async () => {
        try {
          const arrayBuffer = reader.result
          const bytes = new Uint8Array(arrayBuffer)
          let binary = ''
          for (let i = 0; i < bytes.byteLength; i++) {
            binary += String.fromCharCode(bytes[i])
          }
          const content = btoa(binary)

          const ext = file.name.substring(file.name.lastIndexOf('.')) || ''
          const timestamp = Date.now()
          const newFileName = `${timestamp}_${crypto.randomUUID().replace(/-/g, '')}${ext}`

          await axios.put(`https://api.github.com/repos/${owner}/${repo}/contents/${path}/${newFileName}`, {
            message: `Upload ${newFileName}`,
            content,
            branch
          }, {
            headers: { Authorization: `token ${t}` }
          })

          const cdnLink = `${cdnBaseURL}${newFileName}`
          uploadedUrls.push(cdnLink)
          resolve()
        } catch (err) {
          reject(err)
        }
      }
      reader.onerror = reject
      reader.readAsArrayBuffer(file)
    })

    try {
      await urlPromise
    } catch (err) {
      alert(`上传 ${file.name} 失败: ${err.message}`)
    }
  }

  callback(uploadedUrls)
}
</script>