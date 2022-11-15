import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import legacy from '@vitejs/plugin-legacy';

const isLegacy = !!process.env.IS_LEGACY_BUILD;

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    svelte(),
    isLegacy &&
      legacy({
        targets: ['Firefox <= 59', 'Chrome <= 61', 'not IE 11'],
        renderLegacyChunks: true,
      }),
  ],
  optimizeDeps: {
    include: ['dayjs/plugin/relativeTime.js'],
  },
  server: {
    port: 5000,
  },
});
