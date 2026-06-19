<template>
  <div v-if="visible" class="fixed inset-0 bg-black/40 flex items-center justify-center" style="z-index: 99999">
    <div class="bg-white rounded-lg shadow-lg p-6 w-96 max-w-lg relative">
      <div class="flex justify-between items-center">
        <h2 class="text-lg font-bold text-center flex-1">上传图片</h2>
        <button @click="handleCancel" class="absolute top-2 right-3 bg-transparent border-none text-lg text-gray-400 hover:text-gray-600 cursor-pointer">✕</button>
      </div>

      <div>
        <p class="text-sm text-gray-600 mb-2 truncate" :title="fileName">文件名：{{ fileName }}</p>
        <div class="flex gap-3 text-sm bg-blue-50 p-2 rounded">
          <div class="flex-1">
            <p class="font-semibold text-blue-800">原图</p>
            <p>大小：{{ formatFileSize(originalSize) }}</p>
            <p>尺寸：{{ originalDimensions }}</p>
          </div>
          <div class="flex-1">
            <p class="font-semibold text-green-800">压缩后</p>
            <p>大小：{{ formatFileSize(compressedSize) }}</p>
            <p>尺寸：{{ compressedDimensions }}</p>
          </div>
        </div>
      </div>

      <div class="flex mt-3 mb-6 justify-center">
        <div class="flex-1 max-w-[160px]">
          <div class="overflow-hidden h-32 flex items-center justify-center">
            <img v-if="originalUrl" :src="originalUrl" alt="原图" style="max-width: 160px; max-height: 128px; width: auto; height: auto; object-fit: contain;" />
          </div>
        </div>
        <div class="flex-1 max-w-[160px]">
          <div class="overflow-hidden h-32 flex items-center justify-center">
            <img v-if="compressedUrl" :src="compressedUrl" alt="压缩后" style="max-width: 160px; max-height: 128px; width: auto; height: auto; object-fit: contain;" />
          </div>
        </div>
      </div>

      <div class="flex gap-2 justify-end">
        <button @click="handleSkip" class="px-4 py-2 bg-gray-400 text-white rounded hover:bg-gray-500 transition border-none cursor-pointer">使用原图</button>
        <button @click="handleCompress" class="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition border-none cursor-pointer">使用压缩图</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, onUnmounted } from 'vue'

const props = defineProps({
  visible: Boolean,
  originalFile: Object,
  compressedResult: Object
})

const emit = defineEmits(['confirm', 'skip', 'cancel'])

const originalUrl = ref('')
const compressedUrl = ref('')
const originalDimensions = ref('加载中...')
const compressedDimensions = ref('加载中...')
const fileName = ref('')
const originalSize = ref(0)
const compressedSize = ref(0)

function formatFileSize(bytes) {
  if (!bytes || bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

function getImageDimensions(file) {
  return new Promise((resolve) => {
    const img = new Image()
    img.onload = () => resolve(`${img.width} × ${img.height}`)
    img.onerror = () => resolve('未知')
    img.src = URL.createObjectURL(file)
  })
}

watch(() => props.visible, async (val) => {
  if (val && props.originalFile && props.compressedResult) {
    fileName.value = props.originalFile.name
    originalSize.value = props.originalFile.size
    compressedSize.value = props.compressedResult.compressedSize

    URL.revokeObjectURL(originalUrl.value)
    URL.revokeObjectURL(compressedUrl.value)
    originalUrl.value = URL.createObjectURL(props.originalFile)
    compressedUrl.value = URL.createObjectURL(props.compressedResult.file)

    const [origDims, compDims] = await Promise.all([
      getImageDimensions(props.originalFile),
      getImageDimensions(props.compressedResult.file)
    ])
    originalDimensions.value = origDims
    compressedDimensions.value = compDims
  }
})

function cleanup() {
  URL.revokeObjectURL(originalUrl.value)
  URL.revokeObjectURL(compressedUrl.value)
}

function handleCompress() {
  cleanup()
  emit('confirm')
}

function handleSkip() {
  cleanup()
  emit('skip')
}

function handleCancel() {
  cleanup()
  emit('cancel')
}

onUnmounted(() => {
  cleanup()
})
</script>
