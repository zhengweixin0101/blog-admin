<template>
  <div class="p-8">
    <h1 class="text-2xl font-bold mb-6">音乐管理</h1>
    <div class="flex items-center gap-3 mb-6">
      <button
        @click="selectFile"
        class="px-4 py-2 bg-blue-600 text-white rounded border-none hover:bg-blue-700 transition-colors cursor-pointer text-sm flex items-center gap-1.5"
      >
        <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" />
        </svg>
        上传 FLAC
      </button>
      <button
        @click="refreshList"
        class="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded border-none transition-colors cursor-pointer text-sm"
      >
        刷新
      </button>
      <button
        @click="handleViewListFile"
        class="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded border-none transition-colors cursor-pointer text-sm"
      >
        查看列表文件
      </button>
      <input ref="fileInput" type="file" class="hidden" multiple accept=".flac" @change="handleFileSelect" />
    </div>

    <div v-if="isLoadingConfig" class="flex items-center justify-center min-h-[60vh]">
      <p class="text-gray-400">加载中...</p>
    </div>

    <div v-else-if="!isConfigured" class="flex items-center justify-center min-h-[60vh]">
      <div class="max-w-md bg-gray-100 p-6 rounded shadow text-center">
        <h2 class="text-xl font-semibold mb-4">未配置 S3 存储</h2>
        <p class="text-sm text-gray-600 mb-4">请先在"设置"页面配置 S3 存储信息</p>
        <button
          @click="$router.push('/settings')"
          class="px-6 py-2 bg-blue-600 text-white rounded border-none hover:bg-blue-700 transition-colors cursor-pointer"
        >
          前往设置
        </button>
      </div>
    </div>

    <div v-else>
      <!-- 上传进度条 -->
      <div v-if="uploadQueue.length > 0" class="mb-4 bg-white border rounded-lg p-3">
        <div class="flex items-center justify-between mb-2">
          <span class="text-sm font-medium">上传中 ({{ uploadingCount }}/{{ uploadQueue.length }})</span>
          <button
            v-if="!isUploading"
            @click="uploadQueue = []"
            class="text-xs text-gray-400 hover:text-gray-600 transition-colors bg-transparent border-none cursor-pointer"
          >
            清除
          </button>
        </div>
        <div class="space-y-1.5">
          <div
            v-for="(item, idx) in uploadQueue"
            :key="idx"
            class="flex items-center gap-2 text-sm"
          >
            <svg v-if="item.status === 'done'" class="w-3.5 h-3.5 text-green-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
            </svg>
            <svg v-else-if="item.status === 'error'" class="w-3.5 h-3.5 text-red-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
            <div v-else class="w-3.5 h-3.5 flex-shrink-0">
              <div class="animate-spin w-3.5 h-3.5 border-2 border-blue-500 border-t-transparent rounded-full"></div>
            </div>
            <span class="flex-1 truncate" :class="{ 'text-green-600': item.status === 'done', 'text-red-500': item.status === 'error' }">
              {{ item.name }}
            </span>
            <span v-if="item.status === 'uploading'" class="text-xs text-gray-400 flex-shrink-0">{{ Math.round(item.progress) }}%</span>
          </div>
        </div>
      </div>

      <!-- 歌曲列表 -->
      <div class="text-sm text-gray-500 mb-3">
        共 {{ songs.length }} 首歌曲
      </div>

      <div v-if="songs.length === 0 && !loading" class="py-16 text-center">
        <div class="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
          <svg class="w-8 h-8 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M9 9l10.5-3m0 6.553v3.75a2.25 2.25 0 01-1.632 2.163l-1.32.377a1.803 1.803 0 11-.99-3.467l2.31-.66a2.25 2.25 0 001.632-2.163zm0 0V2.25L9 5.25v10.303m0 0v3.75a2.25 2.25 0 01-1.632 2.163l-1.32.377a1.803 1.803 0 01-.99-3.467l2.31-.66A2.25 2.25 0 009 15.553z" />
          </svg>
        </div>
        <p class="text-gray-400">暂无音乐</p>
      </div>

      <div v-else class="flex flex-col gap-2">
        <div
          v-for="(song, idx) in songs"
          :key="`${song.title}-${song.artist}`"
          class="flex items-center justify-between p-2 border rounded hover:bg-gray-50 transition-colors"
        >
          <div class="flex items-center gap-3 min-w-0">
            <button
              @click="togglePlay(song)"
              class="w-8 h-8 rounded bg-gray-100 hover:bg-gray-200 flex-shrink-0 flex items-center justify-center transition-colors border-none cursor-pointer"
            >
              <svg v-if="playingKey !== song.key || isPaused" class="w-3.5 h-3.5 text-gray-500 ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z"/>
              </svg>
              <svg v-else class="w-3.5 h-3.5 text-blue-500" fill="currentColor" viewBox="0 0 24 24">
                <path d="M6 4h4v16H6zM14 4h4v16h-4z"/>
              </svg>
            </button>
            <div class="flex-1 min-w-0">
              <div class="truncate font-medium">{{ song.title }}</div>
              <div class="text-sm text-gray-500 truncate">{{ song.artist }}</div>
            </div>
          </div>
          <div class="flex items-center gap-4">
            <span class="text-sm text-gray-400 whitespace-nowrap">{{ formatFileSize(song.size) }}</span>
            <button
              @click="handleDelete(song)"
              class="px-2 py-1 bg-red-500 text-white border-none rounded hover:bg-red-600 transition-colors cursor-pointer text-sm"
            >
              删除
            </button>
          </div>
        </div>
      </div>
    </div>

    <audio ref="audioEl" @ended="onEnded" @timeupdate="onTimeUpdate" @loadedmetadata="onLoadedMetadata"></audio>

    <!-- 底部播放条 -->
    <div
      v-if="playingKey"
      class="fixed bottom-0 left-0 right-0 z-50 bg-gray-50 border-t border-gray-200 shadow-[0_-2px_10px_rgba(0,0,0,0.08)]"
    >
      <div class="flex items-center gap-4 px-4 py-3">
        <button
          @click="togglePlay(songs.find(s => s.key === playingKey))"
          class="w-9 h-9 rounded-full bg-blue-500 hover:bg-blue-600 flex items-center justify-center flex-shrink-0 transition-colors border-none cursor-pointer"
        >
          <svg v-if="!isPaused" class="w-4 h-4 text-white ml-0.5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M6 4h4v16H6zM14 4h4v16h-4z"/>
          </svg>
          <svg v-else class="w-4 h-4 text-white ml-1" fill="currentColor" viewBox="0 0 24 24">
            <path d="M8 5v14l11-7z"/>
          </svg>
        </button>

        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-2 mb-1">
            <span class="text-sm font-medium truncate">{{ playingSong?.title }}</span>
            <span class="text-xs text-gray-400 truncate">{{ playingSong?.artist }}</span>
          </div>
          <div class="flex items-center gap-2">
            <span class="text-xs text-gray-400 w-10 text-right">{{ formatTime(currentTime) }}</span>
            <input
              type="range"
              class="flex-1 h-1 rounded-full appearance-none bg-gray-200 cursor-pointer accent-blue-500"
              min="0"
              :max="duration || 0"
              :value="currentTime"
              @input="onSeek"
            />
            <span class="text-xs text-gray-400 w-10">{{ formatTime(duration) }}</span>
          </div>
        </div>

        <button
          @click="stopPlay"
          class="w-8 h-8 rounded hover:bg-gray-100 flex items-center justify-center flex-shrink-0 transition-colors border-none cursor-pointer text-gray-400 hover:text-gray-600"
        >
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { useMusicManager } from '@/composables/useMusicManager.js'
import { alert, confirm } from '@/composables/useModal'
import { showLoading, hideLoading } from '@/composables/useLoading.js'
import { useSettings } from '~/composables/useSettings.js'

