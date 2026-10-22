import type { AccountHoldings, Holding } from './holdings';

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
  holders: TokenHolder[];
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
      holders: [holder],
    });
    return;
  }
  existing.balance += h.balance;
  existing.valueMsats += h.valueMsats;
  existing.holders.push(holder);
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
