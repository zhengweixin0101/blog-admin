<template>
  <Teleport to="body">
    <div
      v-if="visible"
      class="fixed inset-0 bg-black/40 flex items-center justify-center z-10000 p-4 overflow-hidden"
      tabindex="-1"
      @keydown.esc="close"
    >
      <div class="bg-white rounded-lg shadow-lg w-[560px] max-w-full max-h-[85vh] flex flex-col">
        <!-- 头部 -->
        <div class="flex items-center justify-between px-5 py-3 border-b border-gray-200 flex-shrink-0">
          <h2 class="text-lg font-bold m-0">插入分享链接</h2>
          <button
            class="bg-transparent border-none text-lg text-gray-400 hover:text-gray-600 cursor-pointer"
            @click="close"
          >
            ✕
          </button>
        </div>

        <!-- 标签页切换 -->
        <div class="flex gap-2 px-5 pt-3 flex-shrink-0">
          <button
            v-for="t in tabs"
            :key="t.value"
            class="px-4 py-1.5 text-sm border-none rounded cursor-pointer transition-colors"
            :class="tab === t.value
              ? 'bg-blue-500 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-blue-100 hover:text-blue-600'"
            @click="tab = t.value"
          >
            {{ t.label }}
          </button>
        </div>

        <!-- 选择已有分享 -->
        <div v-if="tab === 'select'" class="flex-1 flex flex-col min-h-0 px-5 py-3">
          <input
            v-model.trim="keyword"
            type="text"
            placeholder="搜索名称或描述..."
            class="w-full box-border text-sm border rounded px-2 py-1.5 mb-3 flex-shrink-0"
          />
          <div class="flex-1 overflow-y-auto min-h-0">
            <div v-if="loadingShares" class="text-center text-gray-400 py-8 text-sm">
              正在加载分享...
            </div>
            <template v-else>
              <div v-if="filteredShares.length === 0" class="text-center text-gray-400 py-8 text-sm">
                {{ shares.length === 0 ? '暂无分享，可切换到「新建分享」' : '没有匹配的分享' }}
              </div>
              <div
                v-for="share in filteredShares"
                :key="share.id"
                class="border border-gray-200 rounded p-3 mb-2 hover:border-blue-400 transition-colors"
              >
                <div class="flex items-center justify-between gap-2">
                  <div class="min-w-0 flex-1">
                    <p class="m-0 font-semibold text-gray-900 truncate text-sm">{{ share.name }}</p>
                    <p class="m-0 text-xs text-gray-400 truncate mt-0.5">
                      {{ share.description || (share.drives || []).map(d => d.driveName).join(' / ') || '暂无网盘链接' }}
                    </p>
                  </div>
                  <div class="flex items-center gap-2 flex-shrink-0">
                    <code class="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded whitespace-nowrap">
                      #{{ share.id }}
                    </code>
                    <button
                      class="px-3 py-1 bg-blue-500 text-white border-none rounded text-sm cursor-pointer hover:bg-blue-600 transition-colors"
                      @click="insertShare(share)"
                    >
                      插入
                    </button>
                  </div>
                </div>
              </div>
            </template>
          </div>
        </div>

        <!-- 新建分享 -->
        <div v-else class="flex-1 overflow-y-auto min-h-0 px-5 py-3">
          <label class="flex flex-col gap-1 text-sm text-gray-600 mb-3">
            <span>名称 <span class="text-red-500">*</span></span>
            <input
              v-model.trim="newForm.name"
              type="text"
              placeholder="资源名称"
              class="w-full box-border text-sm border rounded px-2 py-1"
            />
          </label>
          <label class="flex flex-col gap-1 text-sm text-gray-600 mb-3">
            描述
            <textarea
              v-model="newForm.description"
              placeholder="资源描述（可选）"
              class="w-full box-border text-sm border rounded px-2 py-1 resize-none"
            ></textarea>
          </label>

          <div class="pt-3 border-t border-gray-200">
            <div class="mb-2 flex flex-wrap items-center gap-1.5">
              <span class="text-xs text-gray-400">添加链接:</span>
              <button
                v-for="preset in drivePresets"
                :key="preset"
                type="button"
                :disabled="newForm.drives.length >= MAX_DRIVES"
                @click="addDrive(preset === CUSTOM_DRIVE ? '' : preset)"
                class="px-2 py-0.5 text-xs bg-gray-100 text-gray-600 border-none rounded hover:bg-blue-100 hover:text-blue-600 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {{ preset }}
              </button>
            </div>
            <div class="border border-dashed border-gray-300 rounded flex flex-col gap-2 p-2">
              <div
                v-for="(drive, index) in newForm.drives"
                :key="drive._key"
                class="p-2 bg-gray-50 border border-gray-200 rounded flex items-center gap-2"
              >
                <input
                  v-model.trim="drive.driveName"
                  type="text"
                  placeholder="网盘名称"
                  class="flex-[0.6] min-w-0 text-sm border rounded px-2 py-1"
                />
                <input
                  v-model.trim="drive.url"
                  type="text"
                  placeholder="网盘链接"
                  class="flex-[2.4] min-w-0 text-sm border rounded px-2 py-1"
                />
                <input
                  v-model.trim="drive.accessCode"
                  type="text"
                  placeholder="提取码(可选)"
                  class="w-20 text-sm border rounded px-2 py-1"
                />
                <button
                  @click="removeDrive(index)"
                  class="flex-shrink-0 w-7 h-7 flex items-center justify-center bg-transparent border-none rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-200 transition-colors cursor-pointer"
                  title="删除该链接"
                >
                  <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div v-if="newForm.drives.length === 0" class="flex items-center justify-center py-1">
                <p class="text-sm leading-snug italic text-gray-400 m-0">暂无网盘链接，点击上方按钮添加。</p>
              </div>
            </div>
          </div>

          <div class="flex justify-end pt-3 pb-1">
            <button
              @click="createAndInsert"
              class="px-4 py-1.5 bg-blue-500 text-white border-none rounded cursor-pointer hover:bg-blue-600 transition-colors text-sm"
            >
              创建并插入
            </button>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { ref, computed, onUnmounted } from 'vue'