const { getConfig } = useSettings()

const isConfigured = ref(false)
const isLoadingConfig = ref(true)
const loading = ref(false)
const songs = ref([])
const s3Config = ref({})
const customDomain = ref('')

const uploadQueue = ref([])
const isUploading = ref(false)
const fileInput = ref(null)

const audioEl = ref(null)
const playingKey = ref('')
const isPaused = ref(true)
const currentTime = ref(0)
const duration = ref(0)

const music = useMusicManager()

const playingSong = computed(() => songs.value.find(s => s.key === playingKey.value))

const uploadingCount = computed(() => {
  return uploadQueue.value.filter(q => q.status === 'done' || q.status === 'uploading').length
})

function formatFileSize(bytes) {
  if (!bytes || bytes === 0) return '-'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
}

function getFileUrl(path) {
  const p = path.replace(/^\/+/, '')
  if (customDomain.value) {
    return `${customDomain.value}${p}`
  }
  const endpoint = (s3Config.value.endpoint || '').replace(/\/+$/, '')
  const bucket = s3Config.value.bucket || ''
  return `${endpoint}/${bucket}/${p}`
}

function formatTime(sec) {
  if (!sec || !isFinite(sec)) return '0:00'
  const m = Math.floor(sec / 60)
  const s = Math.floor(sec % 60).toString().padStart(2, '0')
  return `${m}:${s}`
}

