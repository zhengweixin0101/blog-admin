<template>
  <div class="p-8">
    <h1 class="text-2xl font-bold mb-6">图片管理</h1>

    <!-- 配置输入界面 -->
    <div v-if="!isConfigured" class="max-w-md mx-auto bg-gray-100 dark:bg-gray-800 p-6 rounded shadow">
      <h2 class="text-xl font-semibold mb-4 text-center">配置 S3 存储信息</h2>
      <p class="text-sm text-center">基于 Cloudflare R2 ，其他存储不保证可用性</p>

      <div>
        <form id="s3Config" class="space-y-3">
          <input v-model="bucket" id="bucket" placeholder="Bucket" class="w-full p-2 box-border border rounded" />
          <input v-model="endpoint" id="endpoint" placeholder="Endpoint" class="w-full p-2 box-border border rounded" />
          <input v-model="region" id="region" placeholder="Region" class="w-full p-2 box-border border rounded" />
          <input v-model="accessKeyId" id="accessKeyId" placeholder="Access Key ID" class="w-full p-2 box-border border rounded" />
          <input v-model="secretAccessKey" id="secretAccessKey" placeholder="Access Key Secret" class="w-full p-2 box-border border rounded" type="current-password" />
          <input v-model="customDomain" id="customDomain" placeholder="Custom Domain" class="w-full p-2 box-border border rounded" />
        </form>
      </div>

      <button
        @click="saveConfig"
        class="mt-4 w-full bg-blue-600 text-white py-2 rounded border-none hover:bg-blue-700"
        :disabled="loading"
      >
        {{ loading ? '验证中...' : '保存配置' }}
      </button>

      <p v-if="error" class="text-red-500 mt-3 text-sm">{{ error }}</p>
    </div>

    <div v-else>
      <div class="mb-4 flex gap-2">
        <button @click="clearConfig" class="px-4 py-2 bg-red-500 text-white border-none rounded hover:bg-red-600 cursor-pointer">
          删除配置
        </button>
      </div>

      <!-- 上传区域 -->
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
      </div>

      <!-- 图片列表 -->
      <client-only>
        <div ref="masonryContainer" class="w-full">
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
              @click="deleteFile(file)"
              class="absolute top-2 right-2 bg-red-500 text-white px-2 py-1 border-none rounded opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
            >
              删除
            </button>
          </div>
        </div>
      </client-only>
    </div>
  </div>
</template>

<script setup>
import CryptoJS from 'crypto-js'
import { ref, onMounted, nextTick } from 'vue'
import { S3Client, ListObjectsV2Command, DeleteObjectCommand } from '@aws-sdk/client-s3'
import { Upload } from "@aws-sdk/lib-storage"

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

if (import.meta.client) {
  apiKey = localStorage.getItem('api_key')
}

function encryptConfig(config) {
  if (!apiKey) {
    console.warn('缺少 api_key！')
    return null
  }
  return CryptoJS.AES.encrypt(JSON.stringify(config), apiKey).toString()
}

function decryptConfig(cipherText) {
  if (!apiKey) {
    console.warn('缺少 api_key！')
    return {}
  }
  try {
    const bytes = CryptoJS.AES.decrypt(cipherText, apiKey)
    return JSON.parse(bytes.toString(CryptoJS.enc.Utf8))
  } catch (e) {
    console.error('加载失败：', e)
    return {}
  }
}

// 初始化
onMounted(() => {
  if (import.meta.client) {
    const saved = localStorage.getItem('s3_config')
    if (saved && apiKey) {
      const config = decryptConfig(saved)
      bucket.value = config.bucket || ''
      endpoint.value = config.endpoint || ''
      region.value = config.region || ''
      accessKeyId.value = config.accessKeyId || ''
      secretAccessKey.value = config.secretAccessKey || ''
      customDomain.value = config.customDomain ? (config.customDomain.endsWith('/') ? config.customDomain : config.customDomain + '/') : ''

      if (bucket.value && endpoint.value && accessKeyId.value && secretAccessKey.value) {
        isConfigured.value = true
        listFiles()
      }
    }
  }
})

// 初始化 S3 客户端
function getS3Client() {
  return new S3Client({
    region: region.value || 'auto',
    endpoint: endpoint.value,
    credentials: {
      accessKeyId: accessKeyId.value,
      secretAccessKey: secretAccessKey.value
    }
  })
}