import { useShares } from '@/composables/useShares'
import { siteConfig } from '@/site.config.js'
import { alert, confirm } from '@/composables/useModal'
import { toast } from '~/composables/useToast'

const props = defineProps({
  articleUrl: {
    type: String,
    default: ''
  }
})
const emit = defineEmits(['insert'])

const { shares, getShares, saveShare } = useShares()

const visible = ref(false)
const loadingShares = ref(false)
const tab = ref('select')
const keyword = ref('')

const tabs = [
  { label: '选择已有', value: 'select' },
  { label: '新建分享', value: 'create' }
]

// 常用网盘预设，与分享管理页保持一致
const CUSTOM_DRIVE = '自定义'
const DRIVE_PRESETS = ['123网盘', '阿里云盘', '夸克网盘']
const MAX_DRIVES = 10

const drivePresets = [...DRIVE_PRESETS, CUSTOM_DRIVE]

let driveKeySeed = 0
const newForm = ref({ name: '', description: '', drives: [] })

function resetNewForm() {
  newForm.value = { name: '', description: '', drives: [] }
}

function addDrive(driveName = '') {
  if (newForm.value.drives.length >= MAX_DRIVES) return
  newForm.value.drives.push({ _key: ++driveKeySeed, driveName, url: '', accessCode: '' })
}

function removeDrive(index) {
  newForm.value.drives.splice(index, 1)
}

// 按名称/描述过滤已有分享
const filteredShares = computed(() => {
  const kw = keyword.value.trim().toLowerCase()
  if (!kw) return shares.value
  return shares.value.filter(s =>
    (s.name || '').toLowerCase().includes(kw) ||
    (s.description || '').toLowerCase().includes(kw)
  )
})

// 分享跳转链接
function buildLink(share) {
  return `${siteConfig.apiUrl}/api/shares?id=${share.id}&type=redirect`
}

async function open() {
  visible.value = true
  document.body.style.overflow = 'hidden'
  tab.value = 'select'
  keyword.value = ''
  resetNewForm()
  // 每次打开都刷新列表，保证数据最新
  loadingShares.value = true
  try {
    await getShares({ silent: true })
  } finally {
    loadingShares.value = false
  }
}

function close() {
  visible.value = false
  document.body.style.overflow = ''
}

async function offerArticleLink(share) {
  if (!props.articleUrl || (share.description || '').includes(props.articleUrl)) return

  const confirmed = await confirm(`是否将当前文章链接添加到「${share.name}」的描述中？`)
  if (!confirmed) return

  const description = [share.description?.trim(), props.articleUrl].filter(Boolean).join('\n')
  if (description.length > 500) {
    await alert('添加后描述将超过 500 字，未修改分享')
    return
  }

  const result = await saveShare({
    id: share.id,
    name: share.name,
    description,
    drives: share.drives || []
  })
  if (result?.success) {
    toast('已将文章链接添加到分享描述')
  } else {
    await alert(`添加文章链接失败：${result?.error || '请重试'}`)
  }
}

// 选中分享并插入
async function insertShare(share) {
  emit('insert', { name: share.name, url: buildLink(share) })
  close()
  await offerArticleLink(share)
}

// 新建分享并插入
async function createAndInsert() {
  const form = newForm.value
  if (!form.name) {
    await alert('请输入资源名称')
    return
  }
  if (form.name.length > 200) {
    await alert('资源名称过长，最多 200 字')
    return
  }
  if ((form.description || '').length > 500) {
    await alert('描述过长，最多 500 字')
    return
  }
  if (form.drives.length === 0) {
    await alert('请至少添加一个网盘链接')
    return
  }
  for (let i = 0; i < form.drives.length; i++) {
    const drive = form.drives[i]
    if (!drive.driveName) {
      await alert(`第 ${i + 1} 个网盘未设置名称`)
      return
    }
    if (!/^https?:\/\//.test(drive.url)) {
      await alert(`第 ${i + 1} 个网盘链接不正确，需以 http(s):// 开头`)
      return
    }
  }

  const payload = {
    name: form.name,
    description: form.description || '',
    drives: form.drives
      .filter(d => d.driveName && d.url)
      .map(({ _key, ...drive }) => drive)
  }

  const res = await saveShare(payload)
  if (res && res.success && res.share) {
    await insertShare({
      ...payload,
      ...res.share,
      name: res.share.name || payload.name,
      description: res.share.description ?? payload.description,
      drives: res.share.drives || payload.drives
    })
  }
}

onUnmounted(() => {
  document.body.style.overflow = ''
})

defineExpose({ open })
</script>
