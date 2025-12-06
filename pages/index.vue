<template>
  <div class="flex flex-col">
    <!-- 顶部统计卡片 -->
    <div class="grid sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-5 gap-4 p-4 md:p-6 lg:p-8">
      <!-- 文章总数 -->
      <div class="p-3 md:p-4 rounded shadow">
        <p class="text-gray-500 text-xs md:text-sm">文章总数</p>
        <p class="text-xl md:text-2xl font-bold rounded -mt-2">
          {{ articleStats.total }}
          <span
            v-if="articleStats.thisYear > 0 && articleStats.draft === 0"
            class="text-xs md:text-sm text-green-500 font-normal block md:inline"
          >
            ↑今年共发布 {{ articleStats.thisYear }} 篇
          </span>
          <span
            v-if="articleStats.total > 0 && articleStats.thisYear === 0"
            class="text-xs md:text-sm text-red-500 font-normal block md:inline"
          >
            ×今年还未发布文章
          </span>
          <span
            v-if="articleStats.draft > 0"
            class="text-xs md:text-sm text-orange-500 font-normal block md:inline md:ml-2"
          >
            ! 有 {{ articleStats.draft }} 篇未发布
          </span>
        </p>
      </div>

      <!-- 标签总数 -->
      <div class="p-3 md:p-4 rounded shadow">
        <p class="text-gray-500 text-xs md:text-sm">标签总数</p>
        <p class="text-xl md:text-2xl font-bold rounded -mt-2">
          {{ tagStats.total }}
          <span
            v-if="tagStats.articlesWithoutTags === 0 && articleStats.total > 0"
            class="text-xs md:text-sm text-green-500 font-normal block md:inline"
          >
            ✓ 所有文章均已添加
          </span>
          <span
            v-else-if="tagStats.articlesWithoutTags > 0"
            class="text-xs md:text-sm text-orange-500 font-normal block md:inline"
          >
            ! 有 {{ tagStats.articlesWithoutTags }} 篇未添加
          </span>
        </p>
      </div>

      <!-- 说说总数 -->
      <div class="p-3 md:p-4 rounded shadow">
        <p class="text-gray-500 text-xs md:text-sm">说说总数</p>
        <p class="text-xl md:text-2xl font-bold rounded -mt-2">
          {{ talkStats.total }}
          <span
            v-if="talkStats.recent > 0"
            class="text-xs md:text-sm text-green-500 font-normal block md:inline"
          >
            ↑近三个月发布 {{ talkStats.recent }} 条
          </span>
          <span
            v-if="talkStats.total > 0 && talkStats.recent === 0"
            class="text-xs md:text-sm text-orange-500 font-normal block md:inline"
          >
            ! 已经很久没发布说说了
          </span>
        </p>
      </div>

      <!-- 评论总数 -->
      <div class="p-3 md:p-4 rounded shadow">
        <p class="text-gray-500 text-xs md:text-sm">评论总数</p>
        <p class="text-xl md:text-2xl font-bold rounded -mt-2">
          {{ formatNumber(commentStats.total) }}
          <span
            v-if="commentStats.total > 0 && commentStats.articleCount > 0"
            class="text-xs md:text-sm text-green-500 font-normal block md:inline"
          >
            ↗共来自 {{ commentStats.articleCount }} 个页面
          </span>
        </p>
      </div>

      <!-- 总访问量 -->
      <div class="p-3 md:p-4 rounded shadow">
        <p class="text-gray-500 text-xs md:text-sm">访问总量</p>
        <p class="text-xl md:text-2xl font-bold rounded -mt-2">
          {{ formatNumber(visitStats.total) }}
          <span
            v-if="visitStats.thisWeek > 0"
            class="text-xs md:text-sm text-green-500 font-normal block md:inline"
          >
            ↑近七天新增 {{ formatNumber(visitStats.thisWeek) }}
          </span>
          <span
            v-else-if="visitStats.total > 0 && visitStats.thisWeek === 0"
            class="text-xs md:text-sm text-orange-500 font-normal block md:inline"
          >
            ! 近期无访问
          </span>
        </p>
      </div>
    </div>

    <!-- 主体两列布局 -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6 px-4 md:px-6 lg:px-8 flex-1 min-h-0">

      <!-- 热门文章 -->
      <div class="bg-white rounded shadow flex flex-col min-h-0">
        <div class="px-4 md:px-6 py-3 md:py-4 border-b border-gray-200">
          <h2 class="text-base md:text-lg font-semibold text-gray-800">热门文章</h2>
        </div>
        <div class="flex-1 overflow-y-auto px-4 md:px-6">
          <div v-if="loading" class="text-center py-8">
            <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            <p class="text-gray-500 mt-2">加载中...</p>
          </div>
          <div v-else>
            <div v-for="(article, index) in topArticles" :key="article.slug" 
                 class="flex items-center gap-2 md:gap-3 p-2 md:p-3 hover:bg-gray-50 rounded transition-colors">
              <span class="flex-shrink-0 w-5 h-5 md:w-6 md:h-6 bg-gray-400 text-white rounded flex items-center justify-center text-xs md:text-sm font-bold">
                {{ index + 1 }}
              </span>
              <div class="flex-1 min-w-0">
                <div class="flex flex-col md:flex-row md:items-center gap-1 md:gap-2">
                  <p class="text-sm md:text-md font-medium text-gray-800 truncate">{{ article.title }}</p>
                  <div v-if="article.tags && article.tags.length" class="flex flex-wrap items-center gap-1">
                    <span v-for="tag in article.tags.slice(0, 2)" :key="tag" 
                          class="px-1 py-0.5 text-xs bg-gray-100 text-gray-600 rounded">
                      {{ tag }}
                    </span>
                    <span v-if="article.tags.length > 2" 
                          class="px-1 py-0.5 text-xs bg-gray-100 text-gray-600 rounded">
                      +{{ article.tags.length - 2 }}
                    </span>
                  </div>
                </div>
                <div class="flex items-center gap-3 md:gap-4 mt-1">
                  <p class="text-xs text-gray-500">{{ article.views }} 次浏览</p>
                  <p class="text-xs text-gray-400">{{ formatDate(article.date) }}</p>
                </div>
              </div>
              <div class="flex gap-1 md:gap-2 flex-shrink-0">
                <NuxtLink :to="`/articles/edit/${article.slug}`" class="px-2 py-1 text-xs md:text-sm bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors no-underline">编辑</NuxtLink>
                <a :href="`${siteConfig.blogUrl}/posts/${article.slug}`" target="_blank" class="px-2 py-1 text-xs md:text-sm bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors no-underline">访问</a>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 最新评论 -->
      <div class="bg-white rounded shadow flex flex-col min-h-0">
        <div class="px-4 md:px-6 py-3 md:py-4 border-b border-gray-200">
          <h2 class="text-base md:text-lg font-semibold text-gray-800">最新评论</h2>
        </div>
        <div class="flex-1 overflow-y-auto p-4 md:p-6">
          <div v-if="loading" class="text-center py-8">
            <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            <p class="text-gray-500 mt-2">加载中...</p>
          </div>
          <div v-else-if="recentComments.length === 0" class="text-center py-8">
            <p class="text-gray-400 text-sm">暂无最新评论</p>
          </div>
          <div v-else class="space-y-4">
            <div v-for="comment in recentComments" :key="comment.id" class="border-b border-gray-100 pb-3 last:border-0">
              <div class="flex items-start gap-3">
                <img 
                  :src="comment.avatar" 
                  :alt="comment.author"
                  class="w-8 h-8 rounded-full flex-shrink-0 object-cover"
                  @error="$event.target.src = `https://gravatar.com/avatar/${comment.email}?d=mp&s=40`"
                >
                <div class="flex-1">
                  <div class="flex items-center justify-between mb-1">
                    <span class="font-medium text-sm text-gray-800">{{ comment.author }}</span>
                    <span class="text-xs text-gray-500">{{ comment.relativeTime || comment.date }}</span>
                  </div>
                  <p class="text-sm text-gray-600 line-clamp-2">{{ comment.content }}</p>
                  <span class="text-xs text-blue-500 hover:text-blue-700 cursor-pointer mt-1 inline-block" @click="openSource(comment)">
                    来源: {{ comment.articleTitle }}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useArticles } from '~/composables/useArticles.js'
