<template>
  <client-only>
    <MdEditor 
      ref="editorRef"
      v-model="localValue"
      :toolbars="toolbars"
      :onSave="props.handleSave"
      :onUploadImg="handleUploadImg"
    >
      <template #defToolbars>
        <NormalToolbar title="插入分享" @onClick="openShareDialog">
          <template #trigger>
            <svg class="md-editor-icon" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2z"/>
            </svg>
          </template>
        </NormalToolbar>
      </template>
    </MdEditor>
  </client-only>
  <ShareInsertDialog
    ref="shareDialogRef"
    :article-url="props.articleUrl"
    @insert="insertShareLink"
  />
</template>

<script setup>
import { ref, watch, onMounted } from 'vue'
import { MdEditor, NormalToolbar } from 'md-editor-v3'
import 'md-editor-v3/lib/style.css'
import ShareInsertDialog from '~/components/ShareInsertDialog.vue'
import { useS3 } from '@/composables/useS3'
import { useSettings } from '~/composables/useSettings.js'
import { showLoading, hideLoading } from '@/composables/useLoading'
import { alert } from '@/composables/useModal'

const props = defineProps({
  modelValue: String,
  onSave: Function,
  articleUrl: String
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

// 工具栏配置：在图片按钮（uploadImage）后插入自定义按钮（索引 0 对应 defToolbars 中第一个）
const toolbars = [
  'bold', 'underline', 'italic', '-title', 'title', 'strikeThrough', 'sub', 'sup',
  'quote', 'unorderedList', 'orderedList', 'task', '-row', 'codeRow', 'code',
  'link', 'image', 'uploadImage', 0, 'audio', 'video', 'html',
  '-left', 'revoke', 'next', 'save', '-',
  'pageFullscreen', 'fullscreen', 'preview', 'htmlPreview', 'catalog', 'github'
]

const editorRef = ref(null)
const shareDialogRef = ref(null)

// 转义 Markdown 链接文本中的特殊字符
function escapeMdText(text) {
  return String(text || '').replace(/([\\[\]])/g, '\\$1')
}

// 打开文件分享选择弹窗
function openShareDialog() {
  shareDialogRef.value?.open()
}

// 将分享链接以 Markdown 形式插入到光标处
function insertShareLink({ name, url }) {
  const text = `[${escapeMdText(name)}](${url})`
  if (editorRef.value && typeof editorRef.value.insert === 'function') {
    editorRef.value.insert(() => ({ targetValue: text, select: '' }))
  } else {
    // 兜底：追加到文末
    localValue.value = (localValue.value ? localValue.value + '\n\n' : '') + text
  }
}

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