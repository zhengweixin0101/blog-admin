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
import { S3Client } from '@aws-sdk/client-s3'
import { Upload } from "@aws-sdk/lib-storage"

const props = defineProps({
  modelValue: String,
  onSave: Function
})
const emit = defineEmits(['update:modelValue'])

const localValue = ref(props.modelValue)
watch(() => props.modelValue, val => localValue.value = val)
watch(localValue, val => emit('update:modelValue', val))

// S3 配置
function getApiKey() {
  return localStorage.getItem('api_key')
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

function getS3Client(config) {
  return new S3Client({
    region: config.region || 'auto',
    endpoint: config.endpoint,
    credentials: {
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey
    }
  })
}

// S3 图片上传
async function handleUploadImg(files, callback) {
  const config = getS3Config()
  if (!config) {
    await alert('S3 配置缺失，请先在图片管理页面填写并保存 S3 配置！')
    return
  }
  const uploadedUrls = []
  const client = getS3Client(config)
  const bucket = config.bucket
  const customDomain = config.customDomain

  for (const file of files) {
    if (!/\.(png|jpe?g|gif|webp|svg)$/i.test(file.name)) {
      await alert(`文件 ${file.name} 不是图片，已跳过`)
      continue
    }
    const ext = file.name.substring(file.name.lastIndexOf('.')) || ''
    const timestamp = Date.now()
    const randomId = crypto.randomUUID().replace(/-/g, '')
    const key = `blog/posts/${timestamp}_${randomId}${ext}`
    const url = `${customDomain}${key}`

    try {
      const parallelUpload = new Upload({
        client,
        params: {
          Bucket: bucket,
          Key: key,
          Body: file,
          ContentType: file.type
        }
      })
      await parallelUpload.done()
      uploadedUrls.push(url)

    } catch (err) {
      await alert(`上传 ${file.name} 失败`)
      break
    }
  }

  if (uploadedUrls.length > 0) {
    callback(uploadedUrls)
    await alert(`上传成功！共 ${uploadedUrls.length} 张图片，链接已复制到剪贴板。`)
    if (navigator.clipboard) {
      await navigator.clipboard.writeText(uploadedUrls.join('\n'))
    }
  }
}
</script>