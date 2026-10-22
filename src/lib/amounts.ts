/**
 * Format a raw base-unit amount (bigint) into a human string using the token's
 * display exponent — for Odin tokens that is `divisibility + decimals` — without
 * going through float (which would lose precision on large balances).
 */
export function formatTokenAmount(raw: bigint, exponent: number): string {
  const negative = raw < 0n;
  const abs = negative ? -raw : raw;
  if (exponent <= 0) return `${negative ? '-' : ''}${abs.toString()}`;
  const base = 10n ** BigInt(exponent);
  const whole = abs / base;
  const frac = abs % base;
  const fracStr =
    frac === 0n ? '' : frac.toString().padStart(exponent, '0').replace(/0+$/, '');
  return `${negative ? '-' : ''}${whole.toString()}${fracStr ? `.${fracStr}` : ''}`;
}

/** Odin's display exponent for a token. */
export function displayExponent(token: { divisibility: number; decimals: number }): number {
  return token.divisibility + token.decimals;
}

export interface CompactOptions {
  /** Fraction digits to keep for small values (default 3). */
  maxFractionDigits?: number;
  /** Abbreviate values ≥ 1,000 as K/M/B/T with one truncated decimal (1.2K). */
  abbreviate?: boolean;
}

const SUFFIXES = ['K', 'M', 'B', 'T'] as const;

/**
 * `whole` (≥ 1,000, non-negative display units) as e.g. `1.2K`, `20K`, `1,234T`.
 * Truncates rather than rounds so a balance is never overstated.
 */
function abbreviateWhole(whole: bigint): string {
  let tier = 0;
  while (tier < SUFFIXES.length && whole >= 1000n ** BigInt(tier + 1)) tier++;
  const scaled10 = (whole * 10n) / 1000n ** BigInt(tier);
  const intPart = (scaled10 / 10n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  const decimal = scaled10 % 10n;
  return `${intPart}${decimal === 0n ? '' : `.${decimal}`}${SUFFIXES[tier - 1]}`;
}

/**
 * Compact display for balances: at most `maxFractionDigits` fraction digits,
 * thousands separators, and a visible floor so a non-zero amount never
 * renders as `0`.
 */
export function formatCompactAmount(
  raw: bigint,
  exponent: number,
  opts: CompactOptions = {},
): string {
  const digits = opts.maxFractionDigits ?? 3;
  if (raw === 0n) return '0';
  const full = formatTokenAmount(raw, exponent);
  const negative = full.startsWith('-');
  const [wholeStr, fracStr = ''] = (negative ? full.slice(1) : full).split('.');
  if (opts.abbreviate && BigInt(wholeStr!) >= 1000n) {
    return `${negative ? '-' : ''}${abbreviateWhole(BigInt(wholeStr!))}`;
  }
  const wholeGrouped = wholeStr!.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  const frac = fracStr.slice(0, digits).replace(/0+$/, '');
  if (wholeStr === '0' && frac === '') {
    // Non-zero but below the visible precision.
    return `${negative ? '-' : ''}<0.${'0'.repeat(Math.max(0, digits - 1))}1`;
  }
  return `${negative ? '-' : ''}${wholeGrouped}${frac ? `.${frac}` : ''}`;
}
