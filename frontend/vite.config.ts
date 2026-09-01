import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";

export default defineConfig({
  plugins: [react(), tailwindcss()],
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
