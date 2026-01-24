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
    <div v-show="activeTab === 'account'" class="space-y-3">
      <div class="p-3 rounded shadow">
        <h2 class="text-lg font-bold mb-4">Token 管理</h2>

        <!-- 创建 Token 表单 -->
        <div class="mb-4 pb-4 border-b border-gray-200">
          <h3 class="text-sm font-medium text-gray-700 mb-3">创建新 Token</h3>
          <input
            v-model="newToken.name"
            type="text"
            placeholder="Token 名称"
            class="w-full p-2 box-border border rounded mb-2"
          />
          <select
            v-model="newToken.expiresIn"
            class="w-full p-2 box-border border rounded mb-2"
          >
            <option :value="86400000">24 小时</option>
            <option :value="604800000">7 天</option>
            <option :value="2592000000">30 天</option>
            <option :value="7776000000">90 天</option>
            <option :value="15552000000">180 天</option>
            <option :value="31536000000">1 年</option>
            <option :value="315360000000">10 年</option>
          </select>
          <input
            v-model="newToken.description"
            type="text"
            placeholder="Token 描述（可选）"
            class="w-full p-2 box-border border rounded mb-2"
          />
          <button
            @click="handleCreateToken"
            class="px-4 py-2 bg-blue-600 text-white rounded border-none hover:bg-blue-700 transition-colors cursor-pointer"
          >
            创建 Token
          </button>
        </div>

        <!-- Token 列表 -->
        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead>
              <tr class="border-b border-gray-200">
                <th class="text-left py-2 px-2 font-medium">名称</th>
                <th class="text-left py-2 px-2 font-medium">描述</th>
                <th class="text-left py-2 px-2 font-medium">创建时间</th>
                <th class="text-left py-2 px-2 font-medium">过期时间</th>
                <th class="text-left py-2 px-2 font-medium">状态</th>
                <th class="text-left py-2 px-2 font-medium">操作</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="tokens.length === 0">
                <td colspan="6" class="text-center py-8 text-gray-500">暂无 Token</td>
              </tr>
              <tr v-for="token in tokens" :key="token.id" class="border-b border-gray-100 hover:bg-gray-50">
                <td class="py-2 px-2">{{ token.name || '-' }}</td>
                <td class="py-2 px-2">{{ token.description || '-' }}</td>
                <td class="py-2 px-2">{{ formatDate(token.createdAt) }}</td>
                <td class="py-2 px-2">{{ token.expiresAt ? formatDate(token.expiresAt) : '永不过期' }}</td>
                <td class="py-2 px-2">
                  <span
                    :class="getRemainingTime(token.expiresAt).isExpired ? 'text-red-500' : 'text-green-500'"
                    class="text-xs"
                  >
                    {{ getRemainingTime(token.expiresAt).text }}
                  </span>
                </td>
                <td class="py-2 px-2">
                  <button
                    @click="handleDeleteToken(token)"
                    class="px-2 py-1 bg-red-500 text-white rounded text-xs hover:bg-red-600 transition-colors cursor-pointer border-none"
                  >
                    删除
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div class="p-3 rounded shadow">
        <h2 class="text-lg font-bold mb-4">账号操作</h2>

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

const { updateAccount, getTokensList, createToken, deleteToken } = useSettings()
const { removeToken, removeTokenExpires } = useToken()

// 当前激活的标签页
const activeTab = ref('account')

// 标签页配置
const tabs = [
  {
    id: 'account',
    label: '账号管理'
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

  const confirmUsername = await prompt('', '', '确认用户名', '请再次输入新用户名')
  if (confirmUsername === null || !confirmUsername.trim()) return

  if (newUsername.trim() !== confirmUsername.trim()) {
    await alert('两次输入的用户名不一致')
    return
  }

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

  const result = await deleteToken(token.id)
  if (result.success) {
    await alert(result.message || 'Token 删除成功')
    await loadTokens()
  } else {
    await alert(result.error || '删除 Token 失败')
  }
}

// 计算剩余时间
const getRemainingTime = (expiresAt) => {
  if (!expiresAt) {
    return { isExpired: false, text: '永不过期' }
  }

  const now = Date.now()
  const expiresTime = new Date(expiresAt).getTime()
  const remainingMs = expiresTime - now

  if (remainingMs <= 0) {
    return { isExpired: true, text: '已过期' }
  }

  const days = Math.floor(remainingMs / (1000 * 60 * 60 * 24))
  const hours = Math.floor((remainingMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
  const minutes = Math.floor((remainingMs % (1000 * 60 * 60)) / (1000 * 60))

  if (days > 0) {
    return { isExpired: false, text: `剩余 ${days}天${hours}小时` }
  } else if (hours > 0) {
    return { isExpired: false, text: `剩余 ${hours}小时${minutes}分钟` }
  } else {
    return { isExpired: false, text: `剩余 ${minutes}分钟` }
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
