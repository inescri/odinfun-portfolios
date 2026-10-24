import { describe, expect, it } from 'vitest';

import { aggregate } from './aggregate';
import type { Holding } from './holdings';
import { AMOUNT_MASK, buildShareCard, formatDateLabel, sharePercent, shareCardFileName } from './shareCard';

const BTC = 100_000_000_000n; // 1 BTC in msats

function holding(partial: Partial<Holding> & Pick<Holding, 'tokenId' | 'ticker' | 'valueMsats'>): Holding {
  return {
    name: partial.ticker,
    image: null,
    divisibility: 8,
    decimals: 3,
    balance: 1n,
    priceMsats: 1n,
    price1d: null,
    ...partial,
  };
}

const summary = aggregate([
  {
    principal: 'aaa',
    holdings: [
      holding({ tokenId: 'btc', ticker: 'BTC', valueMsats: BTC / 10n }), // 0.1 BTC
      holding({
        tokenId: 'odin',
        ticker: 'ODIN',
        valueMsats: BTC / 2n, // 0.5 BTC — bigger than the BTC position
        priceMsats: 1100n,
        price1d: 1000,
      }),
      holding({ tokenId: 'zero', ticker: 'ZERO', valueMsats: 0n }),
    ],
  },
  {
    principal: 'bbb',
    holdings: [
      holding({ tokenId: 'btc', ticker: 'BTC', valueMsats: BTC / 10n }),
      holding({ tokenId: 'x1', ticker: 'X1', valueMsats: 4n }),
      holding({ tokenId: 'x2', ticker: 'X2', valueMsats: 3n }),
      holding({ tokenId: 'x3', ticker: 'X3', valueMsats: 2n }),
      holding({ tokenId: 'x4', ticker: 'X4', valueMsats: 1n }),
    ],
  },
]);

const NOW = Date.UTC(2026, 9, 24, 9, 35); // 2026-10-24 09:35Z

describe('buildShareCard', () => {
  const card = buildShareCard(summary, 100_000, { now: NOW, timeZone: 'UTC' });

  it('orders rows by value, not BTC-first, and caps at five', () => {
    expect(card.rows.map((r) => r.ticker)).toEqual(['ODIN', 'BTC', 'X1', 'X2', 'X3']);
    expect(card.moreCount).toBe(1); // X4; ZERO is dropped for having no value
  });

  it('formats totals and the BTC/USD rate', () => {
    expect(card.totalLabel).toBe('0.7'); // 10 msats of dust is below 8 BTC places
    expect(card.usdLabel).toBe('$70,000.00');
    expect(card.btcUsdLabel).toBe('$100,000.00');
    expect(card.accountCount).toBe(2);
    expect(card.tokenCount).toBe(7);
  });

  it('computes share of total and 24h change', () => {
    const [odin, btc] = card.rows;
    expect(odin!.sharePct).toBeCloseTo(71.42, 2);
    expect(odin!.changePct).toBeCloseTo(10, 5);
    expect(btc!.sharePct).toBeCloseTo(28.57, 2);
    expect(btc!.changePct).toBeNull();
  });

  it('masks every amount when hideAmounts is set, but keeps tickers and shares', () => {
    const hidden = buildShareCard(summary, 100_000, { now: NOW, hideAmounts: true });
    expect(hidden.hidden).toBe(true);
    expect(hidden.totalLabel).toBe(AMOUNT_MASK);
    expect(hidden.usdLabel).toBe(AMOUNT_MASK);
    expect(hidden.rows.every((r) => r.valueLabel === AMOUNT_MASK && r.usdLabel === AMOUNT_MASK)).toBe(
      true,
    );
    expect(hidden.rows[0]!.sharePct).toBeCloseTo(71.42, 2);
    expect(hidden.btcUsdLabel).toBe('$100,000.00');
  });

  it('omits USD when no rate is known', () => {
    const noRate = buildShareCard(summary, null, { now: NOW });
    expect(noRate.usdLabel).toBeNull();
    expect(noRate.btcUsdLabel).toBeNull();
    expect(noRate.rows[0]!.usdLabel).toBeNull();
  });

  it('labels the date in the requested zone', () => {
    expect(card.dateLabel).toBe('Oct 24, 2026, 09:35');
    expect(formatDateLabel(NOW, 'Asia/Manila')).toBe('Oct 24, 2026, 17:35');
  });
});

describe('sharePercent', () => {
  it('is 0 for empty totals and never divides by zero', () => {
    expect(sharePercent(5n, 0n)).toBe(0);
    expect(sharePercent(0n, 5n)).toBe(0);
  });
  it('keeps two decimals using integer math', () => {
    expect(sharePercent(1n, 3n)).toBe(33.33);
    expect(sharePercent(2n, 2n)).toBe(100);
  });
});

describe('shareCardFileName', () => {
  it('uses the local calendar date', () => {
    const d = new Date(2026, 0, 5, 12);
    expect(shareCardFileName(d.getTime())).toBe('odin-portfolio-2026-01-05.png');
  });
});
