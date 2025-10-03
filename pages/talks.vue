<template>
  <div class="flex">
    <main class="p-8 flex-1">
      <h1 class="text-2xl font-bold mb-6">说说管理</h1>
      <div class="w-full max-w-3xl mx-auto">
        <!-- 添加说说区域 -->
        <div class="mb-6 p-3 rounded shadow">
          <textarea
            v-model="newContent"
            placeholder="此刻的想法..."
            class="w-full my-1 text-base rounded border-none text-gray-900 resize-none focus:outline-none overflow-hidden"
            @input="autoResize"
          ></textarea>
          <div class="w-full border border-dashed border-gray-300"></div>
          <div class="flex justify-end mt-2">
            <button
              @click="addNewTalk"
              class="px-3 py-1 bg-blue-500 text-white border-none rounded hover:bg-blue-600 transition-colors duration-300"
            >
              保存
            </button>
          </div>
        </div>

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
                class="w-full min-h-100px my-1 text-base rounded border-none text-gray-900 resize-none focus:outline-none"
                @input="autoResize"
              ></textarea>
              <div class="w-full border border-dashed border-gray-300"></div>
              <div class="flex justify-end mt-2 space-x-2">
                <button
                  @click="saveEdit(talk.id)"
                  class="px-3 py-1 bg-blue-500 text-white border-none rounded hover:bg-blue-600 transition-colors duration-300"
                >
                  保存
                </button>
                <button
                  @click="cancelEdit"
                  class="px-3 py-1 bg-gray-300 text-gray-800 border-none rounded hover:bg-gray-400 transition-colors duration-300"
                >
                  取消
                </button>
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
              <div
                v-if="(talk.tags && talk.tags.length > 0) || (talk.links && talk.links.length > 0) || true"
                class="flex flex-wrap items-center justify-between mt-2 gap-2"
              >
                <div class="flex flex-wrap gap-2">
                  <span
                    v-for="tag in talk.tags"
                    :key="tag"
                    class="px-2 py-0.5 text-xs bg-blue-100 text-blue-600 rounded cursor-pointer"
                  >
                    #{{ tag }}
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
                <div class="flex space-x-2 mt-1 md:mt-0">
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
        </div>
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useTalks } from '@/composables/useTalks'

import { Fancybox } from '@fancyapps/ui'
import '@fancyapps/ui/dist/fancybox/fancybox.css'

const { talks, getTalks, addTalk, editTalk, deleteTalk } = useTalks()
const newContent = ref('')
const editingId = ref(null)
const editingContent = ref('')

// 自动高度调整
const autoResize = (event) => {
  const el = event.target
  el.style.height = 'auto'
  el.style.height = el.scrollHeight + 'px'
}

// 解析标签和 Markdown 链接
function parseContent(text) {
  const tagRegex = /#([\u4e00-\u9fa5\w-]+)/g
  const linkRegex = /(?<!\!)\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g
  const imgRegex = /!\[([^\]]*)\]\((https?:\/\/[^\s)]+)\)/g

  // 标签
  const tags = []
  let match
  while ((match = tagRegex.exec(text))) {
    tags.push(match[1])
  }

  // 链接去重
  const linksMap = new Map()
  let contentWithPlaceholders = text
  while ((match = linkRegex.exec(text))) {
    const [full, linkText, url] = match
    const key = `${linkText}|${url}`
    if (!linksMap.has(key)) {
      linksMap.set(key, { text: linkText, url })
    }
    contentWithPlaceholders = contentWithPlaceholders.replace(full, `<talkLink>${linkText}</talkLink>`)
  }
  const links = Array.from(linksMap.values())

  // 图片去重
  const imgsMap = new Map()
  while ((match = imgRegex.exec(text))) {
    const [full, alt, url] = match
    if (!imgsMap.has(url)) {
      imgsMap.set(url, { alt, url })
    }
    contentWithPlaceholders = contentWithPlaceholders.replace(full, `<talkImg>${alt}</talkImg>`)
  }
  const imgs = Array.from(imgsMap.values())

  const pureContent = contentWithPlaceholders.replace(tagRegex, '').trim()
  return { pureContent, tags, links, imgs }
}

// 编辑模式还原 Markdown
function restoreLinksForEdit(content, links) {
  if (!links || links.length === 0) return content
  let restored = content
  links.forEach(link => {
    const placeholder = new RegExp(`<talkLink>${escapeReg(link.text)}</talkLink>`, 'g')
    restored = restored.replace(placeholder, `[${link.text}](${link.url})`)
  })
  return restored
}

function restoreImgsForEdit(content, imgs) {
  if (!imgs || imgs.length === 0) return content
  let restored = content
  imgs.forEach(img => {
    const placeholder = new RegExp(`<talkImg>${escapeReg(img.alt)}</talkImg>`, 'g')
    restored = restored.replace(placeholder, `![${img.alt}](${img.url})`)
  })
  return restored
}

// 正则安全转义
function escapeReg(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

// 渲染内容
function renderContent(talk) {
  let html = talk.content

  // 移除 <talkImg> 标签 和 <talkLink> 标签
  html = html.replace(/\n*<talkImg>.*?<\/talkImg>/g, '')
  html = html.replace(/\n*<talkLink>.*?<\/talkLink>/g, '')
    
  // 处理任务列表
  html = html.replace(/- \[( |x)\] (.+)/g, (_, status, task) => {
    const checked = status === 'x' ? 'checked' : ''
    return `<label><input type="checkbox" disabled ${checked} /><span>${task}</span></label>`
  })

  // 处理代码块
  html = html.replace(/```(\w*)\n([\s\S]*?)```/g, (_, lang, code) => {
    const languageClass = lang ? `language-${lang}` : ''
    return `<pre class="bg-gray-100 dark:bg-gray-700 p-2 rounded overflow-auto"><code class="${languageClass}">${escapeHtml(code)}</code></pre>`
  })

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

// 获取列表
const loadTalks = async () => {
  await getTalks({ page: 1, pageSize: 20 })
}

// 添加新说说
const addNewTalk = async () => {
  if (!newContent.value.trim()) return alert('内容不能为空')

  const { pureContent, tags, links, imgs } = parseContent(newContent.value)
  const res = await addTalk({ content: pureContent, tags, links, imgs })
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
  const contentWithTags = talk.tags && talk.tags.length > 0
    ? '\n' + talk.tags.map(t => `#${t}`).join(' ')
    : ''
  editingContent.value = restoreLinksForEdit(talk.content + contentWithTags, talk.links)
  editingContent.value = restoreImgsForEdit(editingContent.value, talk.imgs)
}

// 取消编辑
const cancelEdit = () => {
  editingId.value = null
  editingContent.value = ''
}

// 保存编辑
const saveEdit = async (id) => {
  if (!editingContent.value.trim()) return alert('内容不能为空')

  const { pureContent, tags, links, imgs } = parseContent(editingContent.value)
  const res = await editTalk({ id, content: pureContent, tags, links, imgs })
  if (res && res.success) {
    editingId.value = null
    editingContent.value = ''
    await loadTalks()
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
</script>