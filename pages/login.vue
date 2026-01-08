<template>
  <div class="min-h-screen bg-gray-50 flex items-center justify-center select-none">
    <div class="bg-white rounded-lg shadow-lg p-8 w-full max-w-md">
      <div class="text-center mb-8">
        <h1 class="text-xl font-bold">后台登录</h1>
      </div>

      <form @submit.prevent="handleSubmit" class="space-y-4">
        <div class="flex items-center">
          <label for="username" class="text-sm font-medium text-gray-700 shrink-0">
            用户名：
          </label>
          <input
            id="username"
            v-model="username"
            required
            autocomplete="username"
            class="flex-1 p-2 box-border border rounded"
            placeholder="请输入用户名"
            :disabled="loading"
          />
        </div>

        <div class="flex items-center">
          <label for="password" class="text-sm font-medium text-gray-700 shrink-0">
            密　码：
          </label>
          <input
            id="password"
            v-model="password"
            type="password"
            required
            autocomplete="current-password"
            class="flex-1 p-2 box-border border rounded"
            placeholder="请输入密码"
            :disabled="loading"
          />
        </div>

        <div v-if="turnstileSiteKey" class="flex justify-center">
          <div ref="turnstileRef" id="turnstile-widget"></div>
        </div>

        <div class="flex items-center">
          <input
            id="rememberMe"
            v-model="rememberMe"
            type="checkbox"
            class="h-4 w-4 mr-1 text-blue-600 focus:ring-blue-500 border-gray-300 rounded cursor-pointer"
            :disabled="loading"
          />
          <label for="rememberMe" class="block text-sm text-gray-700 cursor-pointer leading-4">
            记住账号
          </label>
        </div>

        <div v-if="errorMessage" class="bg-red-50 border border-red-200 rounded-md p-3">
          <p class="text-sm text-red-600">{{ errorMessage }}</p>
        </div>

        <button
          type="submit"
          :disabled="loading || (turnstileSiteKey && !hasValidToken())"
          class="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <span v-if="loading" class="flex items-center">
            <svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            登录中...
          </span>
          <span v-else>登录</span>
        </button>

        <div class="text-xs text-gray-500 space-y-1">
          <p>1. 使用首次登录的账号自动注册</p>
          <p>2. 若忘记密码请删除数据库admin表后重新登录</p>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick } from 'vue'
import { siteConfig } from '@/site.config.js'
import { useTurnstile } from '~/composables/useTurnstile'

const API_BASE = siteConfig.apiUrl
const TOKEN_NAME = 'auth_token'

const username = ref('')
const password = ref('')
const loading = ref(false)
const errorMessage = ref('')
const rememberMe = ref(true)
const turnstileRef = ref(null)

const {
  renderTurnstile,
  getTurnstileToken,
  hasValidToken,
  waitForTurnstileLoad,
  turnstileSiteKey
} = useTurnstile()

async function handleSubmit() {
  if (!username.value.trim() || !password.value.trim()) {
    errorMessage.value = '用户名和密码不能为空'
    return
  }

  if (turnstileSiteKey && !hasValidToken()) {
    errorMessage.value = '请完成人机验证'
    return
  }

  loading.value = true
  errorMessage.value = ''

  try {
    const requestBody = {
      username: username.value.trim(),
      password: password.value.trim()
    }

    if (turnstileSiteKey) {
      const token = getTurnstileToken()
      console.log('Turnstile Token:', token ? `${token.substring(0, 20)}...` : 'null')
      if (!token) {
        errorMessage.value = '人机验证未完成，请稍后重试'
        loading.value = false
        return
      }
      requestBody.turnstileToken = token
    }

    const res = await fetch(`${API_BASE}/api/system/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody)
    })

    const data = await res.json()

    if (!res.ok) {
      throw new Error(data.error || '登录失败')
    }

    // 存储Token
    if (rememberMe.value) {
      localStorage.setItem(TOKEN_NAME, data.token)
      localStorage.setItem('token_expires', String(Date.now() + data.expiresIn))
    } else {
      sessionStorage.setItem(TOKEN_NAME, data.token)
      sessionStorage.setItem('token_expires', String(Date.now() + data.expiresIn))
    }

    const verified = useCookie('admin_verified', { path: '/' })
    verified.value = 'true'
    window.location.href = '/'
  } catch (err) {
    console.error(err)
    errorMessage.value = err.message || '网络连接错误，请检查网络后重试'
  }

  loading.value = false
}

onMounted(async () => {
  const cachedToken = localStorage.getItem(TOKEN_NAME)
  if (cachedToken) {
    const expires = Number(localStorage.getItem('token_expires'))
    if (expires > Date.now()) {
      const verified = useCookie('admin_verified', { path: '/' })
      verified.value = 'true'
      window.location.href = '/'
    } else {
      localStorage.removeItem(TOKEN_NAME)
      localStorage.removeItem('token_expires')
    }
    rememberMe.value = true
  } else {
    rememberMe.value = false
  }

  if (turnstileSiteKey && turnstileRef.value) {
    try {
      await waitForTurnstileLoad()
      await nextTick()
      renderTurnstile(turnstileRef.value)
    } catch (error) {
      console.error('Failed to load Turnstile:', error)
      errorMessage.value = '人机验证加载失败，请刷新页面重试'
    }
  }
})
</script>