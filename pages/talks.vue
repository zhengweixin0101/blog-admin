<template>
  <div class="flex">
    <main class="p-8 flex-1">
      <h1 class="text-2xl font-bold mb-6">说说管理</h1>
      <div class="grid grid-cols-1 md:grid-cols-[2fr_3fr] gap-10">
        <div>
          <div class="mb-6 p-3 rounded shadow">
            <textarea
              v-model="newContent"
              placeholder="此刻的想法..."
              id="new-talk-content"
              class="w-full my-1 h-20 text-base rounded border-none text-gray-900 resize-none focus:outline-none overflow-hidden"
              @input="autoResize"
              @keydown="handleEditorKeyDown"
            ></textarea>
            <div class="w-full border border-dashed border-gray-300"></div>
            <div class="flex justify-between mt-2">
              <div class="mt-1">
                <button
                  ref="tagButton"
                  @click.stop="toggleDropdown('tag','new')"
                  :class="[
                    'border-none bg-transparent cursor-pointer transition-colors',
                    activeDropdown === 'tag' ? 'text-blue-500' : 'text-gray-500 hover:text-blue-500'
                  ]"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-hash size-5"><line x1="4" x2="20" y1="9" y2="9"></line><line x1="4" x2="20" y1="15" y2="15"></line><line x1="10" x2="8" y1="3" y2="21"></line><line x1="16" x2="14" y1="3" y2="21"></line></svg>
                </button>
                <transition name="fade-slide">
                  <div v-if="activeDropdown.type === 'tag' && activeDropdown.target === 'new'" class="dropdown absolute mt-1 p-2 bg-gray-100 rounded shadow z-50 max-w-xs">
                    <span 
                      v-for="tag in allTags" 
                      :key="tag" 
                      @click="insertTag(tag)"
                      class="mx-1 text-sm text-blue-500 hover:text-blue-800 rounded cursor-pointer transition-colors"
                    >
                      #{{ tag }}
                    </span>
                  </div>
                </transition>
                <button
                  ref="markdownButton"
                  @click.stop="toggleDropdown('markdown','new')"
                  :class="[
                    'border-none bg-transparent cursor-pointer transition-colors',
                    activeDropdown === 'markdown' ? 'text-blue-500' : 'text-gray-500 hover:text-blue-500'
                  ]"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-square-slash size-5"><rect width="18" height="18" x="3" y="3" rx="2"></rect><line x1="9" x2="15" y1="15" y2="9"></line></svg>
                </button>
                <transition name="fade-slide">
                  <div v-if="activeDropdown.type === 'markdown' && activeDropdown.target === 'new'" class="dropdown absolute mt-1 p-2 bg-gray-100 rounded shadow z-50 max-w-xs">
                    <span 
                      v-for="item in mdOptions" 
                      :key="item.label" 
                      @click="insertMd(item.syntax)"
                      class="mx-1 text-sm text-blue-500 hover:text-blue-800 rounded cursor-pointer transition-colors"
                    >
                      {{ item.label }}
                    </span>
                  </div>
                </transition>
                <button
                  ref="locationButton"
                  @click.stop="toggleDropdown('location','new')"
                  :class="[
                    'border-none bg-transparent cursor-pointer transition-colors',
                    activeDropdown === 'location' ? 'text-blue-500' : 'text-gray-500 hover:text-blue-500'
                  ]"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-map-pin size-5 shrink-0"><path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0"></path><circle cx="12" cy="10" r="3"></circle></svg>
                </button>
                <transition name="fade-slide">
                  <div
                    v-if="activeDropdown.type === 'location' && activeDropdown.target === 'new'"
                    class="dropdown absolute mt-1 p-2 bg-gray-100 rounded shadow z-50 max-w-xs"
                  >
                    <div class="flex w-64">
                      <input
                        v-model="locationInput"
                        placeholder="请输入位置..."
                        class="flex-1 px-3 py-2 border border-gray-300 rounded-l-md outline-none"
                        @keydown.enter.prevent="insertLocation('new')"
                      />
                      <button
                        @click="insertLocation('new')"
                        class="px-3 py-2 bg-blue-500 text-white rounded-r-md hover:bg-blue-600 border-none transition-colors duration-300"
                      >
                        插入
                      </button>
                    </div>
                  </div>
                </transition>
                <button @click="() => newFileInput.click()" class="border-none bg-transparent text-gray-500 hover:text-blue-500 cursor-pointer transition-colors">
                  <input type="file" multiple ref="newFileInput" class="hidden" @change="e => handleFileSelect(e, 'talks', 'new')" />
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-image size-5"><rect x="3" y="3" width="18" height="18" rx="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><path d="M21 15l-5-5L5 21"></path></svg>
                </button>
              </div>
              <button
                @click="addNewTalk"
                class="px-3 py-1 bg-blue-500 text-white border-none rounded hover:bg-blue-600 transition-colors duration-300"
              >
                保存
              </button>
            </div>
          </div>
          <div class="mb-6 p-4 rounded shadow transition-color duration-300 text-gray-500">
            <div>Tags:</div>
            <div class="mt-2 border border-dashed border-gray-300 rounded flex flex-wrap items-center gap-2 p-2">
              <template v-if="allTags.length > 0">
                <span
                  v-for="tag in allTags"
                  :key="tag"
                  @click="selectTag(tag)"
                  :class="[
                    'px-2 py-0.5 text-xs rounded cursor-pointer transition-colors duration-300',
                    currentTag === tag ? 'bg-blue-500 text-white' : 'bg-blue-100 hover:bg-blue-200 text-blue-600'
                  ]"
                >
                  #{{ tag }}
                </span>
              </template>
              <template v-else>
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="m15 5 6.3 6.3a2.4 2.4 0 0 1 0 3.4L17 19"></path>
                  <path d="M9.586 5.586A2 2 0 0 0 8.172 5H3a1 1 0 0 0-1 1v5.172a2 2 0 0 0 .586 1.414L8.29 18.29a2.426 2.426 0 0 0 3.42 0l3.58-3.58a2.426 2.426 0 0 0 0-3.42z"></path>
                  <circle cx="6.5" cy="9.5" r=".5" fill="currentColor"></circle>
                </svg>
                <p class="text-sm leading-snug italic">你可以输入 `#tag` 来添加标签。</p>
              </template>
            </div>
          </div>
          <div class="mb-6 p-3 rounded shadow">
            <button @click="exportMemos" class="cursor-pointer bg-transparent border-none text-gray-400 hover:text-blue-500 cursor-pointer transition-colors">导出说说</button>
            <button @click="importMemos" class="cursor-pointer bg-transparent border-none text-gray-400 hover:text-blue-500 cursor-pointer transition-colors">导入说说</button>
            <button @click="syncFromMemos" class="cursor-pointer bg-transparent border-none text-gray-400 hover:text-blue-500 cursor-pointer transition-colors">从 Memos 同步</button>
          </div>
        </div>
        <div class="w-full">
          <!-- 说说列表 -->
          <div class="space-y-4">
            <div
              v-for="talk in talks"
              :key="talk.id"
              class="p-4 bg-white dark:bg-gray-800 rounded shadow"
            >
              <!-- 编辑模式 -->
              <div v-if="editingId === talk.id">
                <textarea
                  v-model="editingContent"
                  id="edit-talk-content"
                  class="w-full min-h-100px my-1 text-base rounded border-none text-gray-900 resize-none focus:outline-none"
                  @input="autoResize"
                  @keydown="handleEditorKeyDown"
                ></textarea>
                <div class="w-full border border-dashed border-gray-300"></div>
                <div class="flex justify-between mt-2">
                  <div class="mt-1">
                    <button
                      ref="tagButton"
                      @click.stop="toggleDropdown('tag','editing')"
                      :class="[
                        'border-none bg-transparent cursor-pointer transition-colors',
                        activeDropdown === 'tag' ? 'text-blue-500' : 'text-gray-500 hover:text-blue-500'
                      ]"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-hash size-5"><line x1="4" x2="20" y1="9" y2="9"></line><line x1="4" x2="20" y1="15" y2="15"></line><line x1="10" x2="8" y1="3" y2="21"></line><line x1="16" x2="14" y1="3" y2="21"></line></svg>
                    </button>
                    <transition name="fade-slide">
                      <div v-if="activeDropdown.type === 'tag' && activeDropdown.target === 'editing'" class="dropdown absolute mt-1 p-2 bg-gray-100 rounded shadow z-50 max-w-xs">
                        <span 
                          v-for="tag in allTags" 
                          :key="tag" 
                          @click="insertTag(tag)"
                          class="mx-1 text-sm text-blue-500 hover:text-blue-800 rounded cursor-pointer transition-colors"
                        >
                          #{{ tag }}
                        </span>
                      </div>
                    </transition>
                    <button
                      ref="markdownButton"
                      @click.stop="toggleDropdown('markdown','editing')"
                      :class="[
                        'border-none bg-transparent cursor-pointer transition-colors',
                        activeDropdown === 'markdown' ? 'text-blue-500' : 'text-gray-500 hover:text-blue-500'
                      ]"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-square-slash size-5"><rect width="18" height="18" x="3" y="3" rx="2"></rect><line x1="9" x2="15" y1="15" y2="9"></line></svg>
                    </button>
                    <transition name="fade-slide">
                      <div v-if="activeDropdown.type === 'markdown' && activeDropdown.target === 'editing'" class="dropdown absolute mt-1 p-2 bg-gray-100 rounded shadow z-50 max-w-xs">
                        <span 
                          v-for="item in mdOptions" 
                          :key="item.label" 
                          @click="insertMd(item.syntax)"
                          class="mx-1 text-sm text-blue-500 hover:text-blue-800 rounded cursor-pointer transition-colors"
                        >
                          {{ item.label }}
                        </span>
                      </div>
                    </transition>
                    <button
                      ref="locationButton"
                      @click.stop="toggleDropdown('location','editing')"
                      :class="[
                        'border-none bg-transparent cursor-pointer transition-colors',
                        activeDropdown === 'location' ? 'text-blue-500' : 'text-gray-500 hover:text-blue-500'
                      ]"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-map-pin size-5 shrink-0"><path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0"></path><circle cx="12" cy="10" r="3"></circle></svg>
                    </button>
                    <transition name="fade-slide">
                      <div
                        v-if="activeDropdown.type === 'location' && activeDropdown.target === 'editing'"
                        class="dropdown absolute mt-1 p-2 bg-gray-100 rounded shadow z-50 max-w-xs"
                      >
                        <div class="flex w-64">
                          <input
                            v-model="locationInput"
                            placeholder="请输入位置..."
                            class="flex-1 px-3 py-2 border border-gray-300 rounded-l-md outline-none"
                            @keydown.enter.prevent="insertLocation('editing')"
                          />
                          <button
                            @click="insertLocation('editing')"
                            class="px-3 py-2 bg-blue-500 text-white rounded-r-md hover:bg-blue-600 border-none transition-colors duration-300"
                          >
                            插入
                          </button>
                        </div>
                      </div>
                    </transition>
                    <button @click="handleEditFileClick(talk.id)" class="border-none bg-transparent text-gray-500 hover:text-blue-500 cursor-pointer transition-colors">
                      <input 
                        type="file" 
                        multiple 
                        :ref="el => { if (el) editFileInputs[talk.id] = el }"
                        class="hidden" 
                        @change="e => handleFileSelect(e, 'talks', 'editing')" 
                      />
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-image size-5"><rect x="3" y="3" width="18" height="18" rx="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><path d="M21 15l-5-5L5 21"></path></svg>
                    </button>
                  </div>
                  <div class="flex items-center space-x-2">
                    <button
                      @click="saveEdit(editingId)"
                      class="px-3 py-1 bg-blue-500 text-white border-none rounded hover:bg-blue-600 transition-colors duration-300"
                    >
                      保存
                    </button>
                    <button
                      @click="cancelEdit"
                      class="px-3 py-1 bg-gray-400 text-white border-none rounded hover:bg-gray-500 transition-colors duration-300"
                    >
                      取消
                    </button>
                  </div>
                </div>
              </div>

              <!-- 显示模式 -->
              <div v-else @dblclick="startEdit(talk)">
                <!-- 时间 -->
                <div class="text-sm text-gray-500 dark:text-gray-400">
                  {{ formatDate(talk.created_at) }}
                </div>

                <!-- 内容 -->
                <p class="text-gray-900 dark:text-gray-100 whitespace-pre-line" v-html="renderContent(talk)"></p>

                <!-- 图片部分 -->
                <div v-if="talk.imgs && talk.imgs.length > 0" class="flex flex-wrap gap-2">
                  <a
                    v-for="(img, idx) in getImgBlocks(talk)"
                    :key="idx"
                    :href="img.url"
                    :data-fancybox="`gallery-${talk.id}`"
                    :data-caption="img.alt"
                  >
                    <img
                      :src="img.url"
                      :alt="img.alt"
                      class="w-16 h-16 object-cover rounded cursor-pointer"
                    />
                  </a>
                </div>

                <!-- 操作按钮 -->
                <div class="flex flex-wrap items-center justify-between mt-2 gap-2">
                  <div
                    class="flex flex-wrap gap-2 items-center flex-1"
                    :class="{ 'invisible': !(talk.tags?.length || talk.links?.length || talk.location) }"
                  >
                    <span
                      v-for="tag in talk.tags"
                      :key="tag"
                      class="px-2 py-0.5 text-xs bg-blue-100 text-blue-600 rounded"
                    >
                      #{{ tag }}
                    </span>
                    <span
                      v-if="talk.location"
                      class="pl-0.5 pr-2 py-0.5 text-xs bg-green-100 text-green-700 rounded"
                    >
                      📍{{ talk.location }}
                    </span>
                    <a
                      v-for="(link, index) in talk.links"
                      :key="index"
                      :href="link.url"
                      target="_blank"
                      rel="noopener noreferrer"
                      class="px-2 py-0.5 text-xs bg-red-100 text-red-600 rounded cursor-pointer no-underline"
                    >
                      {{ link.text }}
                    </a>
                  </div>
                  <div class="flex items-center space-x-2">
                    <button
                      @click="startEdit(talk)"
                      class="px-3 py-1 bg-blue-500 text-white border-none rounded hover:bg-blue-600 transition-colors duration-300"
                    >
                      编辑
                    </button>
                    <button
                      @click="removeTalk(talk.id)"
                      class="px-3 py-1 bg-red-500 text-white border-none rounded hover:bg-red-600 transition-colors duration-300"
                    >
                      删除
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div v-if="talks.length === 0" class="text-gray-500 dark:text-gray-400 text-center py-10">
              暂无说说
            </div>

            <div v-else>
              <div v-if="!finished" class="text-center mt-4">
                <button
                  @click="loadTalks()"
                  :disabled="loading"
                  class="px-4 py-2 bg-gray-200 hover:bg-gray-300 border-none shadow rounded transition disabled:opacity-50"
                >
                  {{ loading ? '加载中...' : '加载更多' }}
                </button>
              </div>
              <div v-else class="text-gray-400 text-center mt-4">
                已加载全部！
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup>
import { onMounted, onBeforeUnmount, ref } from 'vue'
import axios from 'axios'
import { useTalks } from '@/composables/useTalks'
import { useS3 } from '@/composables/useS3'

