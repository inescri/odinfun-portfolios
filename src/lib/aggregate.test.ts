import { describe, expect, it } from 'vitest';

import { aggregate, portfolioPnl, tokenPnlMsats, tokenPnlPct } from './aggregate';
import type { Holding } from './holdings';

function h(partial: Partial<Holding> & Pick<Holding, 'tokenId' | 'balance' | 'valueMsats'>): Holding {
  return {
    ticker: partial.tokenId.toUpperCase(),
    name: partial.tokenId,
    image: null,
    divisibility: 8,
    decimals: 3,
    priceMsats: 0n,
    price1d: null,
    costMsats: null,
    ...partial,
  };
}

describe('aggregate', () => {
  it('merges the same token across accounts and sums totals', () => {
    const summary = aggregate([
      {
        principal: 'aaa',
        holdings: [
          h({ tokenId: 'btc', balance: 100n, valueMsats: 100n }),
          h({ tokenId: 'foo', balance: 10n, valueMsats: 50n }),
        ],
      },
      {
        principal: 'bbb',
        holdings: [
          h({ tokenId: 'foo', balance: 5n, valueMsats: 25n }),
          h({ tokenId: 'bar', balance: 1n, valueMsats: 500n }),
        ],
      },
    ]);

    expect(summary.totalMsats).toBe(675n);
    expect(summary.accountCount).toBe(2);
    expect(summary.tokenCount).toBe(3);
    expect(summary.perAccount.get('aaa')).toBe(150n);
    expect(summary.perAccount.get('bbb')).toBe(525n);

    const foo = summary.byToken.find((t) => t.tokenId === 'foo');
    expect(foo?.balance).toBe(15n);
    expect(foo?.valueMsats).toBe(75n);
    expect(foo?.holders.map((x) => x.principal)).toEqual(['aaa', 'bbb']);
  });

  it('puts BTC first, then sorts by value desc', () => {
    const summary = aggregate([
      {
        principal: 'aaa',
        holdings: [
          h({ tokenId: 'low', balance: 1n, valueMsats: 1n }),
          h({ tokenId: 'high', balance: 1n, valueMsats: 999n }),
          h({ tokenId: 'btc', balance: 2n, valueMsats: 2n }),
        ],
      },
    ]);
    expect(summary.byToken.map((t) => t.tokenId)).toEqual(['btc', 'high', 'low']);
  });

  it('ignores zero balances and handles no accounts', () => {
    expect(aggregate([]).totalMsats).toBe(0n);
    const s = aggregate([
      { principal: 'aaa', holdings: [h({ tokenId: 'zero', balance: 0n, valueMsats: 0n })] },
    ]);
    expect(s.tokenCount).toBe(0);
    expect(s.perAccount.get('aaa')).toBe(0n);
  });

  it('sums cost basis only over holders that have one', () => {
    const summary = aggregate([
      { principal: 'a', holdings: [h({ tokenId: 'foo', balance: 10n, valueMsats: 300n, costMsats: 100n })] },
      { principal: 'b', holdings: [h({ tokenId: 'foo', balance: 10n, valueMsats: 300n })] }, // deposited, no entry
      { principal: 'c', holdings: [h({ tokenId: 'foo', balance: 10n, valueMsats: 300n, costMsats: 200n })] },
    ]);
    const foo = summary.byToken.find((t) => t.tokenId === 'foo')!;
    expect(foo.valueMsats).toBe(900n);
    expect(foo.costMsats).toBe(300n);
    expect(foo.pnlValueMsats).toBe(600n);
    expect(tokenPnlMsats(foo)).toBe(300n);
    expect(tokenPnlPct(foo)).toBe(100);
    const bare = aggregate([{ principal: 'b', holdings: [h({ tokenId: 'foo', balance: 10n, valueMsats: 300n })] }]);
    expect(tokenPnlMsats(bare.byToken[0]!)).toBeNull();
    expect(tokenPnlPct(bare.byToken[0]!)).toBeNull();
  });

  it('sums unrealized PNL across tokens with a cost basis and ignores the rest', () => {
    const summary = aggregate([
      {
        principal: 'a',
        holdings: [
          h({ tokenId: 'foo', balance: 10n, valueMsats: 600n, costMsats: 300n }),
          h({ tokenId: 'bar', balance: 10n, valueMsats: 400n, costMsats: 500n }),
          h({ tokenId: 'baz', balance: 10n, valueMsats: 1_000n }),
        ],
      },
    ]);
    expect(portfolioPnl(summary.byToken)).toEqual({ pnlMsats: 200n, pct: 25 });
    const bare = aggregate([{ principal: 'b', holdings: [h({ tokenId: 'baz', balance: 10n, valueMsats: 300n })] }]);
    expect(portfolioPnl(bare.byToken)).toBeNull();
  });
});
