import { defineConfig } from "vite"
import vue from "@vitejs/plugin-vue"
import gj from "./gj"

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue(), gj()],
})
