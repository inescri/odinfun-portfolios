import type { OdinToken } from 'odin-connect';

import { odin } from '../odin/client';
import type { SerializedHolding } from '../db/db';
import { BTC_TOKEN } from './tokens';
import { holdingValueMsats, MSATS_PER_BTC, priceToMsats } from './value';

/** One token position for one principal. All amounts are bigint base units. */
export interface Holding {
  tokenId: string;
  ticker: string;
  name: string;
  image: string | null;
  divisibility: number;
  decimals: number;
  balance: bigint;
  /** Current price, millisats per whole token (BTC: 1e11). */
  priceMsats: bigint;
  /** Price one day ago, millisats per whole token, when the API knows it. */
  price1d: number | null;
  /** `priceMsats * balance / 10^places`, millisats. */
  valueMsats: bigint;
  /**
   * Cost basis in millisats: the API's average entry price × balance. Null
   * when the API has no entry price (BTC, deposited runes, old snapshots).
   * Unrealized PNL is `valueMsats - costMsats`.
   */
  costMsats: bigint | null;
}

/** `/user/:p/tokens` items carry fields the SDK type leaves out. */
interface UserTokenExtras {
  /** Average entry price, millisats per whole token. */
  price?: number | null;
  unrealized_pnl?: number;
  unrealized_pnl_percent?: number;
}

export interface AccountHoldings {
  principal: string;
  holdings: Holding[];
}

const PAGE_LIMIT = 100;
const MAX_PAGES = 50;

function btcHolding(balance: bigint): Holding {
  return {
    tokenId: BTC_TOKEN.id,
    ticker: BTC_TOKEN.ticker,
    name: BTC_TOKEN.name,
    image: null,
    divisibility: BTC_TOKEN.divisibility,
    decimals: BTC_TOKEN.decimals,
    balance,
    priceMsats: MSATS_PER_BTC,
    price1d: null,
    valueMsats: balance,
    costMsats: null,
  };
}

function tokenHolding(token: OdinToken, balance: bigint, extras: UserTokenExtras): Holding {
  const divisibility = token.divisibility ?? 8;
  const decimals = token.decimals ?? 3;
  const priceMsats = priceToMsats(token.price);
  const entryMsats = priceToMsats(extras.price);
  return {
    tokenId: token.id,
    ticker: token.ticker,
    name: token.name,
    image: token.image,
    divisibility,
    decimals,
    balance,
    priceMsats,
    price1d: token.price_1d ?? null,
    valueMsats: holdingValueMsats(priceMsats, balance, divisibility + decimals),
    costMsats:
      entryMsats > 0n ? holdingValueMsats(entryMsats, balance, divisibility + decimals) : null,
  };
}

/** BTC first, then by value desc, then by balance desc. */
export function sortHoldings(holdings: Holding[]): Holding[] {
  return [...holdings].sort((a, b) => {
    if (a.tokenId === 'btc') return -1;
    if (b.tokenId === 'btc') return 1;
    if (a.valueMsats !== b.valueMsats) return a.valueMsats > b.valueMsats ? -1 : 1;
    if (a.balance !== b.balance) return a.balance > b.balance ? -1 : 1;
    return a.ticker.localeCompare(b.ticker);
  });
}

/**
 * Live holdings for any principal. Public endpoints, no login needed:
 * BTC via `/user/:p/balances?token_in=btc`, tokens via `/user/:p/tokens`.
 */
export async function fetchHoldings(principal: string): Promise<Holding[]> {
  const [btc, tokens] = await Promise.all([
    odin.api.getBalance(principal, 'btc'),
    fetchAllTokens(principal),
  ]);
  const btcBalance = btc === null ? 0n : BigInt(btc.balance);
  return sortHoldings([btcHolding(btcBalance), ...tokens]);
}

async function fetchAllTokens(principal: string): Promise<Holding[]> {
  const out: Holding[] = [];
  for (let page = 1; page <= MAX_PAGES; page++) {
    const res = await odin.api.getUserTokens(principal, { page, limit: PAGE_LIMIT });
    for (const item of res.data) {
      if (item.token.id === 'btc') continue;
      if (item.balance <= 0n) continue;
      out.push(tokenHolding(item.token, item.balance, item as UserTokenExtras));
    }
    if (res.data.length < PAGE_LIMIT || out.length >= res.count) break;
  }
  return out;
}

export function sumMsats(holdings: readonly Holding[]): bigint {
  return holdings.reduce((acc, h) => acc + h.valueMsats, 0n);
}

export function serializeHolding(h: Holding): SerializedHolding {
  return {
    tokenId: h.tokenId,
    ticker: h.ticker,
    name: h.name,
    image: h.image,
    divisibility: h.divisibility,
    decimals: h.decimals,
    balance: h.balance.toString(),
    priceMsats: h.priceMsats.toString(),
    price1d: h.price1d,
    valueMsats: h.valueMsats.toString(),
    costMsats: h.costMsats === null ? null : h.costMsats.toString(),
  };
}

export function deserializeHolding(s: SerializedHolding): Holding {
  return {
    tokenId: s.tokenId,
    ticker: s.ticker,
    name: s.name,
    image: s.image,
    divisibility: s.divisibility,
    decimals: s.decimals,
    balance: BigInt(s.balance),
    priceMsats: BigInt(s.priceMsats),
    price1d: s.price1d,
    valueMsats: BigInt(s.valueMsats),
    // Snapshots written before cost basis existed have no field at all.
    costMsats: s.costMsats === null || s.costMsats === undefined ? null : BigInt(s.costMsats),
  };
}
