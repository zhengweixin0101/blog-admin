import { useSettings } from './useSettings.js'
import { useErrorHandler } from './useErrorHandler.js'

const { getConfig } = useSettings()
const { handleError } = useErrorHandler()

export function useAI() {
    // 获取模型列表
    async function getModels({ endpoint, apiKey }) {
        try {
            const response = await fetch(`${endpoint}/models`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${apiKey}`
                }
            })

            if (!response.ok) {
                const errorText = await response.text()
                throw new Error(`获取模型列表失败 (${response.status}): ${errorText}`)
            }

            const data = await response.json()
            return { success: true, data }
        } catch (error) {
            handleError(error, { showAlert: false })
            return { success: false, error: error.message }
        }
    }

    // 发送消息
    async function sendMessage({ messages, onProgress, stream = false, config: customConfig = null }) {
        try {
            // 如果没有传入自定义配置，则从数据库读取
            let config
            if (customConfig) {
                config = customConfig
            } else {
                const result = await getConfig('ai_config')
                if (!result.success || !result.data) {
                    throw new Error('AI服务未配置')
                }
                config = JSON.parse(result.data.value)
            }

            if (!config.enabled || !config.apiKey) {
                throw new Error('AI服务未启用')
            }

            if (!config.endpoint || !config.model) {
                throw new Error('请填写完整的AI配置信息')
            }

            const chatEndpoint = config.endpoint.endsWith('/chat/completions')
                ? config.endpoint
                : `${config.endpoint}/chat/completions`

            const response = await fetch(chatEndpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${config.apiKey}`
                },
                body: JSON.stringify({
                    model: config.model,
                    messages,
                    stream,
                    max_tokens: 4096
                })
            })

            if (!response.ok) {
                const errorText = await response.text()
                throw new Error(`请求失败 (${response.status}): ${errorText}`)
            }

            if (stream) {
                // 流式响应处理
                const reader = response.body.getReader()
                const decoder = new TextDecoder()
                let fullContent = ''

                while (true) {
                    const { done, value } = await reader.read()
                    if (done) break

                    const chunk = decoder.decode(value)
                    const lines = chunk.split('\n')

                    for (const line of lines) {
                        if (line.startsWith('data: ')) {
                            const data = line.slice(6)
                            if (data === '[DONE]') continue

                            try {
                                const parsed = JSON.parse(data)
                                const content = parsed.choices?.[0]?.delta?.content || ''
                                const reasoningContent = parsed.choices?.[0]?.delta?.reasoning_content || ''

                                if (content) {
                                    fullContent += content
                                    onProgress?.(content, false)
                                }
                                if (reasoningContent) {
                                    onProgress?.(reasoningContent, false, true)
                                }
                            } catch (e) {
                                // 忽略解析错误
                            }
                        }
                    }
                }

                onProgress?.('', true)
                return { success: true, content: fullContent }
            } else {
                // 非流式响应
                const data = await response.json()
                const content = data.choices?.[0]?.message?.content || ''
                return { success: true, content }
            }
        } catch (error) {
            handleError(error, { showAlert: false })
            return { success: false, error: error.message }
        }
    }

    return {
        getModels,
        sendMessage
    }
}
