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
import { ref, watch, onMounted } from 'vue'
import { MdEditor } from 'md-editor-v3'
import 'md-editor-v3/lib/style.css'
import { useS3 } from '@/composables/useS3'
import { useSettings } from '~/composables/useSettings.js'
import { showLoading, hideLoading } from '@/composables/useLoading'
import { alert } from '@/composables/useModal'

const props = defineProps({
  modelValue: String,
  onSave: Function
})
const emit = defineEmits(['update:modelValue'])

const { getConfig } = useSettings()

const localValue = ref(props.modelValue)
watch(() => props.modelValue, val => localValue.value = val)
watch(localValue, val => emit('update:modelValue', val))

const s3Config = ref(null)
let s3 = null

// 初始化 S3 配置
async function loadS3Config() {
  if (import.meta.client) {
    try {
      const result = await getConfig('s3_config')
      if (result.success && result.data && result.data.value) {
        const config = JSON.parse(result.data.value)
        s3Config.value = config
        s3 = useS3({ config })
      }
    } catch (error) {
      // 配置不存在或其他错误
    }
  }
}
onMounted(loadS3Config)

// S3 图片上传
async function handleUploadImg(files, callback) {
  if (!s3Config.value || !s3) {
    await alert('S3 配置缺失，请先在设置页面的"存储配置"标签页中配置 S3 存储！')
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

    const urls = await s3.uploadFiles({
      files: imageFiles,
      cfg: s3Config.value,
      prefix: 'blog/posts/',
      customDomain: s3Config.value.customDomain
        ? (s3Config.value.customDomain.endsWith('/')
            ? s3Config.value.customDomain
            : s3Config.value.customDomain + '/')
        : ''
    })

    if (urls.length > 0) {
      callback(urls)
      hideLoading()
      await alert(`上传成功！共 ${urls.length} 张图片`)
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(urls.join('\n'))
      }
    } else {
      hideLoading()
    }
  } catch (err) {
    hideLoading()
    await alert('上传失败，请重试')
  }
}
</script>