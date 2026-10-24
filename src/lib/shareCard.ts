import { tokenPnlMsats, tokenPnlPct } from './aggregate';
import type { PortfolioSummary } from './aggregate';
import { formatBtc, formatPct, formatUsd, holdingValueMsats, msatsToUsd, priceChangePct, priceToMsats } from './value';

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
  /** Gain as shown: `+12.3%` or `+$1,234.56`; null when nothing is known. */
  pnlLabel: string | null;
  /** What `pnlLabel` measures: unrealized PNL from cost basis, or 24h price move. */
  pnlKind: PnlKind | null;
}

/** How a gain is written: percent, or value in USD (BTC when no rate). */
export type PnlMode = 'pct' | 'amount';
/** Unrealized PNL against the API's average entry price, or the 24h price move as a fallback. */
export type PnlKind = 'pnl' | '24h';

/** Everything the renderer needs; no bigint, no DOM. */
export interface ShareCardData {
  totalLabel: string;
  usdLabel: string | null;
  btcUsdLabel: string | null;
  accountCount: number;
  tokenCount: number;
  /**
   * Portfolio gain. Unrealized PNL summed over positions with a cost basis;
   * when none has one, the 24h change over tokens with a day-old price. Null
   * when neither is known.
   */
  pnlLabel: string | null;
  pnlKind: PnlKind | null;
  pnlUp: boolean;
  pnlMode: PnlMode;
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
  /** Percent (default) or amount. Amount falls back to percent while amounts are hidden. */
  pnlMode?: PnlMode;
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

/** Signed change in msats as `+$1,234.56`, or `+0.0012 BTC` when no rate is known. */
export function formatPnlAmount(changeMsats: bigint, btcUsd: number | null): string {
  const sign = changeMsats < 0n ? '-' : '+';
  const abs = changeMsats < 0n ? -changeMsats : changeMsats;
  if (btcUsd === null) return `${sign}${formatBtc(abs, { maxFractionDigits: 6 })} BTC`;
  const usd = msatsToUsd(abs, btcUsd);
  // formatUsd's `<$0.01` floor does not take a sign; a sub-cent change is just zero cents.
  return `${sign}${usd < 0.005 ? '$0.00' : formatUsd(usd)}`;
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
  const pnlMode: PnlMode = hidden ? 'pct' : (opts.pnlMode ?? 'pct');
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

  // Per token: unrealized PNL where a cost basis exists, else the 24h move.
  interface Gain {
    kind: PnlKind;
    msats: bigint;
    pct: number | null;
  }
  const gainOf = new Map<string, Gain>();
  let pnlTotal = 0n;
  let pnlBase = 0n;
  let dayTotal = 0n;
  let dayBase = 0n;
  for (const t of byValue) {
    const pnl = tokenPnlMsats(t);
    if (pnl !== null && t.costMsats !== null) {
      gainOf.set(t.tokenId, { kind: 'pnl', msats: pnl, pct: tokenPnlPct(t) });
      pnlTotal += pnl;
      pnlBase += t.costMsats;
      continue;
    }
    if (t.tokenId === 'btc' || t.price1d === null || t.price1d <= 0) continue;
    const places = t.divisibility + t.decimals;
    const value1d = holdingValueMsats(priceToMsats(t.price1d), t.balance, places);
    const pct = priceChangePct(Number(t.priceMsats), t.price1d);
    gainOf.set(t.tokenId, { kind: '24h', msats: t.valueMsats - value1d, pct });
    dayTotal += t.valueMsats - value1d;
    dayBase += value1d;
  }

  const label = (g: Gain | undefined): string | null => {
    if (g === undefined) return null;
    if (pnlMode === 'amount') return formatPnlAmount(g.msats, btcUsd);
    return g.pct === null ? null : formatPct(g.pct);
  };

  const rows: ShareCardRow[] = byValue.slice(0, maxRows).map((t) => {
    const g = gainOf.get(t.tokenId);
    return {
      tokenId: t.tokenId,
      ticker: t.ticker,
      valueLabel: btc(t.valueMsats, 6),
      usdLabel: usd(t.valueMsats),
      sharePct: sharePercent(t.valueMsats, summary.totalMsats),
      pnlLabel: label(g),
      pnlKind: g?.kind ?? null,
    };
  });

  // Portfolio line: PNL wins whenever any position has a cost basis.
  const total: Gain | undefined =
    pnlBase > 0n
      ? { kind: 'pnl', msats: pnlTotal, pct: (Number(pnlTotal) / Number(pnlBase)) * 100 }
      : dayBase > 0n
        ? { kind: '24h', msats: dayTotal, pct: (Number(dayTotal) / Number(dayBase)) * 100 }
        : undefined;

  return {
    totalLabel: btc(summary.totalMsats, 8),
    usdLabel: usd(summary.totalMsats),
    btcUsdLabel: btcUsd === null ? null : formatUsd(btcUsd),
    accountCount: summary.accountCount,
    tokenCount: summary.tokenCount,
    pnlLabel: label(total),
    pnlKind: total?.kind ?? null,
    pnlUp: total === undefined || total.msats >= 0n,
    pnlMode,
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