import { Fancybox } from '@fancyapps/ui'
import '@fancyapps/ui/dist/fancybox/fancybox.css'

const { talks, getTalks, editTalk, deleteTalk, addTalkInternal, importMemos, exportMemos, } = useTalks()
const newContent = ref('')
const editingId = ref(null)
const editingContent = ref('')
const currentTag = ref(null)
const allTags = ref([])
const page = ref(1)
const pageSize = 20
const finished = ref(false)
const loading = ref(false)

let apiKey = null
if (import.meta.client) {
  apiKey = localStorage.getItem('api_key')
}
const s3Config = ref({})
let s3 = null

// 初始化 S3 配置
function loadS3Config() {
  if (import.meta.client) {
    const saved = localStorage.getItem('s3_config')
    if (saved && apiKey) {
      s3 = useS3({ apiKey })
      const config = s3.decryptConfig(saved)
      s3Config.value = config
    }
  }
}
onMounted(loadS3Config)

const uploadLoading = ref(false)
const uploadError = ref('')
const newFileInput = ref(null)
const editFileInputs = ref({})
const handleEditFileClick = (talkId) => {
  if (editFileInputs.value[talkId]) {
    editFileInputs.value[talkId].click()
  }
}

// 上传图片
const handleFileSelect = async (event, prefix = '', mode = 'new') => {
  const files = Array.from(event.target.files)

  event.target.value = ''

  const imageFiles = files.filter(file => {
    const ext = file.name.toLowerCase().split('.').pop()
    return (
      (file.type && file.type.startsWith('image/')) ||
      ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(ext)
    )
  })

  if (imageFiles.length === 0) {
    alert('请选择图片文件！')
    return
  }

  if (imageFiles.length < files.length) {
    alert(`已自动忽略非图片文件，仅上传 ${imageFiles.length} 张图片`)
  }

  if (!s3 || !s3Config.value || !s3Config.value.bucket) {
    alert('请先前往图片管理页面进行配置')
    return []
  }

  uploadLoading.value = true
  uploadError.value = ''

  try {
    const urls = await s3.uploadFiles({
      files: imageFiles,
      cfg: s3Config.value,
      prefix,
      customDomain: s3Config.value.customDomain
        ? (s3Config.value.customDomain.endsWith('/')
            ? s3Config.value.customDomain
            : s3Config.value.customDomain + '/')
        : ''
    })

    urls.forEach(url => {
      if (mode === 'new') {
        newContent.value += `\n![图片](${url})`
      } else if (mode === 'editing') {
        editingContent.value += `\n![图片](${url})`
      }
    })
  } catch (e) {
    console.error(e)
    alert('⚠️ 上传失败，请重试')
  } finally {
    uploadLoading.value = false
  }
}

