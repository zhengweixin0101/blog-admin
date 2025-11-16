export const siteConfig = {
    apiUrl: 'https://blog.api.zhengweixin.top',
    blogUrl: 'https://zhengweixin.top',

    // AI 摘要服务地址
    // 我使用的是n8n调用gemini的接口
    // 你可以自行修改源代码或参考我的流程部署n8n
    aiSummary: 'https://workflow.zhengweixin.top/webhook/dd978489-1e8d-42ad-b957-813e37cad0dc',
    
    // 图片压缩配置
    imageCompression: {
        // 是否启用
        enabled: true,
        // 压缩质量 (0-1)
        quality: 0.85,
        // 最大宽度
        maxWidth: 1920,
        // 最小文件阈值 (小于此大小的文件不压缩)
        minSize: 80 * 1024
    }
}