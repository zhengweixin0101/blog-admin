export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  modules: [
    '@unocss/nuxt',
  ],
  runtimeConfig: {
    apiBase: process.env.API_BASE,
    public: {
      apiBase: process.env.API_BASE,
    }
  }
})
