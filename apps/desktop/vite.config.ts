import { defineConfig } from 'vite'
import path from 'node:path'
import electron from 'vite-plugin-electron/simple'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// Electron launch is skipped in WSL (bun produces Windows paths that Linux Node.js can't spawn).
// Set SKIP_ELECTRON=0 to force-enable on WSL, or set SKIP_ELECTRON=1 to disable on Windows.
const skipElectron = process.env.SKIP_ELECTRON === '1' || !!process.env.WSL_DISTRO_NAME || !!process.env.WSL_INTEROP

export default defineConfig({
  plugins: [
    react(),
    ...(skipElectron ? [] : [electron({
      main: {
        entry: 'electron/main.ts',
        vite: {
          build: {
            lib: {
              // Force CJS: native modules like uiohook-napi use bare `__dirname`,
              // which is undefined in ESM scope. The plugin auto-picks ESM when
              // package.json has "type": "module", so we override here.
              formats: ['cjs'],
              fileName: () => '[name].cjs',
            },
            rollupOptions: {
              // uiohook-napi ships a native prebuild that node-gyp-build loads
              // at runtime via `require('.node')`. If we bundle node-gyp-build
              // its inlined `Ze` thrower can't load the prebuild, so we keep
              // these external and let Electron's require resolve them.
              external: [
                'uiohook-napi',
                'node-gyp-build',
                'node-gyp-build-path',
              ],
            },
          },
        },
      },
      preload: {
        input: path.join(__dirname, 'electron/preload.ts'),
      },
      renderer: process.env.NODE_ENV === 'test'
        ? undefined
        : {},
    })]),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
})