// 编辑器工具栏
const tagButton = ref(null)
const markdownButton = ref(null)
const locationButton = ref(null)
const activeDropdown = ref({ type: null, target: null })

const mdOptions = [
  { label: '加粗', syntax: '**加粗内容**' },
  { label: '斜体', syntax: '*斜体内容*' },
  { label: '链接', syntax: '[链接文字](https://)' },
  { label: '图片', syntax: '![图片描述](https://)' },
  { label: '代码', syntax: '```\n代码块\n```' },
  { label: '任务列表', syntax: '- [ ] 未完成\n- [x] 已完成' },
]

// 插入定位
const locationInput = ref('')
const insertLocation = (target) => {
  const text = locationInput.value.trim()
  if (!text) return

  const syntax = `<location: ${text}/>`
  if (target === 'new') {
    newContent.value += syntax
  } else if (target === 'editing') {
    editingContent.value += syntax
  }

  locationInput.value = ''
  activeDropdown.value = { type: null, target: null }
}

const toggleDropdown = (type, target) => {
  if (activeDropdown.value.type === type && activeDropdown.value.target === target) {
    activeDropdown.value = { type: null, target: null }
  } else {
    activeDropdown.value = { type, target }
  }
}

const insertTag = (tag) => {
  if (activeDropdown.value.target === 'new') newContent.value += `\n#${tag} `
  else if (activeDropdown.value.target === 'editing') editingContent.value += `\n#${tag} `
  activeDropdown.value = { type: null, target: null }
}

