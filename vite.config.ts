import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  // Prevent Vite from obscuring Tauri rust errors
  clearScreen: false,
  server: {
    // Ensure the port stays fixed on 5173
    port: 5173,
    strictPort: true,
    // Tell Vite to ignore watching the Rust backend folder
    watch: {
      ignored: ["**/src-tauri/**"],
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
