<template>
  <div class="flex">
    <main class="p-8 flex-1">
      <h1 class="text-2xl font-bold mb-6">分享管理</h1>
      <div class="grid grid-cols-1 md:grid-cols-[2fr_3fr] gap-10 items-start">
        <!-- 左侧：添加/编辑表单 -->
        <div class="bg-white border rounded-lg shadow">
          <div class="p-4">
            <div class="flex flex-col gap-3">
              <label class="flex flex-col gap-1 text-sm text-gray-600">
                <span>名称 <span class="text-red-500">*</span></span>
                <input
                  v-model.trim="form.name"
                  type="text"
                  placeholder="资源名称"
                  class="w-full box-border text-sm border rounded px-2 py-1"
                />
              </label>
              <label class="flex flex-col gap-1 text-sm text-gray-600">
                描述
                <textarea
                  v-model="form.description"
                  placeholder="资源描述（可选）"
                  class="w-full box-border text-sm border rounded px-2 py-1 resize-none"
                ></textarea>
              </label>
            </div>

            <!-- 网盘链接 -->
            <div class="mt-4 pt-4 border-t border-gray-200">
              <div class="mb-2 flex flex-wrap items-center gap-1.5">
                <span class="text-xs text-gray-400">添加链接:</span>
                <button
                  v-for="preset in drivePresets"
                  :key="preset"
                  type="button"
                  :disabled="form.drives.length >= MAX_DRIVES"
                  @click="addDrive(preset === CUSTOM_DRIVE ? '' : preset)"
                  class="px-2 py-0.5 text-xs bg-gray-100 text-gray-600 border-none rounded hover:bg-blue-100 hover:text-blue-600 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {{ preset }}
                </button>
              </div>
              <div ref="driveListRef" class="border border-dashed border-gray-300 rounded flex flex-col gap-2 p-2">
                <div
                  v-for="(drive, index) in form.drives"
                  :key="drive._key"
                  class="p-2 bg-gray-50 border border-gray-200 rounded flex items-center gap-2"
                >
                  <span
                    class="drag-handle flex-shrink-0 cursor-move text-gray-400 hover:text-gray-600 select-none"
                    title="拖动调整顺序"
                  >
                    <svg class="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                      <circle cx="9" cy="5" r="1.5" /><circle cx="15" cy="5" r="1.5" />
                      <circle cx="9" cy="12" r="1.5" /><circle cx="15" cy="12" r="1.5" />
                      <circle cx="9" cy="19" r="1.5" /><circle cx="15" cy="19" r="1.5" />
                    </svg>
                  </span>
                  <input
                    :ref="(el) => setDriveNameRef(drive._key, el)"
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
                <div v-if="form.drives.length === 0" class="flex items-center justify-center gap-2 py-1">
                  <p class="text-sm leading-snug italic text-gray-400">暂无网盘链接，点击上方按钮添加。</p>
                </div>
              </div>
            </div>

            <div class="mt-4 pt-4 border-t border-gray-200 flex justify-end space-x-2">
              <button
                v-if="editingId"
                @click="cancelEdit"
                class="px-3 py-1 bg-gray-200 hover:bg-gray-300 text-gray-700 border-none rounded transition-colors cursor-pointer text-sm"
              >
                取消
              </button>
              <button
                @click="submitForm"
                class="px-3 py-1 bg-blue-500 text-white border-none rounded hover:bg-blue-600 transition-colors cursor-pointer text-sm"
              >
                {{ editingId ? '保存' : '添加' }}
              </button>
            </div>
          </div>
        </div>

        <!-- 右侧：分享列表 -->
        <div class="w-full min-w-0">
          <div class="space-y-4">
            <div v-for="share in shares" :key="share.id" class="p-4 bg-white rounded shadow">
              <!-- 编辑模式 -->
              <div v-if="editingId === share.id" class="text-sm text-gray-500 text-center py-4 bg-gray-50 rounded">
                正在编辑该分享，请在左侧表单中修改后保存。
              </div>

              <!-- 显示模式 -->
              <div v-else @dblclick="startEdit(share)">
                <!-- 名称 + 时间 + id -->
                <div class="flex items-start justify-between gap-2">
                  <p class="m-0 font-semibold text-gray-900 truncate">{{ share.name }}</p>
                  <div class="flex items-center gap-2 flex-shrink-0">
                    <span class="text-xs text-gray-400">{{ formatDate(share.created_at) }}</span>
                    <code
                      class="px-2 py-0.5 text-xs bg-gray-100 text-gray-600 rounded whitespace-nowrap flex-shrink-0 cursor-pointer hover:bg-gray-200 transition-colors"
                      title="点击复制链接"
                      @click="copyLink(share)"
                    >#{{ share.id }}</code>
                  </div>
                </div>

                <!-- 描述 -->
                <p
                  v-if="share.description"
                  class="text-gray-900 whitespace-pre-line mt-1"
                  v-html="renderDescription(share.description)"
                ></p>

                <!-- 底部：网盘标签 + 操作按钮 -->
                <div class="flex flex-wrap items-center justify-between mt-2 gap-2">
                  <div class="flex flex-wrap gap-2 items-center flex-1"
                       :class="{ 'invisible': !(share.drives && share.drives.length) }">
                    <a
                      v-for="(drive, index) in share.drives"
                      :key="index"
                      :href="drive.url"
                      target="_blank"
                      rel="noopener noreferrer"
                      class="px-2 py-0.5 text-xs bg-blue-100 text-blue-600 rounded cursor-pointer no-underline hover:bg-blue-200 transition-colors"
                      :title="drive.url"
                    >
                      {{ drive.driveName }}<template v-if="drive.accessCode">（提取码：{{ drive.accessCode }}）</template>
                    </a>
                  </div>
                  <div class="flex items-center space-x-2">
                    <button
                      @click="removeShare(share)"
                      class="px-3 py-1 bg-red-500 text-white border-none rounded hover:bg-red-600 transition-colors cursor-pointer text-sm"
                      title="删除分享"
                    >
                      删除
                    </button>
                    <button
                      @click="startEdit(share)"
                      class="px-3 py-1 bg-blue-500 text-white border-none rounded hover:bg-blue-600 transition-colors cursor-pointer text-sm"
                      title="编辑分享"
                    >
                      编辑
                    </button>
                    <button
                      @click="copyLink(share)"
                      class="px-3 py-1 bg-green-500 text-white border-none rounded hover:bg-green-600 transition-colors cursor-pointer text-sm"
                      title="复制链接"
                    >
                      复制链接
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div v-if="shares.length === 0" class="text-gray-500 text-center py-10">
              暂无分享
            </div>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup>
