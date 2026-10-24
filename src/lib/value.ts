import { formatCompactAmount } from './amounts';

/** 1 BTC = 1e11 millisatoshis (divisibility 8 + decimals 3). */
export const MSATS_PER_BTC = 100_000_000_000n;
export const BTC_PLACES = 11;

/**
 * `token.price` from the Odin API is millisats per whole token, as a JS
 * number. Round to an integer bigint; anything non-finite or negative is 0.
 */
export function priceToMsats(price: number | bigint | null | undefined): bigint {
  if (typeof price === 'bigint') return price < 0n ? 0n : price;
  if (typeof price !== 'number' || !Number.isFinite(price) || price <= 0) return 0n;
  return BigInt(Math.round(price));
}

/**
 * Value of a holding in millisats. Mirrors the server's
 * `holding_value = token.price * balance / 10^(decimals + divisibility)`.
 */
export function holdingValueMsats(priceMsats: bigint, balance: bigint, places: number): bigint {
  if (balance <= 0n || priceMsats <= 0n) return 0n;
  return (priceMsats * balance) / 10n ** BigInt(places);
}

/** Millisats as a float BTC amount (display only). */
export function msatsToBtc(msats: bigint): number {
  return Number(msats) / 1e11;
}

/** Millisats as USD given a BTC/USD rate (display only). */
export function msatsToUsd(msats: bigint, btcUsd: number): number {
  return msatsToBtc(msats) * btcUsd;
}

/** `0.01234567 BTC`-style string from millisats. */
export function formatBtc(msats: bigint, opts: { maxFractionDigits?: number } = {}): string {
  return formatCompactAmount(msats, BTC_PLACES, {
    maxFractionDigits: opts.maxFractionDigits ?? 8,
  });
}

const USD_FORMAT = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/** `$1,234.56`; sub-cent positives show as `<$0.01`. */
export function formatUsd(usd: number): string {
  if (!Number.isFinite(usd)) return '—';
  if (usd > 0 && usd < 0.005) return '<$0.01';
  return USD_FORMAT.format(usd);
}

/** 24h change in percent from current and day-old price; null when unknown. */
export function priceChangePct(price: number, price1d: number | null | undefined): number | null {
  if (price1d === null || price1d === undefined || !Number.isFinite(price1d) || price1d <= 0) {
    return null;
  }
  if (!Number.isFinite(price)) return null;
  return ((price - price1d) / price1d) * 100;
}

/** `+12.3%` / `-4.0%`. */
export function formatPct(pct: number): string {
  const sign = pct > 0 ? '+' : '';
  return `${sign}${pct.toFixed(1)}%`;
}

/** Unrealized PNL as a percent of cost basis; null when the cost basis is unknown or zero. */
export function pnlPct(valueMsats: bigint, costMsats: bigint | null): number | null {
  if (costMsats === null || costMsats <= 0n) return null;
  return (Number(valueMsats - costMsats) / Number(costMsats)) * 100;
}
