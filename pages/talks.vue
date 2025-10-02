<template>
  <div class="flex">
    <main class="p-8 flex-1">
      <h1 class="text-2xl font-bold mb-6">说说管理</h1>
      <div class="w-full max-w-3xl">
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
              <p class="text-gray-900 dark:text-gray-100">{{ talk.content }}</p>
              <div class="flex items-center justify-between mt-2 text-sm text-gray-500 dark:text-gray-400">
                <span>{{ formatDate(talk.created_at) }}</span>
                <div class="flex space-x-2">
                  <button
                    @click="startEdit(talk)"
                    class="text-blue-500 hover:text-blue-700 text-sm"
                  >
                    编辑
                  </button>
                  <button
                    @click="removeTalk(talk.id)"
                    class="text-red-500 hover:text-red-700 text-sm"
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

// 获取列表
const loadTalks = async () => {
  await getTalks({ page: 1, pageSize: 20 })
}

// 添加新说说
const addNewTalk = async () => {
  if (!newContent.value.trim()) return alert('内容不能为空')
  const res = await addTalk({ content: newContent.value })
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
  editingContent.value = talk.content
}

// 取消编辑
const cancelEdit = () => {
  editingId.value = null
  editingContent.value = ''
}

// 保存编辑
const saveEdit = async (id) => {
  if (!editingContent.value.trim()) return alert('内容不能为空')
  const res = await editTalk({ id, content: editingContent.value })
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
</script>