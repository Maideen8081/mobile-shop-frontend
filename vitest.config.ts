import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

// Unit and component tests run in jsdom. Kept separate from vite.config.ts so
// the React Compiler / Tailwind build plugins don't slow the test run.
export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    include: ['tests/**/*.test.{ts,tsx}'],
    setupFiles: ['tests/setup.ts'],
    restoreMocks: true,
    css: false,
  },
})