import { useTalks } from '~/composables/useTalks.js'
import { useTwikoo } from '~/composables/useTwikoo.js'
import { siteConfig } from '@/site.config.js'

const { articles, getList } = useArticles()
const { talks, getTalks } = useTalks()
const { getCommentsCount, getRecentComments } = useTwikoo()

// Umami配置
const UMAMI_URL = siteConfig.umami.url
const WEBSITE_ID = siteConfig.umami.siteId
const TOKEN = siteConfig.umami.token

// 响应式数据
const loading = ref(true)
const articleStats = ref({
  total: 0,
  thisYear: 0,
  draft: 0
})

const recentComments = ref([])
const tagStats = ref({
  total: 0,
  articlesWithoutTags: 0
})
const talkStats = ref({
  total: 0,
  recent: 0
})

const commentStats = ref({
  total: 0,
  articleCount: 0
})

const visitStats = ref({
  total: 0,
  thisWeek: 0
})

const topArticles = ref([])

// 计算文章统计数据
const calculateArticleStats = () => {
  const allArticles = Array.isArray(articles.value) ? articles.value : []
  const currentYear = new Date().getFullYear()
  
  articleStats.value = {
    total: allArticles.length,
    thisYear: allArticles.filter(article => {
      const articleYear = new Date(article.date).getFullYear()
      return articleYear === currentYear
    }).length,
    draft: allArticles.filter(article => !article.published).length
  }
}

