export default defineNuxtConfig({
  devtools: { enabled: true },
  compatibilityDate: "2026-03-05",
  ssr: true,
  modules: ["@vite-pwa/nuxt"],
  css: ["primeicons/primeicons.css", "~/assets/css/main.css"],
  build: {
    transpile: ["primevue"]
  },
  runtimeConfig: {
    public: {
      apiBase: process.env.NUXT_PUBLIC_API_BASE ?? "http://127.0.0.1:8000"
    }
  },
  pwa: {
    registerType: "autoUpdate",
    devOptions: {
      enabled: false
    },
    manifest: {
      name: "Simple Multi Chat",
      short_name: "SMChat",
      description: "Простой multi-chat на Nuxt + Socket.IO",
      theme_color: "#17202a",
      background_color: "#f6f5f3",
      display: "standalone",
      icons: [
        {
          src: "/icon.svg",
          sizes: "512x512",
          type: "image/svg+xml",
          purpose: "any maskable"
        }
      ]
    },
    workbox: {
      globPatterns: ["**/*.{js,css,html,png,svg,ico}"]
    },
    client: {
      installPrompt: true,
      periodicSyncForUpdates: 3600
    }
  }
});