const insertMd = (syntax) => {
  if (activeDropdown.value.target === 'new') newContent.value += syntax
  else if (activeDropdown.value.target === 'editing') editingContent.value += syntax
  activeDropdown.value = { type: null, target: null }
}

const handleClickOutside = (e) => {
  if (e.target.closest('.dropdown')) return
  activeDropdown.value = { type: null, target: null }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onBeforeUnmount(() => {
  document.removeEventListener('click', handleClickOutside)
})

// 自动高度调整
const autoResize = (event) => {
  const el = event.target
  el.style.height = 'auto'
  el.style.height = el.scrollHeight + 'px'
}

// 解析标签、Markdown 链接、图片和 location
function parseContent(text) {
  const tagRegex = /(^|\s)#([\u4e00-\u9fa5\w-]+)/g
  const linkRegex = /(?<!\!)\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g
  const imgRegex = /!\[([^\]]*)\]\((https?:\/\/[^\s)]+)\)/g
  const locationRegex = /<location:\s*([^\/>]+)\s*\/>/

  let placeholderIndex = 0
  const placeholders = new Map()

  // 临时替换Markdown 链接、图片和 location
  const protectedText = text
    .replace(imgRegex, (m) => {
      const key = `__IMG${placeholderIndex++}__`
      placeholders.set(key, m)
      return key
    })
    .replace(linkRegex, (m) => {
      const key = `__LINK${placeholderIndex++}__`
      placeholders.set(key, m)
      return key
    })
    .replace(locationRegex, (m) => {
      const key = `__LOC${placeholderIndex++}__`
      placeholders.set(key, m)
      return key
    })

  // 匹配标签
  const tags = []
  let match
  while ((match = tagRegex.exec(protectedText))) {
    tags.push(match[2])
  }

  // 还原文本
  let restoredText = protectedText
  for (const [key, value] of placeholders.entries()) {
    restoredText = restoredText.replace(key, value)
  }

  // 链接提取
  const linksMap = new Map()
  let contentWithPlaceholders = restoredText
  while ((match = linkRegex.exec(restoredText))) {
    const [full, linkText, url] = match
    const key = `${linkText}|${url}`
    if (!linksMap.has(key)) linksMap.set(key, { text: linkText, url })
    contentWithPlaceholders = contentWithPlaceholders.replace(full, `<talkLink>${linkText}</talkLink>`)
  }
  const links = Array.from(linksMap.values())

  // 图片提取
  const imgsMap = new Map()
  while ((match = imgRegex.exec(restoredText))) {
    const [full, alt, url] = match
    if (!imgsMap.has(url)) imgsMap.set(url, { alt, url })
    contentWithPlaceholders = contentWithPlaceholders.replace(full, `<talkImg>${alt}</talkImg>`)
  }
  const imgs = Array.from(imgsMap.values())

  // 解析 location
  let location = null
  const locationMatch = contentWithPlaceholders.match(locationRegex)
  if (locationMatch) {
    location = locationMatch[1].trim()
    contentWithPlaceholders = contentWithPlaceholders.replace(locationRegex, '')
  }

  // 移除标签文本
  const pureContent = contentWithPlaceholders.replace(tagRegex, '').trim()

  return { pureContent, tags, links, imgs, location }
}

