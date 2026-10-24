import { RUNES_PATHS, RUNES_VIEWBOX, WORDMARK_PATHS, WORDMARK_VIEWBOX } from '../components/brand/paths';
import type { ShareCardData, ShareCardRow } from './shareCard';

/** Open Graph card size; the canvas is drawn at `SCALE`× for crisp text. */
export const CARD_WIDTH = 1200;
export const CARD_HEIGHT = 630;
const SCALE = 2;

/** Mirrors the tokens in styles.css; canvas cannot read CSS variables. */
const C = {
  bg: '#0b0d11',
  surface: '#13161b',
  border: 'rgba(255, 255, 255, 0.08)',
  text: '#f5f7fa',
  muted: '#9aa3ad',
  subtle: '#6b7280',
  accent: '#00ffff',
  accentDim: '#0bc1c1',
  runes: '#0ff0fc',
  success: '#22c55e',
  danger: '#f05252',
  btc: '#f7931a',
} as const;

const FONT =
  "ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif";
const MONO = 'ui-monospace, SFMono-Regular, Menlo, monospace';

const PAD = 64;
const ROW_H = 68;
const IMG = 44;
const IMAGE_TIMEOUT_MS = 2500;

export interface RenderOptions {
  /** Resolves a token id to an image URL; return null to skip the network. */
  tokenImageUrl?: (tokenId: string) => string | null;
  /** Shown bottom-right, e.g. the deployed host. */
  footerText?: string;
}

/**
 * Load an image with CORS enabled so drawing it never taints the canvas.
 * Resolves null on error or timeout; the caller draws a fallback.
 */
/** Loaded token images by URL, so re-renders (toggles, polls) do not refetch. Failures are not kept. */
const imageCache = new Map<string, Promise<HTMLImageElement | null>>();

function loadImage(url: string): Promise<HTMLImageElement | null> {
  const cached = imageCache.get(url);
  if (cached !== undefined) return cached;
  const pending = fetchImage(url).then((img) => {
    if (img === null) imageCache.delete(url);
    return img;
  });
  imageCache.set(url, pending);
  return pending;
}

function fetchImage(url: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const img = new Image();
    const timer = setTimeout(() => resolve(null), IMAGE_TIMEOUT_MS);
    img.crossOrigin = 'anonymous';
    img.decoding = 'async';
    img.onload = () => {
      clearTimeout(timer);
      resolve(img);
    };
    img.onerror = () => {
      clearTimeout(timer);
      resolve(null);
    };
    img.src = url;
  });
}

function font(weight: number, px: number, family: string = FONT): string {
  return `${weight} ${px}px ${family}`;
}

function setLetterSpacing(ctx: CanvasRenderingContext2D, value: string): void {
  if ('letterSpacing' in ctx) ctx.letterSpacing = value;
}

/** Draw SVG path data scaled to `width`, top-left at (x, y). */
function drawPaths(
  ctx: CanvasRenderingContext2D,
  paths: readonly string[],
  box: { width: number; height: number },
  x: number,
  y: number,
  width: number,
  color: string,
): number {
  const k = width / box.width;
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(k, k);
  ctx.fillStyle = color;
  for (const d of paths) ctx.fill(new Path2D(d));
  ctx.restore();
  return box.height * k;
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
): void {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
}

/** Truncate with an ellipsis so text never overflows `maxWidth`. */
function fitText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string {
  if (ctx.measureText(text).width <= maxWidth) return text;
  let s = text;
  while (s.length > 1 && ctx.measureText(`${s}…`).width > maxWidth) s = s.slice(0, -1);
  return `${s}…`;
}

function drawBackground(ctx: CanvasRenderingContext2D): void {
  ctx.fillStyle = C.bg;
  ctx.fillRect(0, 0, CARD_WIDTH, CARD_HEIGHT);

  // Faint grid, faded towards the edges.
  ctx.save();
  const fade = ctx.createRadialGradient(
    CARD_WIDTH / 2,
    CARD_HEIGHT / 2,
    0,
    CARD_WIDTH / 2,
    CARD_HEIGHT / 2,
    CARD_WIDTH * 0.6,
  );
  fade.addColorStop(0, 'rgba(255,255,255,0.045)');
  fade.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.strokeStyle = fade;
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let x = 0.5; x < CARD_WIDTH; x += 60) {
    ctx.moveTo(x, 0);
    ctx.lineTo(x, CARD_HEIGHT);
  }
  for (let y = 0.5; y < CARD_HEIGHT; y += 60) {
    ctx.moveTo(0, y);
    ctx.lineTo(CARD_WIDTH, y);
  }
  ctx.stroke();
  ctx.restore();

  // Cyan glow behind the total.
  const glow = ctx.createRadialGradient(300, 330, 0, 300, 330, 420);
  glow.addColorStop(0, 'rgba(0,255,255,0.10)');
  glow.addColorStop(1, 'rgba(0,255,255,0)');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, CARD_WIDTH, CARD_HEIGHT);

  // Bottom accent bar, as on the static card.
  const bar = ctx.createLinearGradient(0, 0, CARD_WIDTH, 0);
  bar.addColorStop(0, C.accent);
  bar.addColorStop(1, C.accentDim);
  ctx.fillStyle = bar;
  ctx.fillRect(0, CARD_HEIGHT - 6, CARD_WIDTH, 6);
}

