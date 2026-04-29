import sitemap from '@astrojs/sitemap';
import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://atrium.earth',
  output: 'static',
  integrations: [sitemap()],
  vite: {
    build: {
      chunkSizeWarningLimit: 1100,
    },
  },
});
