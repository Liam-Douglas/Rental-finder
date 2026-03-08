import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      workbox: {
        globPatterns: ["**/*.{js,css,html,ico,png,svg,woff2}"],
        runtimeCaching: [
          {
            urlPattern: /^http:\/\/localhost:8000\/api\//,
            handler: "NetworkFirst",
            options: {
              cacheName: "api-cache",
              expiration: { maxEntries: 200, maxAgeSeconds: 86400 },
            },
          },
        ],
      },
      manifest: {
        name: "RentSweep",
        short_name: "RentSweep",
        description: "Canberra rental listings aggregator",
        theme_color: "#6366f1",
        background_color: "#0f172a",
        display: "standalone",
        icons: [
          { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
          { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
        ],
      },
    }),
  ],
  server: {
    proxy: {
      "/api": { target: "http://localhost:8000", changeOrigin: true },
    },
  },
});
