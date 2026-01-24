<template>
  <div class="p-8">
    <h1 class="text-2xl font-bold mb-6">系统设置</h1>

    <!-- 顶栏切换 -->
    <div class="mb-4 flex gap-2">
      <button
        v-for="tab in tabs"
        :key="tab.id"
        @click="activeTab = tab.id"
        :class="activeTab === tab.id ? 'bg-blue-600 text-white' : 'bg-gray-200 hover:bg-gray-300 transition-colors'"
        class="px-4 py-2 rounded border-none cursor-pointer"
      >
        {{ tab.label }}
      </button>
    </div>

    <!-- 账号管理板块 -->
    <div v-show="activeTab === 'user'" class="p-3 rounded shadow">
      <h2 class="text-lg font-bold mb-4">账号密码</h2>

      <div class="flex gap-3">
        <!-- 修改用户名 -->
        <button
          @click="handleUpdateUsername"
          class="px-4 py-2 bg-blue-600 text-white rounded border-none hover:bg-blue-700 transition-colors cursor-pointer"
        >
          修改用户名
        </button>

        <!-- 修改密码 -->
        <button
          @click="handleUpdatePassword"
          class="px-4 py-2 bg-blue-600 text-white rounded border-none hover:bg-blue-700 transition-colors cursor-pointer"
        >
          修改密码
        </button>

        <!-- 退出登录 -->
        <button
          @click="handleLogout"
          class="px-4 py-2 bg-red-500 text-white rounded border-none hover:bg-red-600 transition-colors cursor-pointer"
        >
          退出登录
        </button>
      </div>
    </div>

    <!-- 预留其他配置部分 -->
    <div v-show="activeTab === 'other'" class="p-3 rounded shadow">
      <h2 class="text-lg font-bold mb-4">其他配置</h2>
      <div class="text-gray-500 text-sm">开发中...</div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useSettings } from '~/composables/useSettings.js'
import { alert, confirm, prompt } from '@/composables/useModal'
import { useToken } from '~/composables/useToken.js'

const { updateAccount, getTokensList, createToken, revokeToken } = useSettings()
const { removeToken, removeTokenExpires } = useToken()

// 当前激活的标签页
const activeTab = ref('user')

// 标签页配置
const tabs = [
  {
    id: 'user',
    label: '账号管理'
  },
  {
    id: 'token',
    label: 'Token 管理'
  },
  {
    id: 'other',
    label: '其他配置'
  }
]

// Token 相关数据
const tokens = ref([])
const newToken = ref({
  name: '',
  description: '',
  expiresIn: 86400000
})

// 加载 Token 列表
const loadTokens = async () => {
  const result = await getTokensList()
  if (result.success) {
    tokens.value = result.data || []
  } else {
    await alert(result.error || '获取 Token 列表失败')
  }
}

onMounted(() => {
  loadTokens()
})

// 修改用户名
const handleUpdateUsername = async () => {
  const newUsername = await prompt('', '', '修改用户名', '请输入新用户名')
  if (newUsername === null || !newUsername.trim()) return

  const currentPassword = await prompt('', '', '验证身份', '请输入当前密码以验证身份', true)
  if (currentPassword === null || !currentPassword) return

  const result = await updateAccount({
    username: newUsername.trim(),
    currentPassword: currentPassword
  })

  if (result?.success) {
    await alert('用户名修改成功！')
  } else {
    await alert(result?.error || '修改用户名失败')
  }
}

// 修改密码
const handleUpdatePassword = async () => {
  const newPassword = await prompt('', '', '修改密码', '请输入新密码', true)
  if (newPassword === null || !newPassword) return

  if (newPassword.length < 6) {
    await alert('密码长度不能少于 6 位')
    return
  }

  const confirmNewPassword = await prompt('', '', '确认密码', '请再次输入新密码', true)
  if (confirmNewPassword === null || !confirmNewPassword) return

  if (newPassword !== confirmNewPassword) {
    await alert('两次输入的密码不一致')
    return
  }

  const currentPassword = await prompt('', '', '验证身份', '请输入当前密码以验证身份', true)
  if (currentPassword === null || !currentPassword) return

  const result = await updateAccount({
    password: newPassword,
    currentPassword: currentPassword
  })

  if (result?.success) {
    await alert('密码修改成功！')
  } else {
    await alert(result?.error || '修改密码失败')
  }
}

// 创建 Token
const handleCreateToken = async () => {
  if (!newToken.value.name.trim()) {
    await alert('请输入 Token 名称')
    return
  }

  const result = await createToken({
    name: newToken.value.name.trim(),
    description: newToken.value.description.trim(),
    expiresIn: newToken.value.expiresIn
  })

  if (result.success) {
    await alert(`Token 创建成功！\n\n${result.data.token}`)
    newToken.value = { name: '', description: '', expiresIn: 86400000 }
    loadTokens()
  } else {
    await alert(result.error || '创建 Token 失败')
  }
}

// 删除 Token
const handleDeleteToken = async (token) => {
  const confirmed = await confirm(`确定要删除 Token "${token.name || token.id}" 吗？`)
  if (!confirmed) return

  const result = await revokeToken(token.id)
  if (result.success) {
    await alert(result.message || 'Token 删除成功')
    loadTokens()
  } else {
    await alert(result.error || '删除 Token 失败')
  }
}

// 格式化日期
const formatDate = (dateString) => {
  if (!dateString) return '-'
  const date = new Date(dateString)
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

// 退出登录
const handleLogout = async () => {
  const confirmed = await confirm('确定要退出登录吗？')
  if (!confirmed) return

  removeToken()
  removeTokenExpires()
  window.location.href = '/login'
}
</script>
