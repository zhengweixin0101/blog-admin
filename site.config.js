export const siteConfig = {
    apiUrl: 'http://localhost:8000',
    blogUrl: 'https://zhengweixin.top',

    // AI 摘要服务地址
    // 我使用的是n8n调用gemini的接口
    // 你可以自行修改源代码或参考我的流程部署n8n
    // 其实可以直接调用APi的，但是最近接触了n8n就顺便用一下
    aiSummary: 'https://workflow.zhengweixin.top/webhook/d7684229-748f-4080-ac72-68e62b15b730',
    
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