function restoreForEdit(content, links, imgs, location) {
  let restored = content
  // 还原链接
  if (links && links.length > 0) {
    links.forEach(link => {
      const placeholder = new RegExp(`<talkLink>${escapeReg(link.text)}</talkLink>`, 'g')
      restored = restored.replace(placeholder, `[${link.text}](${link.url})`)
    })
  }
  // 还原图片
  if (imgs && imgs.length > 0) {
    imgs.forEach(img => {
      const placeholder = new RegExp(`<talkImg>${escapeReg(img.alt)}</talkImg>`, 'g')
      restored = restored.replace(placeholder, `![${img.alt}](${img.url})`)
    })
  }
  // 还原定位
  if (location) {
    restored = `${restored}\n<location: ${location}/>`
  }

  return restored
}

// 转义正则特殊字符
function escapeReg(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

// 渲染内容
function renderContent(talk) {
  let html = talk.content

  // 移除 <talkImg> 标签 和 <talkLink> 标签
  html = html.replace(/\n*<talkImg>.*?<\/talkImg>/g, '')
  html = html.replace(/\n*<talkLink>.*?<\/talkLink>/g, '')
    
  // 任务列表
  let taskIdCounter = 1;
  html = html.replace(
    /((?:- \[(?: |x)\] .+\n?)+)/g,
    (match) => {
      const items = match.trim().split('\n').map(line => {
        const [, status, task] = /- \[( |x)\] (.+)/.exec(line)
        const checked = status === 'x' ? 'checked' : ''
        const id = `task-${talk.id}-${taskIdCounter++}`
        return `<li class="flex items-center gap-1"><label for="${id}" class="leading-snug flex items-center"><input id="${id}" type="checkbox" class="custom-checkbox mr-1 mt-0.5" disabled ${checked} /><span ${checked ? 'class="line-through opacity-70"' : ''}>${task}</span></label></li>`
      }).join('')
      return `<ul class="list-none my-1 -ml-10">${items}</ul>`
    }
  )

  // 处理代码块
  html = html.replace(/```(\w*)\n([\s\S]*?)```/g, (_, lang, code) => {
    const languageClass = lang ? `language-${lang}` : ''
    return `<pre class="bg-gray-100 dark:bg-gray-700 p-2 rounded overflow-auto"><code class="${languageClass}">${escapeHtml(code)}</code></pre>`
  })

  // 加粗
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
  html = html.replace(/__(.+?)__/g, '<strong>$1</strong>')
  // 斜体
  html = html.replace(/(?<!\*)\*(?!\*)(.+?)(?<!\*)\*(?!\*)/g, '<em>$1</em>')
  html = html.replace(/(?<!_)_(?!_)(.+?)(?<!_)_(?!_)/g, '<em>$1</em>')

  return html
}

//获取图片数量
function getImgBlocks(talk) {
  if (!talk.content) return []
  const matches = [...talk.content.matchAll(/<talkImg>(.*?)<\/talkImg>/g)]
  return matches.map(match => {
    const alt = match[1]
    const imgObj = talk.imgs.find(i => i.alt === alt)
    return imgObj || { url: '', alt }
  })
}

// 转义 HTML 防止 XSS
function escapeHtml(str) {
  return str.replace(/[&<>"']/g, function(m) { return ({
    '&':'&amp;',
    '<':'&lt;',
    '>':'&gt;',
    '"':'&quot;',
    "'":'&#39;'
  })[m]})
}

