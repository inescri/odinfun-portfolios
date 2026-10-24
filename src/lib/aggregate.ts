import type { AccountHoldings, Holding } from './holdings';
import { pnlPct } from './value';

export interface TokenHolder {
  principal: string;
  balance: bigint;
  valueMsats: bigint;
}

/** One token summed across every connected account. */
export interface AggregatedToken {
  tokenId: string;
  ticker: string;
  name: string;
  image: string | null;
  divisibility: number;
  decimals: number;
  balance: bigint;
  valueMsats: bigint;
  priceMsats: bigint;
  price1d: number | null;
  /**
   * Cost basis and value summed over the holders whose entry price is known,
   * so `pnlMsats = pnlValueMsats - costMsats` is exact for that portion. Null
   * when no holder has one.
   */
  costMsats: bigint | null;
  pnlValueMsats: bigint | null;
  holders: TokenHolder[];
}

/** Unrealized PNL in msats over positions with a known cost basis, or null. */
export function tokenPnlMsats(t: Pick<AggregatedToken, 'costMsats' | 'pnlValueMsats'>): bigint | null {
  if (t.costMsats === null || t.pnlValueMsats === null) return null;
  return t.pnlValueMsats - t.costMsats;
}

/** Unrealized PNL as a percent of cost basis, or null. */
export function tokenPnlPct(t: Pick<AggregatedToken, 'costMsats' | 'pnlValueMsats'>): number | null {
  if (t.pnlValueMsats === null) return null;
  return pnlPct(t.pnlValueMsats, t.costMsats);
}

/**
 * Portfolio-wide unrealized PNL summed over positions with a known cost basis,
 * or null when no position has one.
 */
export function portfolioPnl(
  byToken: readonly Pick<AggregatedToken, 'costMsats' | 'pnlValueMsats'>[],
): { pnlMsats: bigint; pct: number | null } | null {
  let cost: bigint | null = null;
  let value = 0n;
  for (const t of byToken) {
    if (t.costMsats === null || t.pnlValueMsats === null) continue;
    cost = (cost ?? 0n) + t.costMsats;
    value += t.pnlValueMsats;
  }
  return cost === null ? null : { pnlMsats: value - cost, pct: pnlPct(value, cost) };
}

export interface PortfolioSummary {
  totalMsats: bigint;
  accountCount: number;
  /** Distinct tokens with a positive balance across all accounts. */
  tokenCount: number;
  /** BTC first, then by combined value desc. */
  byToken: AggregatedToken[];
  /** Total value per principal, millisats. */
  perAccount: Map<string, bigint>;
}

function mergeInto(map: Map<string, AggregatedToken>, principal: string, h: Holding): void {
  const existing = map.get(h.tokenId);
  const holder: TokenHolder = { principal, balance: h.balance, valueMsats: h.valueMsats };
  if (existing === undefined) {
    map.set(h.tokenId, {
      tokenId: h.tokenId,
      ticker: h.ticker,
      name: h.name,
      image: h.image,
      divisibility: h.divisibility,
      decimals: h.decimals,
      balance: h.balance,
      valueMsats: h.valueMsats,
      priceMsats: h.priceMsats,
      price1d: h.price1d,
      costMsats: h.costMsats,
      pnlValueMsats: h.costMsats === null ? null : h.valueMsats,
      holders: [holder],
    });
    return;
  }
  existing.balance += h.balance;
  existing.valueMsats += h.valueMsats;
  existing.holders.push(holder);
  if (h.costMsats !== null) {
    existing.costMsats = (existing.costMsats ?? 0n) + h.costMsats;
    existing.pnlValueMsats = (existing.pnlValueMsats ?? 0n) + h.valueMsats;
  }
}

/** Pure: combine per-account holdings into one portfolio view. */
export function aggregate(accounts: readonly AccountHoldings[]): PortfolioSummary {
  const map = new Map<string, AggregatedToken>();
  const perAccount = new Map<string, bigint>();
  let totalMsats = 0n;

  for (const account of accounts) {
    let accountTotal = 0n;
    for (const h of account.holdings) {
      if (h.balance <= 0n) continue;
      mergeInto(map, account.principal, h);
      accountTotal += h.valueMsats;
    }
    perAccount.set(account.principal, accountTotal);
    totalMsats += accountTotal;
  }

  const byToken = [...map.values()].sort((a, b) => {
    if (a.tokenId === 'btc') return -1;
    if (b.tokenId === 'btc') return 1;
    if (a.valueMsats !== b.valueMsats) return a.valueMsats > b.valueMsats ? -1 : 1;
    if (a.balance !== b.balance) return a.balance > b.balance ? -1 : 1;
    return a.ticker.localeCompare(b.ticker);
  });
  for (const t of byToken) {
    t.holders.sort((a, b) => (a.valueMsats === b.valueMsats ? 0 : a.valueMsats > b.valueMsats ? -1 : 1));
  }

  return {
    totalMsats,
    accountCount: accounts.length,
    tokenCount: byToken.length,
    byToken,
    perAccount,
  };
}
