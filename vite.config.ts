import { defineConfig } from 'vitest/config';
import { loadEnv } from 'vite';
import type { Plugin } from 'vite';
import react from '@vitejs/plugin-react';

const OG_IMAGE = '/og.png';

/**
 * Social-card tags that need an absolute URL. Crawlers (Twitter, Facebook,
 * Discord, Telegram) do not run JS and reject relative `og:image`, so the
 * origin comes from `VITE_SITE_URL` at build time. Without it the tags are
 * omitted and the page falls back to the static tags in index.html.
 */
function socialTags(siteUrl: string): Plugin {
  const origin = siteUrl.replace(/\/+$/, '');
  return {
    name: 'odin-portfolio:social-tags',
    transformIndexHtml() {
      if (origin === '') return [];
      const image = `${origin}${OG_IMAGE}`;
      return [
        { tag: 'meta', attrs: { property: 'og:url', content: `${origin}/` }, injectTo: 'head' },
        { tag: 'meta', attrs: { property: 'og:image', content: image }, injectTo: 'head' },
        { tag: 'meta', attrs: { property: 'og:image:type', content: 'image/png' }, injectTo: 'head' },
        { tag: 'meta', attrs: { property: 'og:image:width', content: '1200' }, injectTo: 'head' },
        { tag: 'meta', attrs: { property: 'og:image:height', content: '630' }, injectTo: 'head' },
        { tag: 'meta', attrs: { property: 'og:image:alt', content: 'ODIN•FUN Portfolio' }, injectTo: 'head' },
        { tag: 'meta', attrs: { name: 'twitter:image', content: image }, injectTo: 'head' },
      ];
    },
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', 'VITE_');
  return {
    plugins: [react(), socialTags(env.VITE_SITE_URL ?? '')],
    resolve: {
      dedupe: ['react', 'react-dom'],
    },
    build: {
      outDir: 'dist',
      emptyOutDir: true,
    },
    test: {
      environment: 'node',
      include: ['src/**/*.test.ts'],
    },
  };
});