// 标签筛选
const selectTag = (tag) => {
  if (currentTag.value === tag) {
    currentTag.value = null
  } else {
    currentTag.value = tag
  }

  page.value = 1
  finished.value = false
  talks.value = []
  loadTalks(true)
}

// 获取说说
const loadTalks = async (reset = false) => {
  if (loading.value) return
  loading.value = true

  if (reset) {
    page.value = 1
    finished.value = false
    talks.value = []
  }

  const params = { page: page.value, pageSize }
  if (currentTag.value) params.tag = currentTag.value

  const res = await getTalks(params)

  if (res.data && Array.isArray(res.data)) {
    if (reset) {
      talks.value = res.data
    } else {
      const existingIds = new Set(talks.value.map(t => t.id))
      const newTalks = res.data.filter(t => !existingIds.has(t.id))
      talks.value.push(...newTalks)
    }
  }

  if (res.allTags) allTags.value = res.allTags

  const totalPages = res.totalPages || 1
  if (page.value >= totalPages) finished.value = true
  else page.value++

  loading.value = false
}

// 添加新说说
const addNewTalk = async () => {
  if (!newContent.value.trim()) return alert('内容不能为空')

  const { pureContent, location, tags, links, imgs } = parseContent(newContent.value)
  const addTalk = async (talk) => {
    return addTalkInternal(talk, true)
  }
  const res = await addTalk({ content: pureContent, location, tags, links, imgs })
  if (res && res.success) {
    newContent.value = ''
    await loadTalks()
  }
}

