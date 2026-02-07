<template>
  <div class="p-8">
    <h1 class="text-2xl font-bold mb-6">图片管理</h1>
    <div v-if="!isConfigured" class="flex items-center justify-center min-h-[60vh]">
      <div class="max-w-md bg-gray-100 p-6 rounded shadow text-center">
        <h2 class="text-xl font-semibold mb-4">未配置 S3 存储</h2>
        <p class="text-sm text-gray-600 mb-4">请先在"设置"页面的"存储配置"标签页中配置 S3 存储信息</p>
        <button
          @click="goToSettings"
          class="px-6 py-2 bg-blue-600 text-white rounded border-none hover:bg-blue-700 transition-colors cursor-pointer"
        >
          前往设置
        </button>
      </div>
    </div>
    <div v-else>
      <div class="mb-4 flex gap-2 items-center">
        <div class="flex gap-2">
          <button
            v-for="path in paths"
            :key="path.prefix"
            @click="switchPrefix(path.prefix)"
            :class="currentPrefix === path.prefix ? 'bg-blue-600 text-white' : 'bg-gray-200 hover:bg-gray-300 transition-colors'"
            class="px-4 py-2 rounded border-none cursor-pointer"
          >
            {{ path.label }}
          </button>
        </div>
        <label for="viewModeSelect" class="ml-4 text-sm">显示模式:</label>
        <select
          id="viewModeSelect"
          v-model="viewMode"
          @change="switchView(viewMode)"
          class="px-3 py-1 border rounded bg-white text-gray-800"
        >
          <option value="masonry">瀑布流</option>
          <option value="list">列表</option>
        </select>
        <div class="ml-auto flex gap-2 items-center">
          <div class="flex w-64">
            <input
              @keydown.enter.prevent="handleDeleteByUrl(deleteUrl)"
              v-model="deleteUrl"
              placeholder="输入图片链接"
              class="flex-1 px-4 py-2 border border-gray-300 rounded-l-md outline-none"
            />
            <button
              @click="handleDeleteByUrl(deleteUrl)"
              class="px-4 py-2 bg-red-500 text-white rounded-r-md hover:bg-red-600 border-none transition-colors cursor-pointer"
            >
              删除
            </button>
          </div>
        </div>
      </div>
      <div
        ref="uploadArea"
        class="border-2 border-dashed border-gray-300 rounded-lg mb-6 p-8 flex flex-col items-center justify-center text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors"
        @click="selectFile"
        @dragover.prevent="dragOver = true"
        @dragleave.prevent="dragOver = false"
        @drop.prevent="handleDrop"
        :class="{ 'bg-blue-50 border-blue-400': dragOver }"
      >
        <svg class="icon" viewBox="0 0 1024 1024" width="48" height="48">
          <path d="M112 928a47.936 47.936 0 0 1-47.936-47.936v-224a48 48 0 1 1 96 0v176.064h704v-176.064a48 48 0 1 1 96 0v224a47.936 47.936 0 0 1-47.936 47.936z m352-263.936v-416L327.744 364.48a48.32 48.32 0 0 1-31.232 11.584 47.296 47.296 0 0 1-36.352-16.896 47.808 47.808 0 0 1 5.312-67.648l215.424-184.128a48.32 48.32 0 0 1 62.336 0l215.232 184.128a48 48 0 0 1-62.336 72.96L559.872 248.064v416a48 48 0 0 1-96 0z" fill="#585858"/>
        </svg>
        <p class="text-gray-600 mb-1">点击选择文件或拖拽文件到此区域上传</p>
        <input ref="fileInput" type="file" class="hidden" multiple accept="image/*" @change="handleFileSelect" />
        <p class="text-sm text-gray-400 mt-2">当前路径：{{ currentPrefix === '' ? '/' : currentPrefix }}</p>
      </div>
      <client-only>
        <div v-if="files.length === 0 && !loading" class="py-16">
            <p class="text-gray-400 mb-6 max-w-sm mx-auto">
              {{ currentPrefix === '' ? '开始上传您的第一张图片吧' : `当前路径 "${currentPrefix === '' ? '/' : currentPrefix}" 下暂无图片` }}
            </p>
        </div>

        <div v-else-if="viewMode === 'masonry'" ref="masonryContainer" class="w-full">
          <div
            v-for="file in files"
            :key="file.key"
            class="mb-4 relative group rounded-lg overflow-hidden shadow-2xl min-h-18"
          >
            <img
              :src="`${customDomain}${file.key}`"
              alt="image"
              class="w-full block cursor-pointer"
              @click="copyLink(`${customDomain}${file.key}`)"
            />
            <div class="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-3 opacity-0 group-hover:opacity-100 transition-opacity">
              <div class="text-white text-sm truncate">{{ file.key }}</div>
              <div class="text-white/80 text-xs mt-1">{{ formatFileSize(file.size) }} · {{ formatExactTime(file.lastModified) }}</div>
            </div>
            <div class="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                @click="previewImage(`${customDomain}${file.key}`)"
                class="bg-blue-500 text-white px-2 py-1 border-none rounded cursor-pointer hover:bg-blue-600 transition-colors cursor-pointer"
              >
                预览
              </button>
              <button
                @click="handleDeleteFile(file)"
                class="bg-red-500 text-white px-2 py-1 border-none rounded cursor-pointer hover:bg-red-600 transition-colors cursor-pointer"
              >
                删除
              </button>
            </div>
          </div>
        </div>

        <div v-else-if="viewMode === 'list'" class="flex flex-col gap-2">
          <div
            v-for="file in files"
            :key="file.key"
            class="flex items-center justify-between p-2 border rounded hover:bg-gray-50 transition-colors"
          >
            <div class="flex-1 min-w-0">
              <div class="truncate font-medium">{{ file.key }}</div>
            </div>
            <div class="flex items-center gap-4">
              <div class="text-sm text-gray-500 whitespace-nowrap">{{ formatExactTime(file.lastModified) }}</div>
              <div class="text-sm text-gray-500 whitespace-nowrap">{{ formatFileSize(file.size) }}</div>
              <div class="flex gap-2">
                <button
                  @click="previewImage(`${customDomain}${file.key}`)"
                  class="px-2 py-1 bg-blue-500 text-white border-none rounded hover:bg-blue-600 transition-colors cursor-pointer"
                >
                  预览
                </button>
                <button
                  @click="copyLink(`${customDomain}${file.key}`)"
                  class="px-2 py-1 bg-blue-500 text-white border-none rounded hover:bg-blue-600 transition-colors cursor-pointer"
                >
                  复制链接
                </button>
                <button
                  @click="handleDeleteFile(file)"
                  class="px-2 py-1 bg-red-500 text-white border-none rounded hover:bg-red-600 transition-colors cursor-pointer"
                >
                  删除
                </button>
              </div>
            </div>
          </div>
        </div>
      </client-only>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick } from 'vue'
