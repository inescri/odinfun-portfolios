import { describe, expect, it } from 'vitest';

import { aggregate } from './aggregate';
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
});