// 删除说说
const removeTalk = async (id) => {
  if (!confirm('确定删除这条说说吗？')) return
  const res = await deleteTalk(id)
  if (res && res.success) {
    await loadTalks()
  }
}

// 开始编辑
const startEdit = (talk) => {
  editingId.value = talk.id

  // 拼接标签
  const contentWithTags = talk.tags && talk.tags.length > 0
    ? '\n' + talk.tags.map(t => `#${t}`).join(' ')
    : ''

  // 还原
  editingContent.value = restoreForEdit(
    talk.content + contentWithTags,
    talk.links,
    talk.imgs,
    talk.location
  )
}

// 取消编辑
const cancelEdit = () => {
  editingId.value = null
  editingContent.value = ''
}

// 保存编辑
const saveEdit = async (id) => {
  if (!editingContent.value.trim()) return alert('内容不能为空')

  const { pureContent, location, tags, links, imgs } = parseContent(editingContent.value)
  const res = await editTalk({ id, content: pureContent, location, tags, links, imgs })
  if (res && res.success) {
    editingId.value = null
    editingContent.value = ''
    await loadTalks()
  }
}

// 从 Memos 同步
const syncFromMemos = async () => {
    const apiUrl = prompt('请输入 Memos API 地址（https://example.com/api/v1/memos）')
    if (!apiUrl) return alert('未输入 API 地址')

    try {
        const res = await axios.get(apiUrl)
        if (!res.data || !res.data.memos) return alert('API 返回格式不正确！可能是新版本更改了接口，暂时只适配v1。')

        const memos = res.data.memos
        let successCount = 0

        for (const memo of memos) {
            const content = memo.content || memo.snippet || ''
            if (!content.trim()) continue

            const { pureContent, tags, links, imgs } = parseContent(content)

            const talk = {
                content: pureContent,
                tags,
                links,
                imgs,
                created_at: memo.createTime
            }

            try {
                await addTalkInternal(talk, false)
                successCount++
            } catch (err) {
                console.error('添加失败：', talk, err)
            }
        }

        await getTalks()
        alert(`同步完成，共导入 ${successCount} 条说说。附件暂不支持导入！`)
    } catch (err) {
        console.error(err)
        alert('同步失败，请检查 API 地址或网络连接')
    }
}

