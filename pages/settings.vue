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
            <div class="flex items-center flex-wrap">
              <span class="text-sm text-gray-600">权限配置：</span>
              <label class="flex items-center text-sm cursor-pointer mr-3">
                <input type="checkbox" v-model="newToken.permissions" value="article:write" class="cursor-pointer w-3 h-3" />
                <span>文章编辑</span> 
              </label>
              <label class="flex items-center text-sm cursor-pointer mr-3">
                <input type="checkbox" v-model="newToken.permissions" value="article:delete" class="cursor-pointer w-3 h-3" />
                <span>文章删除</span>
              </label>
              <label class="flex items-center text-sm cursor-pointer mr-3">
                <input type="checkbox" v-model="newToken.permissions" value="talk:write" class="cursor-pointer w-3 h-3" />
                <span>说说编辑</span>
              </label>
              <label class="flex items-center text-sm cursor-pointer">
                <input type="checkbox" v-model="newToken.permissions" value="talk:delete" class="cursor-pointer w-3 h-3" />
                <span>说说删除</span>
              </label>
            </div>
            <button
              type="button"
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
                <th class="text-left py-2 px-2 font-medium">权限</th>
                <th class="text-left py-2 px-2 font-medium">创建时间</th>
                <th class="text-left py-2 px-2 font-medium">过期时间</th>
                <th class="text-left py-2 px-2 font-medium">状态</th>
                <th class="text-left py-2 px-2 font-medium">操作</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="tokens.length === 0">
                <td colspan="7" class="text-center py-8 text-gray-500">暂无 Token</td>
              </tr>
              <tr v-for="token in tokens" :key="token.id" class="border-b border-gray-100 hover:bg-gray-50">
                <td class="py-2 px-2">{{ token.name || '-' }}</td>
                <td class="py-2 px-2">{{ token.description || '-' }}</td>
                <td class="py-2 px-2">{{ formatPermissions(token.permissions) }}</td>
                <td class="py-2 px-2">{{ formatDate(token.createdAt) }}</td>
                <td class="py-2 px-2">{{ token.expiresAt ? formatDate(token.expiresAt) : '永不过期' }}</td>
                <td class="py-2 px-2">
                  <span
                    :class="getRemainingTime(token.expiresAt).isExpired ? 'text-red-500' : 'text-green-500'"
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

    <!-- 系统配置板块 -->
    <div v-show="activeTab === 'config'" class="space-y-3">
      <!-- S3 存储配置 -->
      <div class="p-3 rounded shadow">
        <h2 class="text-lg font-bold mb-4">S3 配置</h2>
        <p class="text-sm text-gray-500 mb-4">仅支持兼容 AWS S3 的对象存储服务，如 AWS S3、Cloudflare R2等。</p>

        <div>
          <form id="s3Config" class="space-y-3">
            <div>
              <label class="text-sm text-gray-600 mb-1 block">Bucket <span class="text-red-500">*</span></label>
              <input
                v-model="s3Config.bucket"
                id="bucket"
                placeholder="例如: bucket"
                :disabled="!isEditingS3"
                :class="!isEditingS3 ? 'bg-gray-100 cursor-not-allowed' : ''"
                class="w-full p-2 box-border border rounded"
              />
              <p class="text-xs text-gray-400 mt-1">存储桶名称</p>
            </div>
            <div>
              <label class="text-sm text-gray-600 mb-1 block">Endpoint <span class="text-red-500">*</span></label>
              <input
                v-model="s3Config.endpoint"
                id="endpoint"
                placeholder="例如: https://s3.amazonaws.com"
                :disabled="!isEditingS3"
                :class="!isEditingS3 ? 'bg-gray-100 cursor-not-allowed' : ''"
                class="w-full p-2 box-border border rounded"
              />
              <p class="text-xs text-gray-400 mt-1">API 端点地址</p>
            </div>
            <div>
              <label class="text-sm text-gray-600 mb-1 block">Region</label>
              <input
                v-model="s3Config.region"
                id="region"
                placeholder="例如: us-east-1"
                :disabled="!isEditingS3"
                :class="!isEditingS3 ? 'bg-gray-100 cursor-not-allowed' : ''"
                class="w-full p-2 box-border border rounded"
              />
              <p class="text-xs text-gray-400 mt-1">区域代码</p>
            </div>
            <div>
              <label class="text-sm text-gray-600 mb-1 block">Access Key ID <span class="text-red-500">*</span></label>
              <input
                v-model="s3Config.accessKeyId"
                id="accessKeyId"
                placeholder="Access Key ID"
                :disabled="!isEditingS3"
                :class="!isEditingS3 ? 'bg-gray-100 cursor-not-allowed' : ''"
                class="w-full p-2 box-border border rounded"
              />
            </div>
            <div>
              <label class="text-sm text-gray-600 mb-1 block">Access Key Secret <span class="text-red-500">*</span></label>
              <input
                v-model="s3Config.secretAccessKey"
                id="secretAccessKey"
                placeholder="Access Key Secret"
                :disabled="!isEditingS3"
                :class="!isEditingS3 ? 'bg-gray-100 cursor-not-allowed' : ''"
                class="w-full p-2 box-border border rounded"
              />
            </div>
            <div>
              <label class="text-sm text-gray-600 mb-1 block">Custom Domain</label>
              <input
                v-model="s3Config.customDomain"
                id="customDomain"
                placeholder="例如: https://cdn.example.com"
                :disabled="!isEditingS3"
                :class="!isEditingS3 ? 'bg-gray-100 cursor-not-allowed' : ''"
                class="w-full p-2 box-border border rounded"
              />
              <p class="text-xs text-gray-400 mt-1">自定义域名，用于访问文件</p>
            </div>
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

      <!-- AI 配置 -->
      <div class="p-3 rounded shadow">
        <h2 class="text-lg font-bold mb-4">AI 配置</h2>
        <p class="text-sm text-gray-500 mb-4">支持 OpenAI 兼容 API，如 OpenAI、SiliconFlow、Poixe AI、OpenRouter、DeepSeek 等</p>

        <div>
          <form id="aiConfig" class="space-y-3">
            <div class="flex items-center">
              <label class="text-sm font-medium text-gray-700 mr-2">启用 AI 服务</label>
              <input
                v-model="aiConfig.enabled"
                type="checkbox"
                id="aiEnabled"
                :disabled="!isEditingAI"
                :class="!isEditingAI ? 'cursor-not-allowed' : 'cursor-pointer'"
                class="w-4 h-4"
              />
            </div>
            <div>
              <label class="text-sm text-gray-600 mb-1 block">API Endpoint <span class="text-red-500">*</span></label>
              <input
                v-model="aiConfig.endpoint"
                id="aiEndpoint"
                placeholder="例如: https://api.openai.com/v1"
                :disabled="!isEditingAI"
                :class="!isEditingAI ? 'bg-gray-100 cursor-not-allowed' : ''"
                class="w-full p-2 box-border border rounded"
              />
              <p class="text-xs text-gray-400 mt-1">API 基础地址，例如:https://api.openai.com/v1</p>
            </div>
            <div>
              <label class="text-sm text-gray-600 mb-1 block">API Key <span class="text-red-500">*</span></label>
              <input
                v-model="aiConfig.apiKey"
                id="aiApiKey"
                placeholder="API Key"
                :disabled="!isEditingAI"
                :class="!isEditingAI ? 'bg-gray-100 cursor-not-allowed' : ''"
                class="w-full p-2 box-border border rounded"
              />
            </div>
            <div>
              <label class="text-sm text-gray-600 mb-1 block">Model <span class="text-red-500">*</span></label>
              <div class="model-search-container flex items-center gap-2 relative">
                <input
                  v-model="modelSearchText"
                  :placeholder="availableModels.length > 0 ? '搜索模型...' : '请选择模型'"
                  :disabled="!isEditingAI || loadingModels"
                  :class="(!isEditingAI || loadingModels) ? 'bg-gray-100 cursor-not-allowed' : ''"
                  class="flex-1 p-2 box-border border rounded"
                  @focus="showModelDropdown = true"
                />
                <div
                  v-if="isEditingAI"
                  @click="handleLoadModels"
                  :class="{ 'opacity-50 cursor-not-allowed': loadingModels || !aiConfig.endpoint || !aiConfig.apiKey, 'cursor-pointer': !(loadingModels || !aiConfig.endpoint || !aiConfig.apiKey) }"
                  class="text-gray-600 hover:text-gray-800 transition-colors"
                  :title="loadingModels ? '加载中...' : '刷新模型列表'"
                >
                  <svg v-if="loadingModels" class="animate-spin w-5 h-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <svg v-else class="w-5 h-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </div>

                <!-- 模型下拉列表 -->
                <div
                  v-show="showModelDropdown && isEditingAI"
                  class="absolute top-full left-0 right-0 mt-1 z-10 w-full max-h-60 overflow-y-auto bg-white border rounded shadow-lg"
                >
                  <div
                    v-if="filteredModels.length === 0"
                    class="p-3 text-center text-gray-500 text-sm"
                  >
                    {{ availableModels.length === 0 ? '暂无可用模型，请先刷新' : '未找到匹配的模型' }}
                  </div>
                  <div
                    v-for="model in filteredModels"
                    :key="model.id"
                    @click="selectModel(model.id)"
                    class="p-2 cursor-pointer hover:bg-gray-100 transition-colors text-sm"
                    :class="{ 'bg-blue-50': aiConfig.model === model.id }"
                  >
                    {{ model.id }}
                  </div>
                </div>
              </div>
              <p class="text-xs text-gray-400 mt-1">填写 API Endpoint 和 API Key 后，点击刷新获取可用模型</p>
            </div>
          </form>
        </div>

        <div class="flex justify-between mt-4">
          <div class="flex gap-2">
            <button
              v-if="isEditingAI"
              @click="handleCancelAIEdit"
              class="px-4 py-2 bg-gray-500 text-white rounded border-none hover:bg-gray-600 transition-colors cursor-pointer"
            >
              取消
            </button>
            <button
              v-if="!isEditingAI"
              @click="handleEditAI"
              class="px-4 py-2 bg-blue-600 text-white rounded border-none hover:bg-blue-700 transition-colors cursor-pointer"
            >
              编辑
            </button>
            <button
              v-if="isEditingAI"
              @click="handleSaveAIConfig"
              :disabled="loadingAIConfig"
              class="px-4 py-2 bg-blue-600 text-white rounded border-none hover:bg-blue-700 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {{ loadingAIConfig ? '保存中...' : '保存' }}
            </button>
          </div>
          <button
            v-if="isEditingAI"
            @click="handleClearAIConfig"
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
import { ref, onMounted, onUnmounted, watch, computed } from 'vue'
import { useSettings } from '~/composables/useSettings.js'
import { useAI } from '~/composables/useAI.js'
import { useS3 } from '~/composables/useS3.js'
import { alert, confirm, prompt } from '@/composables/useModal'
import { useToken } from '~/composables/useToken.js'
import { showLoading, hideLoading } from '@/composables/useLoading.js'

