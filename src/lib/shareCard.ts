import type { PortfolioSummary } from './aggregate';
import { formatBtc, formatUsd, msatsToUsd, priceChangePct } from './value';

/** One holding row on the share card. */
export interface ShareCardRow {
  tokenId: string;
  ticker: string;
  /** BTC value, already formatted (or masked). */
  valueLabel: string;
  /** USD value, formatted, masked, or null when no rate is known. */
  usdLabel: string | null;
  /** Share of total portfolio value, 0–100 with two decimals. */
  sharePct: number;
  /** 24h price change in percent; null when unknown (always for BTC). */
  changePct: number | null;
}

/** Everything the renderer needs; no bigint, no DOM. */
export interface ShareCardData {
  totalLabel: string;
  usdLabel: string | null;
  btcUsdLabel: string | null;
  accountCount: number;
  tokenCount: number;
  rows: ShareCardRow[];
  /** Tokens beyond `rows`, for a "+N more" line. */
  moreCount: number;
  dateLabel: string;
  hidden: boolean;
}

export interface ShareCardOptions {
  /** Unix ms; defaults to `Date.now()`. */
  now?: number;
  /** Replace every amount with a mask so the card can be posted without doxxing size. */
  hideAmounts?: boolean;
  /** Holdings to list (default 5). */
  maxRows?: number;
  /** IANA zone for the date label; defaults to the browser's. */
  timeZone?: string;
}

export const AMOUNT_MASK = '••••';
const DEFAULT_ROWS = 5;

/** `Oct 24, 2026, 09:35` in the given zone. */
export function formatDateLabel(now: number, timeZone?: string): string {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone,
  }).format(new Date(now));
}

/** Integer-safe percentage of `part` in `whole`, two decimals. */
export function sharePercent(part: bigint, whole: bigint): number {
  if (whole <= 0n || part <= 0n) return 0;
  return Number((part * 10_000n) / whole) / 100;
}

/**
 * Pure: pick what goes on the card. Holdings are ordered by value (BTC is not
 * pinned here, unlike the dashboard) so the card always shows the biggest
 * positions. Principals and usernames are deliberately absent.
 */
export function buildShareCard(
  summary: PortfolioSummary,
  btcUsd: number | null,
  opts: ShareCardOptions = {},
): ShareCardData {
  const hidden = opts.hideAmounts ?? false;
  const maxRows = opts.maxRows ?? DEFAULT_ROWS;
  const now = opts.now ?? Date.now();

  const usd = (msats: bigint): string | null => {
    if (btcUsd === null) return null;
    return hidden ? AMOUNT_MASK : formatUsd(msatsToUsd(msats, btcUsd));
  };
  const btc = (msats: bigint, digits: number): string =>
    hidden ? AMOUNT_MASK : formatBtc(msats, { maxFractionDigits: digits });

  const byValue = [...summary.byToken]
    .filter((t) => t.valueMsats > 0n)
    .sort((a, b) => (a.valueMsats === b.valueMsats ? 0 : a.valueMsats > b.valueMsats ? -1 : 1));

  const rows: ShareCardRow[] = byValue.slice(0, maxRows).map((t) => ({
    tokenId: t.tokenId,
    ticker: t.ticker,
    valueLabel: btc(t.valueMsats, 6),
    usdLabel: usd(t.valueMsats),
    sharePct: sharePercent(t.valueMsats, summary.totalMsats),
    changePct: t.tokenId === 'btc' ? null : priceChangePct(Number(t.priceMsats), t.price1d),
  }));

  return {
    totalLabel: btc(summary.totalMsats, 8),
    usdLabel: usd(summary.totalMsats),
    btcUsdLabel: btcUsd === null ? null : formatUsd(btcUsd),
    accountCount: summary.accountCount,
    tokenCount: summary.tokenCount,
    rows,
    moreCount: Math.max(0, byValue.length - rows.length),
    dateLabel: formatDateLabel(now, opts.timeZone),
    hidden,
  };
}

/** File name for a downloaded card, e.g. `odin-portfolio-2026-10-24.png`. */
export function shareCardFileName(now: number = Date.now()): string {
  const d = new Date(now);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `odin-portfolio-${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}.png`;
}
