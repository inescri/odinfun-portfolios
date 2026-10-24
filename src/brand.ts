/**
 * Site copy shared by the app, the HTML head (vite.config.ts injects it) and
 * the README. scripts/og/card.html renders TAGLINE too but is static HTML, so
 * update it by hand and re-run scripts/og/render.sh.
 */
export const SITE_NAME = 'ODIN•FUN Portfolio';
export const TAGLINE = 'Every ODIN•FUN wallet. One total.';
export const DESCRIPTION = `${TAGLINE} Connect your Odin logins and see all holdings in one place.`;