const { updateAccount, getTokensList, createToken, deleteToken, getConfig, setConfig } = useSettings()
const { removeToken, removeTokenExpires } = useToken()
const { getModels, sendMessage } = useAI()
const { testConnection } = useS3()

// 当前激活的标签页
const activeTab = ref('config')

// 标签页配置
const tabs = [
  {
    id: 'config',
    label: '系统配置'
  },
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
  expiresIn: 86400000,
  permissions: ['article:write', 'article:delete', 'talk:write', 'talk:delete']
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
const s3ConfigLoaded = ref(false)

// AI 配置相关数据
const aiConfig = ref({
  enabled: false,
  endpoint: '',
  apiKey: '',
  model: ''
})
const loadingAIConfig = ref(false)
const isEditingAI = ref(false)
const aiConfigBackup = ref({})
const aiConfigLoaded = ref(false)
const tokensLoaded = ref(false)
const availableModels = ref([])
const loadingModels = ref(false)
const modelSearchText = ref('')
const showModelDropdown = ref(false)

// 过滤后的模型列表
const filteredModels = computed(() => {
  if (!modelSearchText.value) {
    return availableModels.value
  }
  const searchLower = modelSearchText.value.toLowerCase()
  return availableModels.value.filter(model =>
    model.id.toLowerCase().includes(searchLower)
  )
})

// 选择模型
const selectModel = (modelId) => {
  aiConfig.value.model = modelId
  modelSearchText.value = modelId
  showModelDropdown.value = false
}

// 加载 Token 列表
const loadTokens = async () => {
  showLoading('正在加载 Token 列表...')
  const result = await getTokensList()
  hideLoading()
  if (result.success) {
    tokens.value = result.data || []
    tokensLoaded.value = true
  } else {
    await alert(result.error || '获取 Token 列表失败')
  }
}

// 点击外部关闭下拉列表
const handleClickOutside = (e) => {
  const dropdown = document.querySelector('.model-search-container')
  if (dropdown && !dropdown.contains(e.target)) {
    showModelDropdown.value = false
  }
}

onMounted(() => {
  // 根据当前激活的标签页加载对应数据
  loadTabData(activeTab.value)
  // 添加点击外部关闭下拉列表的监听
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  // 清理事件监听
  document.removeEventListener('click', handleClickOutside)
})

// 监听标签页变化，加载对应数据
watch(activeTab, (newTab) => {
  loadTabData(newTab)
})

// 根据标签页加载对应数据
const loadTabData = (tab) => {
  if (tab === 'account') {
    loadTokens()
  } else if (tab === 'config') {
    loadS3Config()
    loadAIConfig()
  }
}

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

  if (!newToken.value.permissions || newToken.value.permissions.length === 0) {
    await alert('请至少选择一个权限')
    return
  }

  const result = await createToken({
    name: newToken.value.name.trim(),
    description: newToken.value.description.trim(),
    expiresIn: newToken.value.expiresIn,
    permissions: newToken.value.permissions
  })

  if (result.success) {
    newToken.value = { name: '', description: '', expiresIn: 86400000, permissions: ['article:write', 'article:delete', 'talk:write', 'talk:delete'] }
    await loadTokens()
    await alert(`Token 创建成功！\n\n${result.data.token}\n\n(请妥善保存，关闭后将无法再次查看)`)
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
    await loadTokens()
    await alert(result.message || 'Token 删除成功')
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

// 格式化权限显示
const formatPermissions = (permissions) => {
  if (!permissions || !Array.isArray(permissions)) return '-'

  const permissionLabels = {
    'article:write': '文章编辑',
    'article:delete': '文章删除',
    'talk:write': '说说编辑',
    'talk:delete': '说说删除',
    'super': 'Super'
  }

  return permissions.map(p => permissionLabels[p] || p).join(', ')
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
  if (s3ConfigLoaded.value) return
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
    s3ConfigLoaded.value = true
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

  // 先测试连接
  showLoading('正在测试 S3 连接...')
  const testResult = await testConnection({
    cfg: {
      bucket: s3Config.value.bucket,
      endpoint: s3Config.value.endpoint,
      region: s3Config.value.region,
      accessKeyId: s3Config.value.accessKeyId,
      secretAccessKey: s3Config.value.secretAccessKey
    }
  })
  hideLoading()

  if (!testResult.success) {
    await alert(`连接测试失败，无法保存配置：\n${testResult.error}`)
    return
  }

  // 连接测试通过，保存配置
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
    await alert('连接测试已通过，S3 配置保存成功！')
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

// 加载 AI 配置
const loadAIConfig = async () => {
  if (aiConfigLoaded.value) return
  showLoading('正在加载 AI 配置...')
  try {
    const result = await getConfig('ai_config')
    if (result.success && result.data) {
      const config = JSON.parse(result.data.value)
      aiConfig.value = {
        enabled: config.enabled ?? false,
        endpoint: config.endpoint || '',
        apiKey: config.apiKey || '',
        model: config.model || ''
      }
      // 更新搜索框显示的模型名称
      modelSearchText.value = config.model || ''
    }
    aiConfigLoaded.value = true
  } catch (error) {
  } finally {
    hideLoading()
  }
}

// 进入编辑模式
const handleEditAI = () => {
  aiConfigBackup.value = { ...aiConfig.value }
  isEditingAI.value = true
  // 如果已有配置，自动加载模型列表
  if (aiConfig.value.endpoint && aiConfig.value.apiKey) {
    handleLoadModels()
  }
}

// 取消编辑
const handleCancelAIEdit = () => {
  aiConfig.value = { ...aiConfigBackup.value }
  isEditingAI.value = false
  availableModels.value = []
}



// 加载可用模型列表
const handleLoadModels = async () => {
  if (!aiConfig.value.endpoint || !aiConfig.value.apiKey) {
    await alert('请先填写 API Endpoint 和 API Key')
    return
  }

  loadingModels.value = true
  const result = await getModels({
    endpoint: aiConfig.value.endpoint,
    apiKey: aiConfig.value.apiKey
  })
  loadingModels.value = false

  if (result.success && result.data?.data) {
    availableModels.value = result.data.data
    // 如果当前选中的模型不在列表中，清空选择
    if (aiConfig.value.model && !availableModels.value.find(m => m.id === aiConfig.value.model)) {
      aiConfig.value.model = ''
      modelSearchText.value = ''
    }
  } else {
    await alert(`加载模型列表失败：\n${result.error}`)
  }
}

// 保存 AI 配置
const handleSaveAIConfig = async () => {
  if (!aiConfig.value.apiKey) {
    await alert('请填写 API Key')
    return
  }

  // 先测试连接（如果已选择模型）
  if (aiConfig.value.model && aiConfig.value.endpoint) {
    showLoading('正在测试 AI 连接...')
    const testResult = await sendMessage({
      messages: [
        {
          role: 'user',
          content: '请简单回复"连接成功"'
        }
      ],
      config: {
        enabled: true,
        endpoint: aiConfig.value.endpoint,
        apiKey: aiConfig.value.apiKey,
        model: aiConfig.value.model
      }
    })
    hideLoading()

    if (!testResult.success) {
      await alert(`连接测试失败，无法保存配置：\n${testResult.error}`)
      return
    }
  }

  // 连接测试通过或未选择模型，保存配置
  loadingAIConfig.value = true
  const result = await setConfig({
    key: 'ai_config',
    value: JSON.stringify({
      enabled: aiConfig.value.enabled,
      endpoint: aiConfig.value.endpoint,
      apiKey: aiConfig.value.apiKey,
      model: aiConfig.value.model
    }),
    description: 'AI服务配置：OpenAI API配置'
  })
  loadingAIConfig.value = false

  if (result.success) {
    await alert('AI 配置保存成功！' + (aiConfig.value.model && aiConfig.value.endpoint ? '连接测试已通过。' : ''))
    isEditingAI.value = false
  } else {
    await alert(result.error || '保存配置失败')
  }
}

// 清除 AI 配置
const handleClearAIConfig = async () => {
  const confirmed = await confirm('确定要清除 AI 配置吗？此操作不可逆。')
  if (!confirmed) return

  const result = await setConfig({
    key: 'ai_config',
    value: '',
    description: 'AI服务配置：OpenAI API配置'
  })

    if (result.success) {
      aiConfig.value = {
        enabled: false,
        endpoint: 'https://api.siliconflow.cn/v1',
        apiKey: '',
        model: ''
      }
      isEditingAI.value = false
      await alert('AI 配置已清除！')
    } else {
    await alert(result.error || '清除配置失败')
  }
}
</script>