function drawHeader(ctx: CanvasRenderingContext2D, data: ShareCardData): void {
  const wordW = 300;
  const wordH = drawPaths(ctx, WORDMARK_PATHS, WORDMARK_VIEWBOX, PAD, PAD, wordW, C.text);
  drawPaths(ctx, RUNES_PATHS, RUNES_VIEWBOX, PAD, PAD + wordH + 14, 180, C.runes);

  ctx.textBaseline = 'alphabetic';
  ctx.font = font(600, 18);
  setLetterSpacing(ctx, '0.28em');
  ctx.fillStyle = C.accent;
  ctx.fillText('PORTFOLIO', PAD + wordW + 28, PAD + wordH - 6);
  setLetterSpacing(ctx, '0px');

  ctx.textAlign = 'right';
  ctx.font = font(500, 18);
  ctx.fillStyle = C.subtle;
  ctx.fillText(data.dateLabel, CARD_WIDTH - PAD, PAD + wordH - 6);
  ctx.textAlign = 'left';
}

function drawTotal(ctx: CanvasRenderingContext2D, data: ShareCardData): void {
  let y = 236;
  ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = C.muted;
  ctx.font = font(500, 22);
  ctx.fillText('Total portfolio value', PAD, y);

  y += 78;
  ctx.fillStyle = data.hidden ? C.muted : C.text;
  ctx.font = font(800, data.hidden ? 48 : 72, MONO);
  const total = fitText(ctx, data.totalLabel, 470);
  ctx.fillText(total, PAD, y);
  const totalW = ctx.measureText(total).width;
  ctx.fillStyle = C.muted;
  ctx.font = font(600, 28);
  ctx.fillText('BTC', PAD + totalW + 16, y);

  if (data.usdLabel !== null) {
    y += 50;
    ctx.fillStyle = C.muted;
    ctx.font = font(500, 34);
    ctx.fillText(fitText(ctx, data.usdLabel, 520), PAD, y);
  }

  if (data.pnlLabel !== null) {
    y += 44;
    ctx.fillStyle = data.pnlUp ? C.success : C.danger;
    ctx.font = font(600, 24);
    const label = `${data.pnlUp ? '▲' : '▼'} ${data.pnlLabel}`;
    ctx.fillText(label, PAD, y);
    const labelW = ctx.measureText(label).width; // measure before switching font
    ctx.fillStyle = C.subtle;
    ctx.font = font(500, 20);
    ctx.fillText(data.pnlKind === 'pnl' ? 'unrealized PNL' : '24h', PAD + labelW + 14, y);
  }

  // Stats line.
  y = 486;
  ctx.font = font(500, 20);
  const parts = [
    `${data.accountCount} account${data.accountCount === 1 ? '' : 's'}`,
    `${data.tokenCount} token${data.tokenCount === 1 ? '' : 's'}`,
  ];
  if (data.btcUsdLabel !== null) parts.push(`BTC ${data.btcUsdLabel}`);
  let x = PAD;
  parts.forEach((p, i) => {
    if (i > 0) {
      ctx.fillStyle = C.subtle;
      ctx.fillText('·', x, y);
      x += ctx.measureText('·').width + 14;
    }
    ctx.fillStyle = C.muted;
    ctx.fillText(p, x, y);
    x += ctx.measureText(p).width + 14;
  });

  if (data.hidden) {
    y += 34;
    ctx.fillStyle = C.subtle;
    ctx.font = font(500, 17);
    ctx.fillText('Amounts hidden', PAD, y);
  }
}

