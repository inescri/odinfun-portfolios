import { describe, expect, it } from 'vitest';

import { fillHourly, HOUR_S } from './candles';
import type { RawCandle } from './candles';

const T0 = 1_700_000_000 - (1_700_000_000 % HOUR_S); // an exact hour boundary
const at = (hours: number) => T0 + hours * HOUR_S;
const bar = (hours: number, o: number, h: number, l: number, c: number): RawCandle => ({
  time: at(hours),
  open: o,
  high: h,
  low: l,
  close: c,
});
const window = (hours: number) => ({
  from: new Date(T0 * 1000),
  to: new Date((at(hours) + 600) * 1000), // a bit past the last slot start
});

describe('fillHourly', () => {
  it('emits one candle per hour and carries the previous close through gaps', () => {
    const out = fillHourly([bar(0, 10, 12, 9, 11), bar(3, 11, 15, 11, 14)], {
      ...window(3),
      seedPrice: null,
    });
    expect(out.map((c) => c.time)).toEqual([at(0), at(1), at(2), at(3)]);
    expect(out.map((c) => c.traded)).toEqual([true, false, false, true]);
    expect(out[1]).toMatchObject({ open: 11, high: 11, low: 11, close: 11 });
    expect(out[2]?.close).toBe(11);
    expect(out[3]).toMatchObject({ open: 11, high: 15, low: 11, close: 14 });
  });

  it('seeds leading gaps from seedPrice when no trade precedes them', () => {
    const out = fillHourly([bar(2, 20, 22, 19, 21)], { ...window(2), seedPrice: 18 });
    expect(out[0]).toMatchObject({ close: 18, traded: false });
    expect(out[1]?.close).toBe(18);
    expect(out[2]?.close).toBe(21);
  });

  it('falls back to the first real candle open when seedPrice is missing', () => {
    const out = fillHourly([bar(2, 20, 22, 19, 21)], { ...window(2), seedPrice: null });
    expect(out[0]?.close).toBe(20);
    expect(out[0]?.traded).toBe(false);
  });

  it('returns [] with no candles and no seed', () => {
    expect(fillHourly([], { ...window(5), seedPrice: null })).toEqual([]);
  });

  it('still fills a flat series from the seed alone', () => {
    const out = fillHourly([], { ...window(2), seedPrice: 7 });
    expect(out).toHaveLength(3);
    expect(out.every((c) => c.close === 7 && !c.traded)).toBe(true);
  });

  it('ignores candles outside the window', () => {
    const out = fillHourly([bar(-1, 1, 1, 1, 1), bar(1, 5, 6, 4, 5), bar(9, 99, 99, 99, 99)], {
      ...window(2),
      seedPrice: 3,
    });
    expect(out).toHaveLength(3);
    expect(out[0]?.close).toBe(3);
    expect(out[1]?.close).toBe(5);
    expect(out[2]?.close).toBe(5);
  });
});