import { onMounted, onBeforeUnmount, reactive, ref, computed, nextTick } from 'vue'
import Sortable from 'sortablejs'
import { useShares } from '@/composables/useShares'
import { siteConfig } from '@/site.config.js'
import { alert, confirm } from '@/composables/useModal'

const { shares, getShares, saveShare, deleteShare } = useShares()

const editingId = ref(null)
const form = reactive({
    name: '',
    description: '',
    drives: []
})

// 常用网盘预设，末尾为「自定义」
const CUSTOM_DRIVE = '自定义'
const DRIVE_PRESETS = ['123网盘', '阿里云盘', '夸克网盘']
const MAX_DRIVES = 10

function resetForm() {
    editingId.value = null
    form.name = ''
    form.description = ''
    form.drives = []
}

let driveKeySeed = 0

// 网盘名称输入框引用，用于自定义新增后自动聚焦
const driveNameRefs = new Map()
function setDriveNameRef(key, el) {
    if (el) driveNameRefs.set(key, el)
    else driveNameRefs.delete(key)
}

// 新增一行链接，传入名称；未传名称时聚焦名称输入框
async function addDrive(driveName = '') {
    if (form.drives.length >= MAX_DRIVES) return false
    const key = ++driveKeySeed
    form.drives.push({ _key: key, driveName, url: '', accessCode: '' })
    if (!driveName) {
        await nextTick()
        driveNameRefs.get(key)?.focus()
    }
    return true
}

function removeDrive(index) {
    form.drives.splice(index, 1)
}

// 预设按钮 = 历史用过的名称（最近使用的在前） + 常用网盘 + 自定义
const MAX_PRESETS = 20
const drivePresets = computed(() => {
    // 记录每个网盘名称最近一次被使用的时间
    const lastUsed = new Map()
    for (const share of shares.value) {
        const time = new Date(share.created_at || 0).getTime() || 0
        for (const drive of share.drives || []) {
            const name = drive.driveName
            if (!name || name === CUSTOM_DRIVE) continue
            if (!lastUsed.has(name) || lastUsed.get(name) < time) lastUsed.set(name, time)
        }
    }
    const used = [...lastUsed.entries()].sort((a, b) => b[1] - a[1]).map(([name]) => name)
    const names = [...new Set([...used, ...DRIVE_PRESETS])].slice(0, MAX_PRESETS)
    return [...names, CUSTOM_DRIVE]
})

// 拖动排序
const driveListRef = ref(null)
let sortableInstance = null

