/**
 * Odin's BTC is a ledger built-in, not a launched token: `api.getToken('btc')`
 * returns 404 even though it appears in every user's balances with this exact
 * shape. divisibility 8 (sats) + decimals 3 (millisats) → 11 places.
 */
export const BTC_TOKEN = {
  id: 'btc',
  ticker: 'BTC',
  name: 'Bitcoin',
  divisibility: 8,
  decimals: 3,
} as const;

/** Display scale for a token: Odin amounts scale by divisibility + decimals. */
export function tokenPlaces(token: { divisibility: number; decimals: number }): number {
  return token.divisibility + token.decimals;
}

/** Short principal for labels: `abcde-...-cai`. */
export function shortPrincipal(principal: string): string {
  if (principal.length <= 16) return principal;
  return `${principal.slice(0, 5)}…${principal.slice(-3)}`;
}
