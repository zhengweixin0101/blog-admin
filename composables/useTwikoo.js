import { ref } from 'vue'
import { siteConfig } from '~/site.config.js'

export function useTwikoo() {
  const loading = ref(false)
  const error = ref(null)

  // 初始化 Twikoo
  const initTwikoo = () => {
    return new Promise((resolve, reject) => {
      if (window.twikoo) {
        resolve(window.twikoo)
        return
      }

      // 动态加载 Twikoo 脚本
      const script = document.createElement('script')
      script.src = 'https://cdn.staticfile.org/twikoo/1.6.39/twikoo.all.min.js'
      script.onload = () => {
        resolve(window.twikoo)
      }
      script.onerror = () => {
        reject(new Error('Failed to load Twikoo script'))
      }
      document.head.appendChild(script)
    })
  }

  // 获取评论数量
  const getCommentsCount = async (urls) => {
    loading.value = true
    error.value = null

    try {
      const twikoo = await initTwikoo()
      
      const result = await twikoo.getCommentsCount({
        envId: siteConfig.twikoo.envId,
        urls: urls,
        includeReply: siteConfig.twikoo.includeReply
      })

      return result 
    } catch (err) {
      error.value = err.message
      console.error('获取评论数量失败:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  // 获取最新评论
  const getRecentComments = async () => {
    loading.value = true
    error.value = null

    try {
      const twikoo = await initTwikoo()
      
      const result = await twikoo.getRecentComments({
        envId: siteConfig.twikoo.envId,
        region: siteConfig.twikoo.region,
        urls: [],
        pageSize: siteConfig.twikoo.recentCommentsPageSize,
        includeReply: siteConfig.twikoo.includeReply
      })

      // 格式化评论数据
      return result.map(comment => ({
        id: comment.id,
        url: comment.url,
        articleSlug: extractSlugFromUrl(comment.url),
        author: comment.nick,
        email: comment.mailMd5,
        website: comment.link,
        content: comment.commentText || stripHtml(comment.comment),
        contentHtml: comment.comment,
        created: comment.created,
        date: formatTimestamp(comment.created),
        avatar: comment.avatar || `https://gravatar.com/avatar/${comment.mailMd5}?d=mp&s=40`,
        relativeTime: comment.relativeTime
      }))
    } catch (err) {
      error.value = err.message
      console.error('获取最新评论失败:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  // 从URL中提取文章slug
  const extractSlugFromUrl = (url) => {
    // 匹配 /posts/slug 格式
    const match = url.match(/\/posts\/(.+)$/)
    return match ? match[1] : ''
  }

  // 去除HTML标签
  const stripHtml = (html) => {
    const tmp = document.createElement('div')
    tmp.innerHTML = html
    return tmp.textContent || tmp.innerText || ''
  }

  // 格式化时间戳
  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diff = now - date
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    
    if (days === 0) {
      return '今天'
    } else if (days === 1) {
      return '昨天'
    } else if (days < 7) {
      return `${days}天前`
    } else if (days < 30) {
      return `${Math.floor(days / 7)}周前`
    } else {
      return date.toLocaleDateString('zh-CN')
    }
  }

  return {
    loading,
    error,
    getCommentsCount,
    getRecentComments
  }
}