onMounted(() => {
    if (!driveListRef.value) return
    sortableInstance = Sortable.create(driveListRef.value, {
        animation: 200,
        handle: '.drag-handle',
        ghostClass: 'opacity-40',
        onEnd({ oldIndex, newIndex, item, from }) {
            // 先将 DOM 复原，再更新数组交给 Vue 重渲染，避免视图不同步
            from.insertBefore(item, from.children[oldIndex + (oldIndex < newIndex ? 0 : 1)] || null)
            if (oldIndex === newIndex) return
            const [moved] = form.drives.splice(oldIndex, 1)
            form.drives.splice(newIndex, 0, moved)
        }
    })
})

onBeforeUnmount(() => {
    sortableInstance?.destroy()
    sortableInstance = null
})

// 校验表单
async function validateForm() {
    if (!form.name) {
        await alert('请输入资源名称')
        return false
    }
    if (form.name.length > 200) {
        await alert('资源名称过长，最多 200 字')
        return false
    }
    if ((form.description || '').length > 500) {
        await alert('描述过长，最多 500 字')
        return false
    }
    for (let i = 0; i < form.drives.length; i++) {
        const drive = form.drives[i]
        if (!drive.driveName) {
            await alert(`第 ${i + 1} 个网盘未设置名称`)
            return false
        }
        if (!/^https?:\/\//.test(drive.url)) {
            await alert(`第 ${i + 1} 个网盘链接不正确，需以 http(s):// 开头`)
            return false
        }
    }
    return true
}

// 提交表单
const submitForm = async () => {
    if (!(await validateForm())) return

    const payload = {
        name: form.name,
        description: form.description || '',
        drives: form.drives
            .filter(d => d.driveName && d.url)
            .map(({ _key, ...drive }) => drive)
    }
    if (editingId.value) payload.id = editingId.value

    const res = await saveShare(payload)
    if (res && res.success) {
        resetForm()
        await loadShares()
        await alert(res.message || '保存成功！')
    }
}

// 开始编辑
const startEdit = (share) => {
    editingId.value = share.id
    form.name = share.name || ''
    form.description = share.description || ''
    form.drives = (share.drives || []).map(d => ({
        _key: ++driveKeySeed,
        driveName: d.driveName || '',
        url: d.url || '',
        accessCode: d.accessCode || ''
    }))
    window.scrollTo({ top: 0, behavior: 'smooth' })
}

// 取消编辑
const cancelEdit = () => {
    resetForm()
}

// 删除分享
const removeShare = async (share) => {
    const confirmed = await confirm(`确定删除分享「${share.name}」(#${share.id}) 吗？`)
    if (!confirmed) return
    const res = await deleteShare(share.id)
    if (res && res.success) {
        if (editingId.value === share.id) resetForm()
        await loadShares()
        await alert('删除成功！')
    }
}

// 复制分享链接
const copyLink = async (share) => {
    const link = `${siteConfig.apiUrl}/api/shares?id=${share.id}&type=redirect`
    try {
        if (navigator.clipboard && window.isSecureContext) {
            await navigator.clipboard.writeText(link)
        } else {
            const input = document.createElement('textarea')
            input.value = link
            input.style.position = 'fixed'
            input.style.opacity = '0'
            document.body.appendChild(input)
            input.select()
            document.execCommand('copy')
            document.body.removeChild(input)
        }
        await alert(`链接已复制：\n${link}`)
    } catch (err) {
        await alert(`复制失败，请手动复制：\n${link}`)
    }
}

// 加载列表
const loadShares = async () => {
    await getShares()
}

onMounted(loadShares)

// 格式化日期
const formatDate = (date) => {
    if (!date) return ''
    return new Date(date).toLocaleString()
}

// 转义 HTML 防止 XSS
function escapeHtml(str) {
    return String(str).replace(/[&<>"']/g, (m) => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
    })[m])
}

// 渲染描述：纯文本 + 裸链接自动转成可点击链接
const URL_REG = /https?:\/\/[^\s<>"'，。；：！？、）】》』」…]+/g
function renderDescription(text) {
    return escapeHtml(text || '').replace(URL_REG, (match) => {
        // 去掉链接末尾的标点，避免把句号、括号吞进 href
        const url = match.replace(/[.,;:!?)\]}'"’”]+$/, '')
        if (!url) return match
        const suffix = match.slice(url.length)
        return `<a href="${url}" target="_blank" rel="noopener noreferrer" class="text-blue-600 underline break-all hover:text-blue-700">${url}</a>${suffix}`
    })
}
</script>

<style scoped>
.sortable-ghost {
    opacity: 0.4;
}
</style>
