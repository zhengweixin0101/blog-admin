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
          <form id="tokenForm" class="space-y-3">
            <input v-model="newToken.name" id="tokenName" type="text" placeholder="Token 名称" class="w-full p-2 box-border border rounded" />
            <select v-model="newToken.expiresIn" id="tokenExpires" class="w-full p-2 box-border border rounded">
              <option :value="86400000">24 小时</option>
              <option :value="604800000">7 天</option>
              <option :value="2592000000">30 天</option>
              <option :value="7776000000">90 天</option>
              <option :value="15552000000">180 天</option>
              <option :value="31536000000">1 年</option>
              <option :value="315360000000">10 年</option>
            </select>
            <input v-model="newToken.description" id="tokenDescription" type="text" placeholder="Token 描述（可选）" class="w-full p-2 box-border border rounded" />
            <button
              @click="handleCreateToken"
              class="px-4 py-2 bg-blue-600 text-white rounded border-none hover:bg-blue-700 transition-colors cursor-pointer"
            >
              创建 Token
            </button>
          </form>
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

    <!-- S3 存储配置板块 -->
    <div v-show="activeTab === 'storage'" class="space-y-3">
      <div class="p-3 rounded shadow">
        <h2 class="text-lg font-bold mb-4">S3 配置</h2>

        <div>
          <form id="s3Config" class="space-y-3">
            <input
              v-model="s3Config.bucket"
              id="bucket"
              placeholder="Bucket"
              :disabled="!isEditingS3"
              :class="!isEditingS3 ? 'bg-gray-100 cursor-not-allowed' : ''"
              class="w-full p-2 box-border border rounded"
            />
            <input
              v-model="s3Config.endpoint"
              id="endpoint"
              placeholder="Endpoint"
              :disabled="!isEditingS3"
              :class="!isEditingS3 ? 'bg-gray-100 cursor-not-allowed' : ''"
              class="w-full p-2 box-border border rounded"
            />
            <input
              v-model="s3Config.region"
              id="region"
              placeholder="Region"
              :disabled="!isEditingS3"
              :class="!isEditingS3 ? 'bg-gray-100 cursor-not-allowed' : ''"
              class="w-full p-2 box-border border rounded"
            />
            <input
              v-model="s3Config.accessKeyId"
              id="accessKeyId"
              placeholder="Access Key ID"
              :disabled="!isEditingS3"
              :class="!isEditingS3 ? 'bg-gray-100 cursor-not-allowed' : ''"
              class="w-full p-2 box-border border rounded"
            />
            <input
              v-model="s3Config.secretAccessKey"
              id="secretAccessKey"
              placeholder="Access Key Secret"
              :disabled="!isEditingS3"
              :class="!isEditingS3 ? 'bg-gray-100 cursor-not-allowed' : ''"
              class="w-full p-2 box-border border rounded"
            />
            <input
              v-model="s3Config.customDomain"
              id="customDomain"
              placeholder="Custom Domain"
              :disabled="!isEditingS3"
              :class="!isEditingS3 ? 'bg-gray-100 cursor-not-allowed' : ''"
              class="w-full p-2 box-border border rounded"
            />
          </form>
        </div>

        <div class="flex justify-between mt-4">
          <div class="flex gap-2">
            <button
              v-if="isEditingS3"
              @click="handleCancelS3Edit"
              class="px-4 py-2 bg-gray-500 text-white rounded border-none hover:bg-gray-600 transition-colors cursor-pointer"
            >
              取消
            </button>
            <button
              v-if="!isEditingS3"
              @click="handleEditS3"
              class="px-4 py-2 bg-blue-600 text-white rounded border-none hover:bg-blue-700 transition-colors cursor-pointer"
            >
              编辑
            </button>
            <button
              v-if="isEditingS3"
              @click="handleSaveS3Config"
              :disabled="loadingS3Config"
              class="px-4 py-2 bg-blue-600 text-white rounded border-none hover:bg-blue-700 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {{ loadingS3Config ? '保存中...' : '保存' }}
            </button>
          </div>
          <button
            v-if="isEditingS3"
            @click="handleClearS3Config"
            class="px-4 py-2 bg-red-500 text-white rounded border-none hover:bg-red-600 transition-colors cursor-pointer"
          >
            清除
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
import { showLoading, hideLoading } from '@/composables/useLoading.js'

const { updateAccount, getTokensList, createToken, deleteToken, getConfig, setConfig } = useSettings()
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
    id: 'storage',
    label: '存储配置'
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

// S3 配置相关数据
const s3Config = ref({
  bucket: '',
  endpoint: '',
  region: '',
  accessKeyId: '',
  secretAccessKey: '',
  customDomain: ''
})
const loadingS3Config = ref(false)
const isEditingS3 = ref(false)
const s3ConfigBackup = ref({})

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
  loadS3Config()
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

// 加载 S3 配置
const loadS3Config = async () => {
  showLoading('正在加载 S3 配置...')
  try {
    const result = await getConfig('s3_config')
    if (result.success && result.data) {
      const config = JSON.parse(result.data.value)
      s3Config.value = {
        bucket: config.bucket || '',
        endpoint: config.endpoint || '',
        region: config.region || '',
        accessKeyId: config.accessKeyId || '',
        secretAccessKey: config.secretAccessKey || '',
        customDomain: config.customDomain || ''
      }
    }
  } catch (error) {
  } finally {
    hideLoading()
  }
}

// 进入编辑模式
const handleEditS3 = () => {
  s3ConfigBackup.value = { ...s3Config.value }
  isEditingS3.value = true
}

// 取消编辑
const handleCancelS3Edit = () => {
  s3Config.value = { ...s3ConfigBackup.value }
  isEditingS3.value = false
}

// 保存 S3 配置
const handleSaveS3Config = async () => {
  if (!s3Config.value.bucket || !s3Config.value.endpoint || !s3Config.value.accessKeyId || !s3Config.value.secretAccessKey) {
    await alert('请填写完整 S3 配置信息')
    return
  }

  loadingS3Config.value = true
  const result = await setConfig({
    key: 's3_config',
    value: JSON.stringify({
      bucket: s3Config.value.bucket,
      endpoint: s3Config.value.endpoint,
      region: s3Config.value.region,
      accessKeyId: s3Config.value.accessKeyId,
      secretAccessKey: s3Config.value.secretAccessKey,
      customDomain: s3Config.value.customDomain
    }),
    description: 'S3 存储配置'
  })
  loadingS3Config.value = false

  if (result.success) {
    await alert('S3 配置保存成功！')
    isEditingS3.value = false
  } else {
    await alert(result.error || '保存配置失败')
  }
}

// 清除 S3 配置
const handleClearS3Config = async () => {
  const confirmed = await confirm('确定要清除 S3 配置吗？此操作不可逆。')
  if (!confirmed) return

  const result = await setConfig({
    key: 's3_config',
    value: '',
    description: 'S3 存储配置'
  })

  if (result.success) {
    s3Config.value = {
      bucket: '',
      endpoint: '',
      region: '',
      accessKeyId: '',
      secretAccessKey: '',
      customDomain: ''
    }
    isEditingS3.value = false
    await alert('S3 配置已清除！')
  } else {
    await alert(result.error || '清除配置失败')
  }
}
</script>
