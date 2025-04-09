// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2024-11-01',
  devtools: { enabled: true },
  modules: [
    '@nuxtjs/tailwindcss',
    '@pinia/nuxt'
  ],
  css: [
    '~/assets/css/main.css'
  ],
  runtimeConfig: {
    openaiApiKey: process.env.OPENAI_API_KEY,
    apiToken: process.env.API_TOKEN || 'sk-1234567890',
    public: {
      apiBaseUrl: process.env.API_BASE_URL || '/api'
    }
  },
  app: {
    head: {
      title: 'CodieEditor',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'description', content: 'CodieEditor AI (Beta)' }
      ]
    }
  }
})
