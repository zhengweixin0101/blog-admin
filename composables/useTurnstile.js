import { ref } from 'vue'
import { siteConfig } from '@/site.config.js'

const TURNSTILE_SITE_KEY = siteConfig.turnstileSiteKey || ''

const turnstileToken = ref('')
const turnstileWidgetId = ref(null)

export function useTurnstile() {
  const renderTurnstile = async (container) => {
    if (!window.turnstile || !TURNSTILE_SITE_KEY) {
      console.warn('Turnstile not loaded or site key not configured')
      return null
    }

    if (!container) {
      console.error('Container element is required')
      return null
    }

    try {
      const widgetId = window.turnstile.render(container, {
        sitekey: TURNSTILE_SITE_KEY,
        callback: (token) => {
          turnstileToken.value = token
        },
        'error-callback': () => {
          turnstileToken.value = ''
        },
        'expired-callback': () => {
          turnstileToken.value = ''
        }
      })
      turnstileWidgetId.value = widgetId
      return widgetId
    } catch (error) {
      console.error('Failed to render Turnstile:', error)
      return null
    }
  }

  const resetTurnstile = () => {
    if (turnstileWidgetId.value && window.turnstile) {
      window.turnstile.reset(turnstileWidgetId.value)
      turnstileToken.value = ''
    }
  }

  const getTurnstileToken = () => turnstileToken.value

  const hasValidToken = () => {
    return !!turnstileToken.value && turnstileToken.value.length > 0
  }

  const waitForTurnstileLoad = (timeout = 10000) => {
    return new Promise((resolve, reject) => {
      if (window.turnstile) {
        resolve(true)
        return
      }

      const startTime = Date.now()
      const checkInterval = setInterval(() => {
        if (window.turnstile) {
          clearInterval(checkInterval)
          resolve(true)
        } else if (Date.now() - startTime > timeout) {
          clearInterval(checkInterval)
          reject(new Error('Turnstile failed to load'))
        }
      }, 100)
    })
  }

  return {
    turnstileToken,
    renderTurnstile,
    resetTurnstile,
    getTurnstileToken,
    hasValidToken,
    waitForTurnstileLoad,
    turnstileSiteKey: TURNSTILE_SITE_KEY
  }
}
