<template>
  <div class="p-8">
    <h1 class="text-2xl font-bold mb-6">图片管理</h1>
    <div v-if="!isConfigured" class="max-w-md mx-auto bg-gray-100 dark:bg-gray-800 p-6 rounded shadow">
      <h2 class="text-xl font-semibold mb-4 text-center">配置 S3 存储信息</h2>
      <p class="text-sm text-center">基于 Cloudflare R2 ，其他存储不保证可用性</p>
      <div>
        <form id="s3Config" class="space-y-3">
          <input v-model="bucket" id="bucket" placeholder="Bucket" class="w-full p-2 box-border border rounded" />
          <input v-model="endpoint" id="endpoint" placeholder="Endpoint" class="w-full p-2 box-border border rounded" />
          <input v-model="region" id="region" placeholder="Region" autocomplete="off" class="w-full p-2 box-border border rounded" />
          <input v-model="accessKeyId" id="accessKeyId" placeholder="Access Key ID" class="w-full p-2 box-border border rounded" />
          <input v-model="secretAccessKey" id="secretAccessKey" placeholder="Access Key Secret" class="w-full p-2 box-border border rounded" type="current-password" />
          <input v-model="customDomain" id="customDomain" placeholder="Custom Domain" class="w-full p-2 box-border border rounded" />
        </form>
      </div>
      <button
        @click="handleSaveConfig"
        class="mt-4 w-full bg-blue-600 text-white py-2 rounded border-none hover:bg-blue-700"
        :disabled="loading"
      >
        {{ loading ? '验证中...' : '保存配置' }}
      </button>
      <p v-if="error" class="text-red-500 mt-3 text-sm">{{ error }}</p>
    </div>
    <div v-else>
      <div class="mb-4 flex gap-2 items-center">
        <div class="flex gap-2">
          <button
            v-for="path in paths"
            :key="path.prefix"
            @click="switchPrefix(path.prefix)"
            :class="currentPrefix === path.prefix ? 'bg-blue-600 text-white' : 'bg-gray-200 hover:bg-gray-300'"
            class="px-4 py-2 rounded border-none cursor-pointer"
          >
            {{ path.label }}
          </button>
        </div>
        <div class="ml-auto flex gap-2 items-center">
          <label for="viewModeSelect" class="text-sm">显示模式:</label>
          <select
            id="viewModeSelect"
            v-model="viewMode"
            @change="switchView(viewMode)"
            class="px-3 py-1 border rounded bg-white text-gray-800"
          >
            <option value="masonry">瀑布流</option>
            <option value="list">列表</option>
          </select>
          <button
            @click="clearConfig"
            class="ml-4 px-4 py-2 bg-red-500 text-white border-none rounded hover:bg-red-600 cursor-pointer"
          >
            删除配置
          </button>
        </div>
      </div>
      <div
        ref="uploadArea"
        class="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg mb-6 p-8 flex flex-col items-center justify-center text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors"
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
        <input ref="fileInput" type="file" class="hidden" multiple @change="handleFileSelect" />
        <p class="text-sm text-gray-400 mt-2">当前路径：{{ currentPrefix === '' ? '/' : currentPrefix }}</p>
      </div>
      <client-only>
        <div v-if="viewMode === 'masonry'" ref="masonryContainer" class="w-full">
          <div
            v-for="file in files"
            :key="file.key"
            class="mb-4 relative group rounded-lg overflow-hidden shadow-2xl"
          >
            <img
              :src="`${customDomain}${file.key}`"
              alt="image"
              class="w-full block cursor-pointer"
              @click="copyLink(`${customDomain}${file.key}`)"
            />
            <button
              @click="handleDeleteFile(file)"
              class="absolute top-2 right-2 bg-red-500 text-white px-2 py-1 border-none rounded opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
            >
              删除
            </button>
          </div>
        </div>

        <div v-else-if="viewMode === 'list'" class="flex flex-col gap-2">
          <div
            v-for="file in files"
            :key="file.key"
            class="flex items-center justify-between p-2 border rounded hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            <span class="truncate">{{ file.key }}</span>
            <div class="flex gap-2">
              <button
                @click="previewImage(`${customDomain}${file.key}`)"
                class="px-2 py-1 bg-blue-500 text-white border-none rounded hover:bg-blue-600"
              >
                预览
              </button>
              <button
                @click="copyLink(`${customDomain}${file.key}`)"
                class="px-2 py-1 bg-blue-500 text-white border-none rounded hover:bg-blue-600"
              >
                复制链接
              </button>
              <button
                @click="handleDeleteFile(file)"
                class="px-2 py-1 bg-red-500 text-white border-none rounded hover:bg-red-600"
              >
                删除
              </button>
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
import { Fancybox } from '@fancyapps/ui'
import '@fancyapps/ui/dist/fancybox/fancybox.css'

