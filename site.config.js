export const siteConfig = {
    // API 地址
    // 请确保结尾不带'/'
    apiUrl: 'https://blog.api.zhengweixin.top',
    blogUrl: 'https://zhengweixin.top',

    // Turnstile 人机验证配置
    // 在 Cloudflare Turnstile 获取 site key
    // 留空则不启用人机验证
    // 若后端配置了，前端没配置，会提示操作失败
    turnstileSiteKey: '0x4AAAAAACLEiecyeZZ77jfM',

    // Twikoo 配置（用于首页获取数据）
    twikoo: {
        // 环境ID
        envId: 'https://twikoo.api.zhengweixin.top',
        // 评论数是否包括回复
        includeReply: true,
        // 获取最新评论数量（最大：100）
        recentCommentsPageSize: 15,
        // 其他有评论的页面路径（用于计算评论总数）
        customCommentPaths: [
            '/talks'
        ]
    },

    // Umami 配置（用于首页获取数据）
    umami: {
        // Umami 地址
        url: 'https://statistics.zhengweixin.top',
        // 网站ID
        siteId: '7441ce23-3587-41b6-8919-e42932fc65d7',
        // Token
        token: 'Fp5LgLwc4z5dLEp89WzldmpJplRXrmgWb9cp93NowW8m1ENpPgDAOpyoY0ONEFFABOURznRM4KvlId0V0JpADgLhqqu92SdABb7omUWxP93rj3MPnwVmZbVFiyux4YbZYHXuZf7jbeZnWYRaXpDny/aBi/Bwb3a0GAXG0YwMtGYXqYbmQ12pKa6u8w9GeIBUjhe5+9fesrxG3YfBQxoxZhpAGucfCekSGMu5suVbNap7JqiS8lneNFpuelTHClillVDeSq7Cwf9O6GUoPvzfa3La8ox307y30qCMhvUEUXajaaYoxnu2dQq8sabPJ23JL41Fb3veJGplfTur/SOmS14avI+Xycb1GF2wVNp1QFPytUUz+5/EKORt1naFAjBLGExW',
        // 网站创建时间
        createTime: '2025-08-15T16:00:00.000Z'
    },

    // 图片压缩配置
    imageCompression: {
        // 是否启用
        enabled: true,
        // 压缩质量 (0-1)
        quality: 0.9,
        // 最大宽度
        maxWidth: 1920,
        // 最小文件阈值 (小于此大小的文件不压缩)
        minSize: 80 * 1024
    }
}