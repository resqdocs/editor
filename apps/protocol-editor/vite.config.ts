import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'
import { fileURLToPath, URL } from 'node:url'
import { readFileSync } from 'node:fs'
import { execSync } from 'node:child_process'

// Build-Kennung für „deployt vs. aktuell"-Prüfung (analog __APP_BUILD_ID__ in pico-pwa):
// Editor-Version + Git-Commit (Best-Effort; 'nogit', falls außerhalb eines Checkouts gebaut)
// + Build-Zeitpunkt. Wird als globales __BUILD_ID__ injiziert und dezent in der UI angezeigt,
// damit der ausgelieferte Stand per curl-grep UND mit bloßem Auge identifizierbar ist.
const pkg = JSON.parse(readFileSync(fileURLToPath(new URL('./package.json', import.meta.url)), 'utf-8'))
function gitCommit(): string {
  try {
    return execSync('git rev-parse --short HEAD', { cwd: fileURLToPath(new URL('.', import.meta.url)) })
      .toString()
      .trim()
  } catch {
    return 'nogit'
  }
}
const BUILD_ID = `${pkg.version}+${gitCommit()}+${new Date().toISOString()}`

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue(), tailwindcss()],
  define: {
    __BUILD_ID__: JSON.stringify(BUILD_ID),
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      // shared, platform-neutral protocol logic (renderer/runtime/creator/...) — the SAME
      // @resqdocs/protocol-core package the app uses; alias points straight at the source
      // dir (no build step), matching apps/pico-pwa.
      '@resqdocs/protocol-core': fileURLToPath(new URL('../../packages/shared', import.meta.url)),
      // canonical, CI-validated protocol seeds (single source of truth, shared with the app)
      '@protocols': fileURLToPath(new URL('../../protocols', import.meta.url)),
    },
  },
  server: {
    // allow the dev server to read the canonical seed outside the app root
    fs: { allow: [fileURLToPath(new URL('../../', import.meta.url))] },
  },
})