function drawTokenFallback(
  ctx: CanvasRenderingContext2D,
  row: ShareCardRow,
  x: number,
  y: number,
): void {
  const isBtc = row.tokenId === 'btc';
  ctx.fillStyle = isBtc ? C.btc : '#2a2f3a';
  ctx.beginPath();
  ctx.arc(x + IMG / 2, y + IMG / 2, IMG / 2, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = isBtc ? '#18181b' : C.text;
  ctx.font = font(700, isBtc ? 24 : 15);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(isBtc ? '₿' : row.ticker.slice(0, 2).toUpperCase(), x + IMG / 2, y + IMG / 2 + 1);
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
}

function drawTokenImage(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  x: number,
  y: number,
): void {
  ctx.save();
  ctx.beginPath();
  ctx.arc(x + IMG / 2, y + IMG / 2, IMG / 2, 0, Math.PI * 2);
  ctx.clip();
  ctx.drawImage(img, x, y, IMG, IMG);
  ctx.restore();
}

function drawHoldings(
  ctx: CanvasRenderingContext2D,
  data: ShareCardData,
  images: ReadonlyMap<string, HTMLImageElement | null>,
): void {
  const x0 = 640;
  const w = CARD_WIDTH - PAD - x0;
  const top = 168;

  // Panel.
  const panelH = 30 + Math.max(1, data.rows.length) * ROW_H + (data.moreCount > 0 ? 34 : 10);
  roundRect(ctx, x0, top, w, panelH, 16);
  ctx.fillStyle = C.surface;
  ctx.fill();
  ctx.strokeStyle = C.border;
  ctx.lineWidth = 1;
  ctx.stroke();

  const pad = 24;
  const x = x0 + pad;
  let y = top + 30;
  ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = C.muted;
  ctx.font = font(600, 15);
  setLetterSpacing(ctx, '0.12em');
  ctx.fillText('TOP HOLDINGS', x, y - 4);
  setLetterSpacing(ctx, '0px');

  if (data.rows.length === 0) {
    ctx.fillStyle = C.subtle;
    ctx.font = font(500, 20);
    ctx.fillText('No holdings yet', x, y + 44);
    return;
  }

  const right = x0 + w - pad;
  for (const row of data.rows) {
    const rowTop = y + 8;
    const img = images.get(row.tokenId) ?? null;
    if (img !== null) drawTokenImage(ctx, img, x, rowTop + 2);
    else drawTokenFallback(ctx, row, x, rowTop + 2);

    const textX = x + IMG + 16;
    ctx.fillStyle = C.text;
    ctx.font = font(700, 22);
    ctx.fillText(fitText(ctx, row.ticker, 150), textX, rowTop + 22);

    ctx.fillStyle = C.subtle;
    ctx.font = font(500, 16);
    let sub = `${row.sharePct.toFixed(1)}% of total`;
    if (row.pnlLabel !== null) sub += '   ';
    ctx.fillText(sub, textX, rowTop + 44);
    if (row.pnlLabel !== null) {
      // Measure with the font it was drawn in, before switching to the gain font.
      const gainX = textX + ctx.measureText(sub).width;
      const up = !row.pnlLabel.startsWith('-');
      ctx.fillStyle = up ? C.success : C.danger;
      ctx.font = font(600, 16);
      const gain = `${up ? '▲' : '▼'} ${row.pnlLabel}`;
      ctx.fillText(gain, gainX, rowTop + 44);
      // A row falling back to the 24h move says so when the card is otherwise PNL.
      if (row.pnlKind === '24h' && data.pnlKind === 'pnl') {
        const gainW = ctx.measureText(gain).width;
        ctx.fillStyle = C.subtle;
        ctx.font = font(500, 13);
        ctx.fillText('24h', gainX + gainW + 6, rowTop + 44);
      }
    }

    ctx.textAlign = 'right';
    ctx.fillStyle = C.text;
    ctx.font = font(700, 22, MONO);
    ctx.fillText(`${row.valueLabel} BTC`, right, rowTop + 22);
    if (row.usdLabel !== null) {
      ctx.fillStyle = C.muted;
      ctx.font = font(500, 16);
      ctx.fillText(row.usdLabel, right, rowTop + 44);
    }
    ctx.textAlign = 'left';

    y += ROW_H;
    if (row !== data.rows[data.rows.length - 1]) {
      ctx.strokeStyle = C.border;
      ctx.beginPath();
      ctx.moveTo(x, y + 4.5);
      ctx.lineTo(right, y + 4.5);
      ctx.stroke();
    }
  }

  if (data.moreCount > 0) {
    ctx.fillStyle = C.subtle;
    ctx.font = font(500, 16);
    ctx.fillText(`+${data.moreCount} more`, x, y + 20);
  }
}

function drawFooter(ctx: CanvasRenderingContext2D, text: string | undefined): void {
  if (text === undefined || text === '') return;
  ctx.textAlign = 'right';
  ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = C.subtle;
  ctx.font = font(500, 17);
  ctx.fillText(text, CARD_WIDTH - PAD, CARD_HEIGHT - 28);
  ctx.textAlign = 'left';
}

/**
 * Render the card to a PNG blob entirely in the browser. Nothing leaves the
 * device except the public token-image fetches from the Odin CDN.
 */
export async function renderShareCard(data: ShareCardData, opts: RenderOptions = {}): Promise<Blob> {
  const canvas = document.createElement('canvas');
  canvas.width = CARD_WIDTH * SCALE;
  canvas.height = CARD_HEIGHT * SCALE;
  const ctx = canvas.getContext('2d');
  if (ctx === null) throw new Error('Canvas 2D is not available in this browser.');

  const urlFor = opts.tokenImageUrl ?? (() => null);
  const images = new Map<string, HTMLImageElement | null>();
  await Promise.all(
    data.rows.map(async (row) => {
      if (row.tokenId === 'btc') return;
      const url = urlFor(row.tokenId);
      images.set(row.tokenId, url === null ? null : await loadImage(url));
    }),
  );

  ctx.scale(SCALE, SCALE);
  drawBackground(ctx);
  drawHeader(ctx, data);
  drawTotal(ctx, data);
  drawHoldings(ctx, data, images);
  drawFooter(ctx, opts.footerText);

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob === null) reject(new Error('Could not encode the card as PNG.'));
      else resolve(blob);
    }, 'image/png');
  });
}
