<template>
  <div class="fixed inset-0 z-50 bg-white dark:bg-black flex items-center justify-center">
    <p>输入访问验证密钥后才能继续访问......</p>
  </div>
</template>

<script setup>
import { onMounted } from 'vue'
import { siteConfig } from '@/site.config.js'

const API_BASE = siteConfig.apiUrl
const KEY_NAME = 'api_key'

async function verifyKey() {
  let apiKey = localStorage.getItem(KEY_NAME)

  async function checkKey(key) {
    try {
      const res = await fetch(`${API_BASE}/api/article/edit`, {
        method: 'PUT',
        headers: { 'x-api-key': key, 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug: 'zhadwengwadswdqeixin01asdwqq01@oaasdwutlooawdwak.coawdm-awdzsxiawdlovawdeyou-zhenafreggweiawfdqxinawd.tawdwoqp' })
      })
      if (res.status === 401) return false
      if (res.status === 404) return true
      if (res.status === 429) {
        alert('错误次数过多，IP 已封禁')
        return false
      }
      return true
    } catch (err) {
      console.error(err)
      return false
    }
  }

  if (!apiKey) {
    apiKey = prompt('请输入后台访问密钥：') || ''
    if (!apiKey) {
      alert('必须输入密钥才能访问后台')
      return
    }
    const ok = await checkKey(apiKey)
    if (!ok) {
      alert('密钥错误，请刷新重试')
      return
    }
    localStorage.setItem(KEY_NAME, apiKey)
  } else {
    const ok = await checkKey(apiKey)
    if (!ok) {
      alert('缓存的密钥已失效，请重新输入')
      localStorage.removeItem(KEY_NAME)
      return
    }
  }

  const verified = useCookie('admin_verified', { path: '/' })
  verified.value = 'true'
  navigateTo('/')
}

onMounted(() => {
  verifyKey()
})
</script>