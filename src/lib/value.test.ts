import { describe, expect, it } from 'vitest';

import {
  formatBtc,
  formatUsd,
  holdingValueMsats,
  msatsToUsd,
  priceChangePct,
  priceToMsats,
} from './value';

describe('priceToMsats', () => {
  it('rounds a numeric price to integer msats', () => {
    expect(priceToMsats(1234.6)).toBe(1235n);
  });
  it('treats non-finite / negative / missing as zero', () => {
    expect(priceToMsats(NaN)).toBe(0n);
    expect(priceToMsats(-5)).toBe(0n);
    expect(priceToMsats(undefined)).toBe(0n);
    expect(priceToMsats(null)).toBe(0n);
  });
});

describe('holdingValueMsats', () => {
  it('BTC: price 1e11 msats per BTC, 11 places → value equals balance', () => {
    const balance = 123_456_789_000n; // 1.23456789 BTC in msats
    expect(holdingValueMsats(100_000_000_000n, balance, 11)).toBe(balance);
  });
  it('token with 8+3 places: 2.5 whole tokens at 400 msats each = 1000 msats', () => {
    const balance = 250_000_000_000n; // 2.5 tokens
    expect(holdingValueMsats(400n, balance, 11)).toBe(1000n);
  });
  it('zero price or balance → 0', () => {
    expect(holdingValueMsats(0n, 10n ** 11n, 11)).toBe(0n);
    expect(holdingValueMsats(400n, 0n, 11)).toBe(0n);
  });
});

describe('formatting', () => {
  it('formatBtc shows up to 8 decimals', () => {
    expect(formatBtc(123_456_789_000n)).toBe('1.23456789');
    expect(formatBtc(100_000_000_000n)).toBe('1');
    expect(formatBtc(0n)).toBe('0');
  });
  it('msatsToUsd and formatUsd', () => {
    expect(msatsToUsd(50_000_000_000n, 100_000)).toBe(50_000);
    expect(formatUsd(1234.567)).toBe('$1,234.57');
    expect(formatUsd(0.001)).toBe('<$0.01');
    expect(formatUsd(0)).toBe('$0.00');
  });
});

describe('priceChangePct', () => {
  it('computes percent change vs day-old price', () => {
    expect(priceChangePct(110, 100)).toBeCloseTo(10);
    expect(priceChangePct(90, 100)).toBeCloseTo(-10);
  });
  it('null when day-old price unknown or zero', () => {
    expect(priceChangePct(110, null)).toBeNull();
    expect(priceChangePct(110, 0)).toBeNull();
  });
});
