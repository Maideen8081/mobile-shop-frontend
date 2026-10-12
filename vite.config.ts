import { defineConfig, loadEnv } from 'vite'
import react, { reactCompilerPreset } from '@vitejs/plugin-react'
import babel from '@rolldown/plugin-babel'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const apiTarget = (env.VITE_API_BASE_URL || 'http://127.0.0.1:8000').replace(/\/$/, '')

  return {
    build: {
      chunkSizeWarningLimit: 3000,
    },
    plugins: [
      tailwindcss(),
      react(),
      babel({ presets: [reactCompilerPreset()] }),
    ],
    // In dev the API client calls same-origin /api/* and Vite forwards it to
    // the backend. Session/CSRF cookies then belong to localhost (readable by
    // the app), and the backend sees its own origin, so CSRF checks pass
    // without listing localhost in the server's CSRF_TRUSTED_ORIGINS.
    server: {
      proxy: {
        '/api': {
          target: apiTarget,
          changeOrigin: true,
          secure: true,
          configure: (proxy) => {
            proxy.on('proxyReq', (proxyReq) => {
              if (proxyReq.getHeader('origin')) proxyReq.setHeader('origin', apiTarget)
              if (proxyReq.getHeader('referer')) proxyReq.setHeader('referer', `${apiTarget}/`)
            })
          },
        },
      },
    },
  }
})
