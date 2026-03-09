import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

const isCapacitor = process.env.BUILD_TARGET === "capacitor";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const apiBase = env.VITE_API_URL || "http://localhost:8000";

  return {
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
  // Use relative base for Capacitor (file:// protocol), absolute for web
  base: isCapacitor ? "./" : "/",
  server: {
    proxy: {
      "/api": { target: apiBase, changeOrigin: true },
    },
  },
  }; // end return
}); // end defineConfig
