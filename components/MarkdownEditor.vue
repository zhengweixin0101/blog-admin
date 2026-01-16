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
import { useS3 } from '@/composables/useS3'
import { showLoading, hideLoading } from '@/composables/useLoading'

const props = defineProps({
  modelValue: String,
  onSave: Function
})
const emit = defineEmits(['update:modelValue'])

const localValue = ref(props.modelValue)
watch(() => props.modelValue, val => localValue.value = val)
watch(localValue, val => emit('update:modelValue', val))

function getS3Config() {
  const saved = typeof localStorage !== 'undefined' && localStorage.getItem('s3_config')
  if (!saved) return null

  const s3 = useS3()
  return s3.decryptConfig(saved)
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
    
    const s3 = useS3({ config })
    
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