const bucket = ref('')
const endpoint = ref('')
const region = ref('auto')
const accessKeyId = ref('')
const secretAccessKey = ref('')
const customDomain = ref('')
const isConfigured = ref(false)
const dragOver = ref(false)
const loading = ref(false)
const error = ref('')
const files = ref([])
const masonryContainer = ref(null)
const uploadProgress = ref({})
let macyInstance = null
let apiKey = null

const paths = [
  { label: '文章图片', prefix: 'blog/posts/' },
  { label: '说说图片', prefix: 'talks/' },
  { label: '全部图片', prefix: '' },
]
const currentPrefix = ref(paths[0].prefix)

const viewMode = ref(localStorage.getItem('viewMode') || 'list')

// 切换路径
function switchPrefix(prefix) {
  currentPrefix.value = prefix
  files.value = []
  uploadProgress.value = {}
  listFiles().then(() => window.scrollTo({ top: 0, behavior: 'smooth' }))
}

// 切换视图
function switchView(mode) {
  viewMode.value = mode
  localStorage.setItem('viewMode', mode)
  if (mode === 'masonry') {
    nextTick(() => initMasonry())
  }
}

if (import.meta.client) {
  apiKey = localStorage.getItem('api_key')
}

const s3Config = ref({})
let s3 = null

function loadConfig() {
  if (import.meta.client) {
    const saved = localStorage.getItem('s3_config')
    const savedMode = localStorage.getItem('view_mode')
    if (savedMode) viewMode.value = savedMode

    if (saved && apiKey) {
      s3 = useS3({ apiKey })
      const config = s3.decryptConfig(saved)
      bucket.value = config.bucket || ''
      endpoint.value = config.endpoint || ''
      region.value = config.region || ''
      accessKeyId.value = config.accessKeyId || ''
      secretAccessKey.value = config.secretAccessKey || ''
      customDomain.value = config.customDomain ? (config.customDomain.endsWith('/') ? config.customDomain : config.customDomain + '/') : ''
      s3Config.value = config
      if (bucket.value && endpoint.value && accessKeyId.value && secretAccessKey.value) {
        isConfigured.value = true
        listFiles()
      }
    }
  }
}

onMounted(loadConfig)

async function handleSaveConfig() {
  error.value = ''
  loading.value = true
  try {
    const config = {
      bucket: bucket.value,
      endpoint: endpoint.value,
      region: region.value,
      accessKeyId: accessKeyId.value,
      secretAccessKey: secretAccessKey.value,
      customDomain: customDomain.value
    }
    s3 = useS3({ apiKey, config })
    await s3.saveConfig(config)
    window.location.reload()
  } catch (e) {
    console.error(e)
    error.value = '配置无效，请检查访问密钥或桶信息！'
  } finally {
    loading.value = false
  }
}

async function listFiles() {
  loading.value = true
  error.value = ''
  files.value = []
  try {
    const result = await s3.listFiles({ prefix: currentPrefix.value, cfg: s3Config.value })
    files.value = result
    await nextTick()
    await waitForImagesToLoad()
    await initMasonry()
  } catch (e) {
    console.error(e)
    error.value = '无法获取文件列表'
  } finally {
    loading.value = false
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
  input.onchange = handleFileSelect
  input.click()
}

async function uploadFiles(selectedFiles) {
  if (!selectedFiles || selectedFiles.length === 0) return

  const imageFiles = Array.from(selectedFiles).filter(
    file => file.type && file.type.startsWith('image/')
  )

  if (imageFiles.length === 0) {
    alert('请选择图片文件！')
    return
  }

  if (imageFiles.length < selectedFiles.length) {
    alert(`已自动忽略非图片文件，共上传 ${imageFiles.length} 张图片`)
  }

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
      alert(`上传成功！共 ${urls.length} 张图片，链接已复制到剪贴板。`)
    }
  } catch (e) {
    console.error(e)
    alert('上传失败，请重试')
  }
}

async function handleDeleteFile(file) {
  loading.value = true
  error.value = ''
  try {
    await s3.deleteFile({ fileKey: file.key, cfg: s3Config.value })
    alert('图片删除成功！')
    await listFiles()
  } catch (e) {
    console.error(e)
    error.value = '删除失败，请重试！'
  } finally {
    loading.value = false
  }
}

function clearConfig() {
  if (confirm('确定要删除配置吗？此操作不可逆，清除后需重新填写！')) {
    localStorage.removeItem('s3_config')
    isConfigured.value = false
    files.value = []
  }
}

function copyLink(link) {
  if (navigator.clipboard) {
    navigator.clipboard.writeText(link).then(() => {
      alert('链接已复制到剪贴板！')
    }).catch(err => {
      console.error('复制失败:', err)
      alert('复制失败，请手动复制链接！')
    })
  } else {
    alert('您的浏览器不支持剪贴板API，请手动复制链接')
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