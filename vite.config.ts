import { defineConfig } from 'vitest/config';
import { loadEnv } from 'vite';
import type { HtmlTagDescriptor, Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import { DESCRIPTION, SITE_NAME } from './src/brand';

const OG_IMAGE = 'og.png';

/**
 * Head tags built from src/brand.ts so the title, description and social
 * cards share one copy. Crawlers (Twitter, Facebook, Discord, Telegram) do
 * not run JS and reject a relative `og:image`, so the image/url tags need the
 * origin from `VITE_SITE_URL`. Without it those tags are omitted and the
 * Twitter card degrades to a text-only `summary`. Runs in dev and build.
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
      const copy: HtmlTagDescriptor[] = [
        { tag: 'title', children: SITE_NAME, injectTo: 'head' },
        { tag: 'meta', attrs: { name: 'description', content: DESCRIPTION }, injectTo: 'head' },
        { tag: 'meta', attrs: { property: 'og:type', content: 'website' }, injectTo: 'head' },
        { tag: 'meta', attrs: { property: 'og:site_name', content: SITE_NAME }, injectTo: 'head' },
        { tag: 'meta', attrs: { property: 'og:title', content: SITE_NAME }, injectTo: 'head' },
        { tag: 'meta', attrs: { property: 'og:description', content: DESCRIPTION }, injectTo: 'head' },
      ];
      if (origin === null) {
        return [...copy, { tag: 'meta', attrs: { name: 'twitter:card', content: 'summary' }, injectTo: 'head' }];
      }
      const url = `${origin}${base}`;
      const image = `${url}${OG_IMAGE}`;
      return [
        ...copy,
        { tag: 'meta', attrs: { property: 'og:url', content: url }, injectTo: 'head' },
        { tag: 'meta', attrs: { property: 'og:image', content: image }, injectTo: 'head' },
        { tag: 'meta', attrs: { property: 'og:image:type', content: 'image/png' }, injectTo: 'head' },
        { tag: 'meta', attrs: { property: 'og:image:width', content: '1200' }, injectTo: 'head' },
        { tag: 'meta', attrs: { property: 'og:image:height', content: '630' }, injectTo: 'head' },
        { tag: 'meta', attrs: { property: 'og:image:alt', content: SITE_NAME }, injectTo: 'head' },
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
