<template>
  <div class="min-h-screen bg-gray-50 flex items-center justify-center">
    <div class="bg-white rounded-lg shadow-lg p-8 w-full max-w-md">
      <div class="text-center mb-8">
        <h1 class="text-xl font-bold">后台访问验证</h1>
      </div>
      
      <form @submit.prevent="handleSubmit" class="space-y-6">
        <div>
          <label for="apiKey" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            请输入访问密钥以继续：
          </label>
          <input
            id="apiKey"
            v-model="apiKeyInput"
            required
            autocomplete="current-password"
            class="w-full p-2 box-border border rounded"
            placeholder="请输入您的访问密钥"
            :disabled="loading"
          />
        </div>
        
        <div v-if="errorMessage" class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-3">
          <p class="text-sm text-red-600 dark:text-red-400">{{ errorMessage }}</p>
        </div>
        
        <button
          type="submit"
          :disabled="loading"
          class="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <span v-if="loading" class="flex items-center">
            <svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            验证中...
          </span>
          <span v-else>验证并进入后台</span>
        </button>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { siteConfig } from '@/site.config.js'

const API_BASE = siteConfig.apiUrl
const KEY_NAME = 'api_key'

const apiKeyInput = ref('')
const loading = ref(false)
const errorMessage = ref('')

async function checkKey(key) {
  try {
    const res = await fetch(`${API_BASE}/api/article/edit`, {
      method: 'PUT',
      headers: { 'x-api-key': key, 'Content-Type': 'application/json' },
      body: JSON.stringify({ slug: 'U2FsdGVkX18hAHT7Y5p3rPyFRrDnpH4VVTixbEhXLqw=' })
    })
    if (res.status === 401) return false
    if (res.status === 404) return true
    if (res.status === 429) {
      errorMessage.value = '错误次数过多，IP已封禁十年！'
      return false
    }
    return true
  } catch (err) {
    console.error(err)
    errorMessage.value = '网络连接错误，请检查网络后重试'
    return false
  }
}

async function handleSubmit() {
  if (!apiKeyInput.value.trim()) {
    errorMessage.value = '请输入访问密钥'
    return
  }

  loading.value = true
  errorMessage.value = ''

  const ok = await checkKey(apiKeyInput.value.trim())
  
  if (ok) {
    localStorage.setItem(KEY_NAME, apiKeyInput.value.trim())
    const verified = useCookie('admin_verified', { path: '/' })
    verified.value = 'true'
    navigateTo('/')
  } else if (!errorMessage.value) {
    errorMessage.value = '密钥错误，请检查后重试'
  }
  
  loading.value = false
}

// 检查是否有缓存的密钥
onMounted(() => {
  const cachedKey = localStorage.getItem(KEY_NAME)
  if (cachedKey) {
    apiKeyInput.value = cachedKey
  }
})
</script>