import { useS3 } from '@/composables/useS3.js'
import { alert } from '@/composables/useModal'
import { showLoading, hideLoading } from '@/composables/useLoading.js'
import { useSettings } from '~/composables/useSettings.js'
import { Fancybox } from '@fancyapps/ui'
import '@fancyapps/ui/dist/fancybox/fancybox.css'

const { getConfig } = useSettings()

const customDomain = ref('')
const isConfigured = ref(false)
const dragOver = ref(false)
const loading = ref(false)
const files = ref([])
const masonryContainer = ref(null)
const uploadProgress = ref({})
const deleteUrl = ref('');
let macyInstance = null

const paths = [
  { label: '文章图片', prefix: 'blog/posts/' },
  { label: '说说图片', prefix: 'talks/' },
  { label: '评论图片', prefix: 'blog/comments' },
  { label: '全部图片', prefix: '' },
]
const currentPrefix = ref(paths[0].prefix)

const viewMode = ref('list')
onMounted(() => {
  // 只在客户端执行
  const savedMode = localStorage.getItem('viewMode')
  if (savedMode) viewMode.value = savedMode
})

// 切换路径
async function switchPrefix(prefix) {
  currentPrefix.value = prefix
  files.value = []
  uploadProgress.value = {}
  await listFiles()
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

// 切换视图
function switchView(mode) {
  viewMode.value = mode
  localStorage.setItem('viewMode', mode)
  if (mode === 'masonry') {
    nextTick(() => initMasonry())
  }
}

const s3Config = ref({})
let s3 = null

async function loadConfig() {
  if (import.meta.client) {
    try {
      const result = await getConfig('s3_config')
      if (result.success && result.data && result.data.value) {
        const config = JSON.parse(result.data.value)
        s3 = useS3()
        customDomain.value = config.customDomain ? (config.customDomain.endsWith('/') ? config.customDomain : config.customDomain + '/') : ''
        s3Config.value = config
        if (config.bucket && config.endpoint && config.accessKeyId && config.secretAccessKey) {
          isConfigured.value = true
          listFiles()
        }
      }
    } catch (error) {
      // 配置不存在或其他错误，显示未配置界面
    }
  }
}

onMounted(loadConfig)

async function listFiles() {
  loading.value = true
  files.value = []
  showLoading('正在加载图片列表...')
  try {
    const result = await s3.listFiles({ prefix: currentPrefix.value, cfg: s3Config.value })
    files.value = result
    await nextTick()
    await waitForImagesToLoad()
    await initMasonry()
  } catch (e) {
    await alert('无法获取文件列表')
  } finally {
    loading.value = false
    hideLoading()
  }
}

async function handleFileSelect(e) {
  const selectedFiles = Array.from(e.target.files)
  await uploadFiles(selectedFiles)
}

async function handleDrop(e) {
  dragOver.value = false
  const droppedFiles = Array.from(e.dataTransfer.files)
  await uploadFiles(droppedFiles)
}

function selectFile() {
  const input = document.createElement('input')
  input.type = 'file'
  input.multiple = true
  input.accept = 'image/*'
  input.onchange = handleFileSelect
  input.click()
}

async function uploadFiles(selectedFiles) {
  if (!selectedFiles || selectedFiles.length === 0) return

  const imageFiles = Array.from(selectedFiles).filter(
    file => file.type && file.type.startsWith('image/')
  )

  if (imageFiles.length === 0) {
    await alert('请选择图片文件！')
    return
  }

  if (imageFiles.length < selectedFiles.length) {
    await alert(`已自动忽略非图片文件，共上传 ${imageFiles.length} 张图片`)
  }

  showLoading('正在上传图片...')
  try {
    const urls = await s3.uploadFiles({
      files: imageFiles,
      cfg: s3Config.value,
      prefix: currentPrefix.value,
      customDomain: customDomain.value,
      onProgressCb: (name, percent) => {
        uploadProgress.value[name] = percent
      }
    })

    await listFiles()

    if (urls.length > 0 && navigator.clipboard) {
      await navigator.clipboard.writeText(urls.join('\n'))
      await alert(`上传成功！共 ${urls.length} 张图片，链接已复制到剪贴板。`)
    }
  } catch (e) {
    await alert('上传失败，请重试')
  } finally {
    hideLoading()
  }
}

async function handleDeleteFile(file) {
  showLoading('正在删除图片...')
  try {
    const exists = await existsKey(file.key)
    if (exists !== true) {
      hideLoading()
      await alert('文件不存在或无法确认。')
      await listFiles()
      return
    }

    await s3.deleteFile({ fileKey: file.key, cfg: s3Config.value })
    const status = await checkDeletion(file.key)
    hideLoading()
    if (status === 'deleted') {
      await alert('图片删除成功！')
    } else if (status === 'exists') {
      await alert('删除失败：文件仍然存在，请检查权限或稍后重试。')
    } else {
      await alert('已发送删除请求，但无法确认删除状态，请自行检查。')
    }
    await listFiles()
  } catch (e) {
    hideLoading()
    await alert('删除失败，请重试！')
  }
}

// 短暂等待
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

// 规范化 key 比较
function normalizeKey(k) {
  if (typeof k !== 'string') return k
  return k.startsWith('/') ? k.slice(1) : k
}

// 对文件直链执行 HEAD 检查
// 返回 true 存在， false 不存在， null 无法判断
async function headCheck(key, retries = 2, interval = 300) {
  if (!customDomain.value) return null
  const url = customDomain.value.endsWith('/') ? `${customDomain.value}${key}` : `${customDomain.value}/${key}`
  for (let i = 0; i < retries; i++) {
    try {
      const resp = await fetch(url, { method: 'HEAD', cache: 'no-store' })
      if (resp.status === 404) return false
      if (resp.ok) return true
    } catch (e) {
      // ignore error
    }
    await sleep(interval)
  }
  return null
}

// 检测文件是否被删除
async function checkDeletion(key) {
  const maxRetries = 6
  let interval = 400
  const target = normalizeKey(key)

  for (let i = 0; i < maxRetries; i++) {
    try {
      const list = await s3.listFiles({ prefix: target, cfg: s3Config.value })
      if (Array.isArray(list)) {
        const found = list.some(item => normalizeKey(item.key) === target)
        if (!found) {
          return 'deleted'
        }
        const head = await headCheck(target, 1, 200)
        if (head === false) return 'deleted'
        if (head === true) {
          return 'exists'
        }
      } else {
        const head = await headCheck(target, 2, 300)
        if (head === false) return 'deleted'
        if (head === true) return 'exists'
      }
    } catch (e) {
      // ignore error
    }
    await sleep(interval)
    interval = Math.min(2000, Math.round(interval * 1.5))
  }

  try {
    const finalHead = await headCheck(target, 3, 300)
    if (finalHead === false) return 'deleted'
    if (finalHead === true) return 'exists'
  } catch (e) {
    // ignore error
  }

  return 'unknown'
}

// 检查 key 是否存在
async function existsKey(key) {
  showLoading('正在检查文件...')
  const target = normalizeKey(key)
  let foundInList = false

  try {
    const list = await s3.listFiles({ prefix: target, cfg: s3Config.value })
    if (Array.isArray(list)) {
      foundInList = list.some(item => normalizeKey(item.key) === target)
      if (foundInList) {
        hideLoading()
        return true
      }
    }
  } catch (e) {
    // ignore error
  }

  try {
    const head = await headCheck(target, 3, 300)
    hideLoading()
    if (head === true) return true
    if (head === false) return false
  } catch (e) {
    hideLoading()
  }

  hideLoading()
  return false
}

async function handleDeleteByUrl(passedUrl) {
  const target = (typeof passedUrl === 'string' && passedUrl.trim()) ? passedUrl.trim() : deleteUrl.value.trim()
  if (!target) {
    await alert('请输入图片链接！')
    return
  }

  const key = extractKey(target)

  const exists = await existsKey(key)
  if (exists !== true) {
    await alert('文件不存在或无法确认，无法执行删除操作。')
    deleteUrl.value = ''
    await listFiles()
    return
  }

  try {
    showLoading('正在删除图片...')
    await s3.deleteFile({ fileKey: key, cfg: s3Config.value })
    const status = await checkDeletion(key)
    hideLoading()
    if (status === 'deleted') {
      await alert('图片删除成功！')
    } else if (status === 'exists') {
      await alert('删除失败：文件仍然存在，请检查权限或稍后重试。')
    } else {
      await alert('已执行删除操作，但无法确认文件已被删除，请稍后检查。')
    }
    deleteUrl.value = ''
    await listFiles()
  } catch (e) {
    hideLoading()
    await alert('删除失败，请检查链接或权限是否正确')
  }
}

function extractKey(url) {
  try {
    const u = new URL(url)
    return u.pathname.startsWith('/') ? u.pathname.slice(1) : u.pathname
  } catch (e) {
    return url
  }
}

function goToSettings() {
  window.location.href = '/settings'
}

async function copyLink(link) {
  if (navigator.clipboard) {
    try {
      await navigator.clipboard.writeText(link)
      await alert('链接已复制到剪贴板！')
    } catch {
      await alert('复制失败，请手动复制链接！')
    }
  } else {
    await alert('您的浏览器不支持剪贴板API，请手动复制链接')
  }
}

// Masonry 初始化
async function initMasonry() {
  if (viewMode.value !== 'masonry') return
  if (!masonryContainer.value) return
  const Macy = (await import('macy')).default
  await nextTick()
  if (macyInstance) {
    try {
      macyInstance.remove()
    } catch {}
    macyInstance = null
  }
  macyInstance = Macy({
    container: masonryContainer.value,
    trueOrder: false,
    waitForImages: true,
    margin: 14,
    columns: 5,
    breakAt: { 640: 1, 1024: 2, 1280: 3, 1920: 5 }
  })
}

// Fancybox
function previewImage(url) {
  Fancybox.show([{ src: url, type: "image" }]);
}

onMounted(() => {
  Fancybox.bind('[data-fancybox]', {
    Hash: false
  })
})

// 格式化时间
function formatExactTime(dateString) {
  if (!dateString) return '未知时间'
  try {
    const date = new Date(dateString)
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    const hours = String(date.getHours()).padStart(2, '0')
    const minutes = String(date.getMinutes()).padStart(2, '0')
    const seconds = String(date.getSeconds()).padStart(2, '0')

    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`
  } catch (e) {
    return '无效日期'
  }
}

// 格式化文件大小
function formatFileSize(bytes) {
  if (!bytes || bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

// 等待图片加载完成
function waitForImagesToLoad() {
  return new Promise(resolve => {
    const container = masonryContainer.value
    if (!container) return resolve()
    const images = container.querySelectorAll('img')
    if (images.length === 0) return resolve()
    let loaded = 0
    images.forEach(img => {
      if (img.complete) loaded++
      else img.onload = img.onerror = () => {
        loaded++
        if (loaded === images.length) resolve()
      }
    })
    if (loaded === images.length) resolve()
  })
}
</script>