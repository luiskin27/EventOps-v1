import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    // PWA: гость может «установить» EventOps на телефон как приложение
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["icon.svg"],
      manifest: {
        name: "EventOps",
        short_name: "EventOps",
        description: "Программа, бейдж и оплата вашего мероприятия",
        lang: "ru",
        start_url: "/",
        display: "standalone",
        background_color: "#f7f9f8",
        theme_color: "#1f4d3a",
        icons: [
          { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
          { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
          { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
        ],
      },
      workbox: {
        // API не кэшируем — данные всегда свежие
        navigateFallbackDenylist: [/^\/api/, /^\/admin/],
      },
    }),
  ],
  server: {
    watch: { usePolling: true },
  },
});
