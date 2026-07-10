// 浏览器端账号凭证加密/解密工具
// 使用 Web Crypto API: PBKDF2 派生密钥 + AES-GCM 加密

const CREDENTIALS_KEY = 'auth_credentials'

// 根据浏览器特征生成指纹
function getBrowserFingerprint() {
  const components = [
    navigator.userAgent,
    navigator.language,
    screen.colorDepth,
    screen.width + 'x' + screen.height,
    new Date().getTimezoneOffset(),
    navigator.hardwareConcurrency || 'unknown',
    navigator.platform || 'unknown'
  ]
  return components.join('|')
}

// 从指纹派生 AES-GCM 密钥
async function deriveKey(fingerprint, salt) {
  const encoder = new TextEncoder()
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(fingerprint),
    'PBKDF2',
    false,
    ['deriveBits', 'deriveKey']
  )

  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: encoder.encode(salt),
      iterations: 100000,
      hash: 'SHA-256'
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  )
}

// ArrayBuffer 转 Base64
function arrayBufferToBase64(buffer) {
  const bytes = new Uint8Array(buffer)
  let binary = ''
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i])
  }
  return btoa(binary)
}

// Base64 转 Uint8Array
function base64ToUint8Array(base64) {
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i)
  }
  return bytes
}

export function useCrypto() {
  const SALT = 'blog-admin-cred-salt-v1'

  // 加密账号密码，返回 base64 字符串（IV + 密文）
  async function encryptCredentials(username, password) {
    const fingerprint = getBrowserFingerprint()
    const key = await deriveKey(fingerprint, SALT)
    const iv = crypto.getRandomValues(new Uint8Array(12))
    const encoder = new TextEncoder()
    const data = encoder.encode(JSON.stringify({ u: username, p: password }))

    const encrypted = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      key,
      data
    )

    const combined = new Uint8Array(iv.length + encrypted.byteLength)
    combined.set(iv)
    combined.set(new Uint8Array(encrypted), iv.length)

    return arrayBufferToBase64(combined)
  }

  // 解密，返回 { username, password }
  async function decryptCredentials(encryptedBase64) {
    const fingerprint = getBrowserFingerprint()
    const key = await deriveKey(fingerprint, SALT)

    const combined = base64ToUint8Array(encryptedBase64)
    const iv = combined.slice(0, 12)
    const encrypted = combined.slice(12)

    const decrypted = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      key,
      encrypted
    )

    const decoder = new TextDecoder()
    const { u, p } = JSON.parse(decoder.decode(decrypted))
    return { username: u, password: p }
  }

  // 加密并持久化存储凭证
  const saveCredentials = async (username, password) => {
    try {
      const encrypted = await encryptCredentials(username, password)
      localStorage.setItem(CREDENTIALS_KEY, encrypted)
    } catch (e) {
      console.error('Failed to encrypt credentials:', e)
    }
  }

  // 读取并解密凭证
  const getCredentials = async () => {
    const encrypted = localStorage.getItem(CREDENTIALS_KEY)
    if (!encrypted) return null
    try {
      return await decryptCredentials(encrypted)
    } catch {
      // 解密失败（换浏览器/设备指纹变化），清除无效数据
      localStorage.removeItem(CREDENTIALS_KEY)
      return null
    }
  }

  // 是否有缓存凭证
  const hasCredentials = () => {
    return !!localStorage.getItem(CREDENTIALS_KEY)
  }

  // 删除缓存凭证
  const removeCredentials = () => {
    localStorage.removeItem(CREDENTIALS_KEY)
  }

  return {
    saveCredentials,
    getCredentials,
    hasCredentials,
    removeCredentials
  }
}
