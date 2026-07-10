import { defineConfig, type Plugin, type ViteDevServer } from 'vite'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath, URL } from 'node:url'

/** public 目录与 postcss 配置不走模块 HMR，变更时触发整页刷新 */
function fullReloadOnChange(paths: string[]): Plugin {
  return {
    name: 'full-reload-on-change',
    configureServer(server: ViteDevServer) {
      const root = server.config.root
      const targets = paths.map((p) => `${root}/${p}`)

      for (const target of targets) {
        server.watcher.add(target)
      }

      server.watcher.on('change', (file) => {
        if (targets.some((target) => file === target)) {
          server.ws.send({ type: 'full-reload', path: '*' })
        }
      })
    },
  }
}

export default defineConfig({
  plugins: [
    vue(),
    fullReloadOnChange(['public/flexible.js', 'postcss.config.cjs']),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    host: '0.0.0.0',
    port: 5173,
    strictPort: true,
    hmr: {
      overlay: true,
    },
    watch: {
      usePolling: false,
    },
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
      '/uploads': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
})
