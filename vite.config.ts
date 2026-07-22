import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'
import VitePluginSvgSpritemap from '@spiriit/vite-plugin-svg-spritemap'
import { compilerOptions } from 'vue3-pixi'

const customCompilerOptions = {
  ...compilerOptions,
  isCustomElement: (tag: string) => {
    // Добавляем свой тег (регистронезависимо)
    if (tag === 'viewport' || tag === 'Viewport') {
      return true
    }
    // Если в оригинальном compilerOptions есть функция isCustomElement,
    // вызываем её для всех остальных тегов
    if (typeof compilerOptions.isCustomElement === 'function') {
      return compilerOptions.isCustomElement(tag)
    }
    return false
  },
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue({
      template: {
        compilerOptions: customCompilerOptions
      },

      // ...templateCompilerOptions
    }),
    vueDevTools(),
    VitePluginSvgSpritemap('./src/assets/icons/**/*.svg'),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    },
  },
  base: "/samosbor/map/",
  css: {
    preprocessorOptions: {
      scss: {
        additionalData: `@use "@/assets/scss/vars.scss";`
      }
    }
  },
  server: {
    watch: {
      usePolling: true
    }
  }
})
