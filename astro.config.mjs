// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import vercel from '@astrojs/vercel';
import sitemap from '@astrojs/sitemap';

// https://astro.build/config
export default defineConfig({
  site: 'https://www.mkbtechgids.nl',
  output: 'server',
  security: {
    checkOrigin: false
  },
  integrations: [
    sitemap({
      // Keep noindex stub pages out of the sitemap so Google focuses on NIS2.
      filter: (page) =>
        !['/crm/', '/ai-tools/', '/ai-governance/'].some((p) => page.endsWith(p)),
    }),
  ],
  vite: {
    plugins: [tailwindcss()]
  },
  adapter: vercel({
    webAnalytics: { enabled: true }
  })
});