// 从URL中提取文章slug
const extractSlugFromUrl = (url) => {
  const match = url.match(/\/posts\/([^\/?#]+)/)
  return match ? match[1] : null
}

// 获取统计数据
const fetchStats = async (startAt, endAt) => {
  try {
    const url = `${UMAMI_URL}/api/websites/${WEBSITE_ID}/stats`
    const response = await fetch(`${url}?startAt=${startAt}&endAt=${endAt}`, {
      headers: { Authorization: `Bearer ${TOKEN}` },
      method: 'GET',
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    return await response.json()
  } catch (err) {
    console.error('获取统计数据失败:', err)
    throw err
  }
}

// 获取访问量的值
function getValue(data, key) {
  if (!data) return 0
  const val = data[key]
  if (val === undefined || val === null) return 0
  return Number(val) || 0
}

// 获取页面路径统计数据
const fetchMetrics = async (startAt, endAt, type = 'path', limit = 500) => {
  try {
    const url = new URL(`${UMAMI_URL}/api/websites/${WEBSITE_ID}/metrics`)
    url.searchParams.set('startAt', startAt)
    url.searchParams.set('endAt', endAt)
    url.searchParams.set('type', type)
    url.searchParams.set('limit', limit)

    const response = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${TOKEN}` },
      method: 'GET',
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    return await response.json()
  } catch (err) {
    console.error('获取页面统计数据失败:', err)
    throw err
  }
}

// 获取时间戳范围
const getTimestampRange = (days = 30) => {
  const end = new Date()
  const start = new Date()
  start.setDate(end.getDate() - days)
  start.setHours(0, 0, 0, 0)
  
  return { 
    start: start.getTime(), 
    end: end.getTime() 
  }
}

// 获取热门文章排行
const getTopArticles = async () => {
  try {
    // 从umami获取页面统计数据
    const { start, end } = getTimestampRange(30)
    const pathMetrics = await fetchMetrics(start, end, 'path', 500)
    
    if (!pathMetrics || !Array.isArray(pathMetrics)) {
      console.warn('API返回的路径数据格式不正确:', pathMetrics)
      throw new Error('Invalid data format')
    }
    
    // 过滤出文章并提取slug
    const articlePages = pathMetrics
      .map(item => ({
        path: item.x,
        pageviews: item.y || 0,
        slug: extractSlugFromUrl(item.x)
      }))
      .filter(item => item.slug) // 只保留文章
    
    const allArticles = Array.isArray(articles.value) ? articles.value : []
    
    // 合并文章信息和访问统计数据
    const articlesWithViews = allArticles.map(article => {
      const pageStats = articlePages.find(page => page.slug === article.slug)
      return {
        ...article,
        views: pageStats ? pageStats.pageviews : 0
      }
    })
    
    // 按访问量排序
    topArticles.value = articlesWithViews
      .filter(article => article.views > 0) // 只显示访问量大于0的文章
      .sort((a, b) => b.views - a.views)
      .slice(0, 10) // 取前10篇
  } catch (err) {
    console.error('获取热门文章排行失败:', err)
    // 如果获取统计数据失败，回退到按时间排序
    const allArticles = Array.isArray(articles.value) ? articles.value : []
    topArticles.value = allArticles
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 10)
      .map(article => ({
        ...article,
        views: 0
      }))
  }
}

// 获取最新评论
const fetchRecentComments = async () => {
  try {
    const comments = await getRecentComments()
    
    // 为评论添加文章标题
    const commentsWithTitles = comments.map(comment => {
      const article = articles.value?.find(a => a.slug === comment.articleSlug)
      return {
        ...comment,
        articleTitle: article ? article.title : 
          comment.url.startsWith('/talks') ? '说说' : 
          `未知文章 (${comment.articleSlug})`
      }
    })
    
    recentComments.value = commentsWithTitles
  } catch (err) {
    console.error('获取最新评论失败:', err)
  }
}

// 获取标签统计
const getTagStats = () => {
  const allArticles = Array.isArray(articles.value) ? articles.value : []
  const allTags = new Set()
  let articlesWithoutTags = 0
  
  allArticles.forEach(article => {
    if (article.tags && Array.isArray(article.tags) && article.tags.length > 0) {
      article.tags.forEach(tag => allTags.add(tag))
    } else {
      articlesWithoutTags++
    }
  })
  
  tagStats.value.total = allTags.size
  tagStats.value.articlesWithoutTags = articlesWithoutTags
}

// 获取访问量统计数据
const getVisitStats = async () => {
  try {
    const now = new Date()
    const createTime = new Date(siteConfig.umami.createTime)
    
    // 获取总访问量
    const totalStats = await fetchStats(createTime.getTime(), now.getTime())
    const totalVisits = getValue(totalStats, 'pageviews')
    
    // 计算近七天的时间范围
    const sevenDaysAgo = new Date(now)
    sevenDaysAgo.setDate(now.getDate() - 6)
    sevenDaysAgo.setHours(0, 0, 0, 0)
    
    const todayEnd = new Date(now)
    todayEnd.setHours(23, 59, 59, 999)
    
    // 获取近七天的访问量
    const recentStats = await fetchStats(sevenDaysAgo.getTime(), todayEnd.getTime())
    const recentVisits = getValue(recentStats, 'pageviews')
    
    visitStats.value = {
      total: totalVisits,
      thisWeek: recentVisits
    }
  } catch (err) {
    console.error('获取访问量统计失败:', err)
    visitStats.value = {
      total: 0,
      thisWeek: 0
    }
  }
}

// 获取评论统计数据
const getCommentStats = async () => {
  try {
    // 获取所有文章的评论数
    const allArticles = Array.isArray(articles.value) ? articles.value : []
    const articleUrls = allArticles.map(article => `/posts/${article.slug}`)
    
    // 添加自定义页面的评论路径
    const customUrls = siteConfig.twikoo.customCommentPaths || []
    const allUrls = [...articleUrls, ...customUrls]
    
    if (allUrls.length === 0) {
      commentStats.value = {
        total: 0,
        articleCount: 0
      }
      return
    }

    // 获取所有页面的评论数
    const commentsCount = await getCommentsCount(allUrls)
    
    // 计算总评论数
    const totalComments = commentsCount.reduce((sum, item) => sum + (item.count || 0), 0)
    
    // 计算有评论的文章数量
    const articlesWithComments = commentsCount.filter(item => item.count > 0).length
    
    commentStats.value = {
      total: totalComments,
      articleCount: articlesWithComments
    }
  } catch (err) {
    console.error('获取评论统计失败:', err)
    commentStats.value = {
      total: 0,
      articleCount: 0
    }
  }
}

// 获取说说统计数据
const getTalkStats = () => {
  const allTalks = Array.isArray(talks.value) ? talks.value : []
  const threeMonthsAgo = new Date()
  threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3)
  
  talkStats.value.total = allTalks.length
  talkStats.value.recent = allTalks.filter(talk => {
    const talkDate = new Date(talk.created_at)
    return talkDate >= threeMonthsAgo
  }).length
}



// 格式化数字显示
const formatNumber = (num) => {
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K'
  }
  return num.toString()
}

// 格式化日期显示
const formatDate = (dateStr) => {
  const date = new Date(dateStr)
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

// 打开文章
const openArticle = (slug) => {
  window.open(`${siteConfig.blogUrl}/posts/${slug}`, '_blank')
}



// 打开源页面
const openSource = (comment) => {
  if (comment.url.startsWith('/talks')) {
    window.open(`${siteConfig.blogUrl}/talks#${comment.id}`, '_blank')
  } else {
    window.open(`${siteConfig.blogUrl}/posts/${comment.articleSlug}#${comment.id}`, '_blank')
  }
}

// 加载数据
const loadData = async () => {
  loading.value = true
  try {
    await Promise.all([
      getList(),
      getTalks(),
      getVisitStats()
    ])
    
    calculateArticleStats()
    getTagStats()
    getTalkStats()
    await getCommentStats()
    await getTopArticles()
    await fetchRecentComments()
  } catch (error) {
    console.error('加载数据失败:', error)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadData()
})
</script>
