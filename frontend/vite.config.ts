import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { VitePWA } from "vite-plugin-pwa";
import path from "path";

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: "autoUpdate",
      injectRegister: "script-defer",
      manifest: {
        name: "Conta Junto",
        short_name: "ContaJunto",
        description: "Finanças da família, juntos.",
        lang: "pt-BR",
        theme_color: "#6d40c9",
        background_color: "#f3f2f7",
        display: "standalone",
        start_url: "/",
        scope: "/",
        // PNGs em public/, gerados de public/logo.svg.
        // Regenerar após trocar a logo: npx pwa-assets-generator
        icons: [
          { src: "pwa-64x64.png", sizes: "64x64", type: "image/png" },
          { src: "pwa-192x192.png", sizes: "192x192", type: "image/png" },
          { src: "pwa-512x512.png", sizes: "512x512", type: "image/png" },
          {
            src: "maskable-icon-512x512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
        ],
      },
      workbox: {
        inlineWorkboxRuntime: true,
        navigateFallback: "index.html",
        navigateFallbackDenylist: [/^\/api/],
        globPatterns: ["**/*.{js,css,html,ico,png,svg,woff2}"],
      },
    }),
  ],
  server: {
    port: 5173,
    // dev: encaminha /api pro backend em :3333 -> mesma origem que produção,
    // sem CORS, e o cookie httpOnly é first-party também no dev
    proxy: { "/api": "http://localhost:3333" },
  },
  resolve: {
    alias: { "@": path.resolve(__dirname, "./src") },
  },
});
