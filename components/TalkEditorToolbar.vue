<template>
  <div class="flex justify-between mt-2">
    <div class="mt-1 relative">
      <!-- 标签 -->
      <button
        @click.stop="$emit('toggleDropdown', 'tag', target)"
        :class="[
          'border-none bg-transparent cursor-pointer transition-colors',
          activeDropdown.type === 'tag' ? 'text-blue-500' : 'text-gray-500 hover:text-blue-500'
        ]"
        title="插入标签"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="4" x2="20" y1="9" y2="9"></line><line x1="4" x2="20" y1="15" y2="15"></line><line x1="10" x2="8" y1="3" y2="21"></line><line x1="16" x2="14" y1="3" y2="21"></line></svg>
      </button>
      <transition name="fade-slide">
        <div v-if="activeDropdown.type === 'tag'" class="dropdown absolute mt-1 p-2 bg-gray-100 rounded shadow z-50 max-w-xs">
          <span
            v-for="tag in tags"
            :key="tag"
            @click="$emit('insertTag', tag)"
            class="mx-1 text-sm text-blue-500 hover:text-blue-800 rounded cursor-pointer transition-colors"
          >
            #{{ tag }}
          </span>
        </div>
      </transition>

      <!-- Markdown -->
      <button
        @click.stop="$emit('toggleDropdown', 'markdown', target)"
        :class="[
          'border-none bg-transparent cursor-pointer transition-colors',
          activeDropdown.type === 'markdown' ? 'text-blue-500' : 'text-gray-500 hover:text-blue-500'
        ]"
        title="Markdown"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="3" rx="2"></rect><line x1="9" x2="15" y1="15" y2="9"></line></svg>
      </button>
      <transition name="fade-slide">
        <div v-if="activeDropdown.type === 'markdown'" class="dropdown absolute mt-1 p-2 bg-gray-100 rounded shadow z-50 max-w-xs">
          <span
            v-for="item in mdOptions"
            :key="item.label"
            @click="$emit('insertMd', item.syntax)"
            class="mx-1 text-sm text-blue-500 hover:text-blue-800 rounded cursor-pointer transition-colors"
          >
            {{ item.label }}
          </span>
        </div>
      </transition>

      <!-- 位置 -->
      <button
        @click.stop="$emit('toggleDropdown', 'location', target)"
        :class="[
          'border-none bg-transparent cursor-pointer transition-colors',
          activeDropdown.type === 'location' ? 'text-blue-500' : 'text-gray-500 hover:text-blue-500'
        ]"
        title="插入位置"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="shrink-0"><path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0"></path><circle cx="12" cy="10" r="3"></circle></svg>
      </button>
      <transition name="fade-slide">
        <div v-if="activeDropdown.type === 'location'" class="dropdown absolute mt-1 p-2 bg-gray-100 rounded shadow z-50 max-w-xs">
          <div class="flex w-64">
            <input
              :value="locationInput"
              @input="$emit('update:locationInput', $event.target.value)"
              placeholder="请输入位置..."
              class="flex-1 px-3 py-2 border border-gray-300 rounded-l-md outline-none"
              @keydown.enter.prevent="$emit('insertLocation', target)"
            />
            <button
              @click="$emit('insertLocation', target)"
              class="px-3 py-2 bg-blue-500 text-white rounded-r-md hover:bg-blue-600 border-none transition-colors"
            >
              插入
            </button>
          </div>
        </div>
      </transition>

      <!-- 图片 -->
      <button
        @click="$emit('uploadImage')"
        class="border-none bg-transparent text-gray-500 hover:text-blue-500 cursor-pointer transition-colors"
        title="插入图片"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><path d="M21 15l-5-5L5 21"></path></svg>
      </button>

      <!-- AI 润色 -->
      <button
        @click="$emit('aiPolish', target)"
        :disabled="aiLoading"
        :class="[
          'border-none bg-transparent cursor-pointer transition-colors',
          'text-gray-500 hover:text-blue-500',
          aiLoading ? 'opacity-50 cursor-not-allowed' : ''
        ]"
        :title="aiLoading ? '润色中...' : 'AI润色'"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"></path></svg>
      </button>
    </div>
    <slot></slot>
  </div>
</template>

<script setup>
defineProps({
  target: { type: String, required: true },
  activeDropdown: { type: Object, default: () => ({ type: null }) },
  tags: { type: Array, default: () => [] },
  locationInput: { type: String, default: '' },
  aiLoading: { type: Boolean, default: false }
})

defineEmits(['toggleDropdown', 'insertTag', 'insertMd', 'insertLocation', 'update:locationInput', 'uploadImage', 'aiPolish'])

const mdOptions = [
  { label: '加粗', syntax: '**加粗内容**' },
  { label: '斜体', syntax: '*斜体内容*' },
  { label: '链接', syntax: '[链接文字](https://)' },
  { label: '图片', syntax: '![图片描述](https://)' },
  { label: '代码', syntax: '```\n代码块\n```' },
  { label: '任务列表', syntax: '- [ ] 未完成\n- [x] 已完成' },
]
</script>

<style scoped>
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