// 保存配置
async function saveConfig() {
  error.value = ''
  loading.value = true
  try {
    const client = getS3Client()
    await client.send(new ListObjectsV2Command({ Bucket: bucket.value, MaxKeys: 1 }))

    const encrypted = encryptConfig({
      bucket: bucket.value,
      endpoint: endpoint.value,
      region: region.value,
      accessKeyId: accessKeyId.value,
      secretAccessKey: secretAccessKey.value,
      customDomain: customDomain.value
    })

    if (!encrypted) throw new Error('缺少 api_key！')
    localStorage.setItem('s3_config', encrypted)

    window.location.reload()
  } catch (e) {
    console.error(e)
    error.value = '配置无效，请检查访问密钥或桶信息！'
  } finally {
    loading.value = false
  }
}

// 列出文件
async function listFiles(prefix = 'blog/posts') {
  loading.value = true
  error.value = ''
  files.value = []

  try {
    const client = getS3Client()
    const res = await client.send(
      new ListObjectsV2Command({
        Bucket: bucket.value,
        Prefix: prefix
      })
    )

  files.value = (res.Contents || [])
    .map(f => ({
      key: f.Key,
      size: f.Size,
      lastModified: f.LastModified,
      timestamp: f.LastModified ? new Date(f.LastModified).getTime() : 0
    }))
    .sort((a, b) => b.timestamp - a.timestamp)

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

// 上传文件
async function uploadFiles(selectedFiles) {
  if (!selectedFiles || selectedFiles.length === 0) return
  const client = getS3Client()
  const uploadedUrls = []

  for (const file of selectedFiles) {
    uploadProgress.value[file.name] = 0

    const ext = file.name.substring(file.name.lastIndexOf('.')) || ''
    const timestamp = Date.now()
    const randomId = crypto.randomUUID().replace(/-/g, '')
    const key = `blog/posts/${timestamp}_${randomId}${ext}`
    const url = `${customDomain.value}${key}`

    try {
      const parallelUpload = new Upload({
        client: client,
        params: {
          Bucket: bucket.value,
          Key: key,
          Body: file,
          ContentType: file.type
        }
      })

      parallelUpload.on("httpUploadProgress", (progress) => {
        uploadProgress.value[file.name] = Math.round((progress.loaded / progress.total) * 100)
      })

      await parallelUpload.done()
      uploadProgress.value[file.name] = 100
      uploadedUrls.push(url)
    } catch (e) {
      console.error(`上传失败: ${file.name}`, e)
      alert(`${file.name} 上传失败`)
    }
  }

  await listFiles()

  if (uploadedUrls.length > 0 && navigator.clipboard) {
    try {
      await navigator.clipboard.writeText(uploadedUrls.join('\n'))
      alert(`上传成功！共 ${uploadedUrls.length} 张图片，链接已复制到剪贴板。`)
    } catch (err) {
      console.error('复制链接失败:', err)
      alert('上传成功，但复制链接失败，请手动复制。')
    }
  }
}

// 处理选择文件
function handleFileSelect(e) {
  const selectedFiles = Array.from(e.target.files)
  uploadFiles(selectedFiles)
}

// 拖拽上传
function handleDrop(e) {
  dragOver.value = false
  const droppedFiles = Array.from(e.dataTransfer.files)
  uploadFiles(droppedFiles)
}

// 点击上传
function selectFile() {
  const input = document.createElement('input')
  input.type = 'file'
  input.multiple = true
  input.onchange = handleFileSelect
  input.click()
}

// 删除文件
async function deleteFile(file) {
  loading.value = true
  error.value = ''
  try {
    const client = getS3Client()
    await client.send(new DeleteObjectCommand({ Bucket: bucket.value, Key: file.key }))
    alert('图片删除成功！')
    await listFiles()
  } catch (e) {
    console.error(e)
    error.value = '删除失败，请重试！'
  } finally {
    loading.value = false
  }
}

// 清除配置
function clearConfig() {
  if (confirm('确定要删除配置吗？此操作不可逆，清除后需重新填写！')) {
    localStorage.removeItem('s3_config')
    isConfigured.value = false
    files.value = []
  }
}

// 复制链接
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

// Masonry
async function initMasonry() {
  if (typeof window === 'undefined' || !masonryContainer.value) return
  const Macy = (await import('macy')).default
  await nextTick()
  if (macyInstance) {
    try {
      macyInstance.reInit()
    } catch (e) {
      macyInstance = null
    }
  }
  if (!macyInstance) {
    macyInstance = Macy({
      container: masonryContainer.value,
      trueOrder: false,
      waitForImages: true,
      margin: 14,
      columns: 5,
      breakAt: { 640: 1, 1024: 2, 1280: 3, 1920: 5 }
    })
  }
}

// 等待图片加载
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