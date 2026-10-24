import { defineConfig } from 'vitest/config';
import { loadEnv } from 'vite';
import type { Plugin } from 'vite';
import react from '@vitejs/plugin-react';

const OG_IMAGE = 'og.png';

/**
 * Social-card tags that need an absolute URL. Crawlers (Twitter, Facebook,
 * Discord, Telegram) do not run JS and reject relative `og:image`, so the
 * origin comes from `VITE_SITE_URL`. Without it the image tags are omitted,
 * the page falls back to the static tags in index.html and the Twitter card
 * degrades to a text-only `summary`. Runs in `vite dev` and `vite build`.
 */
function socialTags(siteUrl: string): Plugin {
  const origin = siteOrigin(siteUrl);
  let base = '/';
  return {
    name: 'odin-portfolio:social-tags',
    configResolved(config) {
      // Vite normalises a path base to leading + trailing slash. A full-URL or
      // relative base cannot be joined onto the origin, so fall back to '/'.
      base = config.base.startsWith('/') ? config.base : '/';
    },
    transformIndexHtml() {
      if (origin === null) {
        return [{ tag: 'meta', attrs: { name: 'twitter:card', content: 'summary' }, injectTo: 'head' }];
      }
      const url = `${origin}${base}`;
      const image = `${url}${OG_IMAGE}`;
      return [
        { tag: 'meta', attrs: { property: 'og:url', content: url }, injectTo: 'head' },
        { tag: 'meta', attrs: { property: 'og:image', content: image }, injectTo: 'head' },
        { tag: 'meta', attrs: { property: 'og:image:type', content: 'image/png' }, injectTo: 'head' },
        { tag: 'meta', attrs: { property: 'og:image:width', content: '1200' }, injectTo: 'head' },
        { tag: 'meta', attrs: { property: 'og:image:height', content: '630' }, injectTo: 'head' },
        { tag: 'meta', attrs: { property: 'og:image:alt', content: 'ODIN•FUN Portfolio' }, injectTo: 'head' },
        { tag: 'meta', attrs: { name: 'twitter:card', content: 'summary_large_image' }, injectTo: 'head' },
        { tag: 'meta', attrs: { name: 'twitter:image', content: image }, injectTo: 'head' },
      ];
    },
  };
}

/** Absolute http(s) origin from `VITE_SITE_URL`, or null when unset. Throws on a malformed value. */
function siteOrigin(siteUrl: string): string | null {
  const value = siteUrl.trim();
  if (value === '') return null;
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new Error(`VITE_SITE_URL must be an absolute http(s) URL, got "${value}"`);
  }
  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    throw new Error(`VITE_SITE_URL must use http or https, got "${value}"`);
  }
  return url.origin;
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
