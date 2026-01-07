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
import CryptoJS from 'crypto-js'
import { useS3 } from '@/composables/useS3'
import { showLoading, hideLoading } from '@/composables/useLoading'
import { useApiKey } from '@/composables/useApiKey.js'

const props = defineProps({
  modelValue: String,
  onSave: Function
})
const emit = defineEmits(['update:modelValue'])

const localValue = ref(props.modelValue)
watch(() => props.modelValue, val => localValue.value = val)
watch(localValue, val => emit('update:modelValue', val))

const { getKey } = useApiKey()

// S3 配置
function getApiKey() {
  return getKey()
}

function decryptConfig(cipherText, apiKey) {
  try {
    const bytes = CryptoJS.AES.decrypt(cipherText, apiKey)
    return JSON.parse(bytes.toString(CryptoJS.enc.Utf8))
  } catch {
    return {}
  }
}

function getS3Config() {
  const apiKey = getApiKey()
  const saved = localStorage.getItem('s3_config')
  if (!saved || !apiKey) return null
  return decryptConfig(saved, apiKey)
}

// S3 图片上传
async function handleUploadImg(files, callback) {
  const config = getS3Config()
  if (!config) {
    await alert('S3 配置缺失，请先在图片管理页面填写并保存 S3 配置！')
    return
  }

  // 过滤图片文件
  const imageFiles = Array.from(files).filter(
    file => file.type && file.type.startsWith('image/')
  )

  if (imageFiles.length === 0) {
    await alert('请选择图片文件！')
    return
  }

  try {
    showLoading(`正在上传 ${imageFiles.length} 张图片...`)
    
    const apiKey = localStorage.getItem('api_key')
    const s3 = useS3({ apiKey, config })
    
    const urls = await s3.uploadFiles({
      files: imageFiles,
      cfg: config,
      prefix: 'blog/posts/',
      customDomain: config.customDomain
    })

    if (urls.length > 0) {
      callback(urls)
      hideLoading()
      await alert(`上传成功！共 ${urls.length} 张图片，链接已复制到剪贴板。`)
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(urls.join('\n'))
      }
    } else {
      hideLoading()
    }
  } catch (err) {
    console.error('上传失败:', err)
    hideLoading()
    await alert('上传失败，请重试')
  }
}
</script>