// 页面挂载时获取说说
onMounted(loadTalks)

// 格式化日期
const formatDate = (date) => {
  if (!date) return ''
  return new Date(date).toLocaleString()
}

onMounted(() => {
  // 初始化 Fancybox
  Fancybox.bind('[data-fancybox]', {
    Hash: false
  })
})

// 快捷键
const handleEditorKeyDown = (e) => {
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
    e.preventDefault()

    if (editingId.value !== null) {
      if (confirm('确定保存当前编辑吗？')) {
        saveEdit(editingId.value)
      }
    } else if (newContent.value.trim()) {
      if (confirm('确定添加新的说说吗？')) {
        addNewTalk()
      }
    }
  }
}
</script>

<style>
/* 隐藏浏览器默认勾 */
.custom-checkbox {
  -webkit-appearance: none;
  appearance: none;
  width: 16px;
  height: 16px;
  border: 2px solid #9ca3af;
  border-radius: 4px;
  background-color: transparent;
  position: relative;
}

/* 选中状态 */
.custom-checkbox:checked {
  background-color: #22c55e;
  border-color: #22c55e;
}

/* 勾 */
.custom-checkbox:checked::after {
  content: "✔";
  color: #fff;
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -55%);
  font-size: 12px;
  line-height: 1;
}

/* 选择标签面板动画 */
.fade-slide-enter-active, .fade-slide-leave-active {
  transition: all 0.2s ease;
}
.fade-slide-enter-from, .fade-slide-leave-to {
  opacity: 0;
  transform: translateY(-5px);
}
.fade-slide-enter-to, .fade-slide-leave-from {
  opacity: 1;
  transform: translateY(0);
}
</style>