function onTimeUpdate() {
  const audio = audioEl.value
  if (!audio) return
  currentTime.value = audio.currentTime
}

function onLoadedMetadata() {
  const audio = audioEl.value
  if (!audio) return
  duration.value = audio.duration || 0
}

function onSeek(e) {
  const audio = audioEl.value
  if (!audio) return
  audio.currentTime = Number(e.target.value)
}

function stopPlay() {
  const audio = audioEl.value
  if (audio) {
    audio.pause()
    audio.src = ''
  }
  playingKey.value = ''
  isPaused.value = true
  currentTime.value = 0
  duration.value = 0
}

function togglePlay(song) {
  const audio = audioEl.value
  if (!audio) return

  if (playingKey.value === song.key) {
    if (audio.paused) {
      audio.play()
      isPaused.value = false
    } else {
      audio.pause()
      isPaused.value = true
    }
    return
  }

  const url = getFileUrl(`music/music/${song.key}.flac`)
  audio.src = url
  audio.load()
  audio.play().catch(() => {})
  playingKey.value = song.key
  isPaused.value = false
  currentTime.value = 0
  duration.value = 0
}

function onEnded() {
  isPaused.value = true
  currentTime.value = 0
}

async function loadConfig() {
  showLoading('正在加载配置...')
  try {
    const result = await getConfig('s3_config')
    if (result.success && result.data && result.data.value) {
      const config = JSON.parse(result.data.value)
      customDomain.value = config.customDomain ? (config.customDomain.endsWith('/') ? config.customDomain : config.customDomain + '/') : ''
      s3Config.value = config
      if (config.bucket && config.endpoint && config.accessKeyId && config.secretAccessKey) {
        isConfigured.value = true
        isLoadingConfig.value = false
        hideLoading()
        await loadSongs()
        return
      }
    }
  } catch (error) {
  }
  isLoadingConfig.value = false
  isConfigured.value = false
  hideLoading()
}

onMounted(loadConfig)

onBeforeUnmount(() => {
  if (audioEl.value) {
    audioEl.value.pause()
    audioEl.value.src = ''
  }
  playingKey.value = ''
  isPaused.value = true
})

async function loadSongs() {
  loading.value = true
  showLoading('正在加载音乐列表...')
  try {
    songs.value = await music.getMusicListFromFiles(s3Config.value)
  } catch (e) {
    await alert('无法获取音乐列表')
  } finally {
    loading.value = false
    hideLoading()
  }
}

async function refreshList() {
  await loadSongs()
}

function selectFile() {
  fileInput.value?.click()
}

async function handleFileSelect(e) {
  const files = Array.from(e.target.files).filter(f => f.name.toLowerCase().endsWith('.flac'))
  if (files.length === 0) {
    await alert('请选择 FLAC 文件')
    return
  }
  for (const file of files) {
    const exists = uploadQueue.value.some(q => q.name === file.name && q.status !== 'error')
    if (!exists) {
      uploadQueue.value.push({ file, name: file.name, status: 'pending', progress: 0, error: '' })
    }
  }
  e.target.value = ''
  if (!isUploading.value) processQueue()
}

async function processQueue() {
  isUploading.value = true

  while (true) {
    const item = uploadQueue.value.find(q => q.status === 'pending')
    if (!item) break

    item.status = 'uploading'
    item.progress = 0

    try {
      await music.uploadMusic([item.file], s3Config.value, (type, percent) => {
        item.progress = type === 'flac' ? percent * 0.5 : 50 + percent * 0.5
      })
      item.status = 'done'
      item.progress = 100
    } catch (e) {
      item.status = 'error'
      item.error = e.message || '上传失败'
    }
  }

  isUploading.value = false

  const hasSuccess = uploadQueue.value.some(q => q.status === 'done')
  if (hasSuccess) await loadSongs()

  setTimeout(() => {
    uploadQueue.value = uploadQueue.value.filter(q => q.status !== 'done')
  }, 3000)
}

function handleViewListFile() {
  const url = getFileUrl('music/music_list.json')
  window.open(url, '_blank')
}

async function handleDelete(song) {
  const confirmed = await confirm(`确定要删除「${song.title} - ${song.artist}」吗？\n\n将删除 R2 上的 .flac 和 .bin 文件，不可恢复。`)
  if (!confirmed) return

  showLoading('正在删除...')
  try {
    if (playingKey.value === song.key) {
      stopPlay()
    }
    await music.deleteMusic(song, s3Config.value)
    hideLoading()
    await loadSongs()
    await alert('删除成功')
  } catch (e) {
    hideLoading()
    await alert('删除失败：' + (e.message || '请重试'))
  }
}
</script>
