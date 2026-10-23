import { odin } from '../odin/client';

/** One display candle. Prices are millisats per whole token, as numbers. */
export interface Candle {
  /** Slot start, unix seconds. */
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  /** False for gap-filled slots with no trades. */
  traded: boolean;
}

/** Raw bar from `GET /token/:id/tv_feed`. Only hours with trades are returned. */
export interface RawCandle {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
}

export const HOUR_S = 3600;
export const HOURLY_RESOLUTION = 60;

interface FetchOpts {
  from: Date;
  to: Date;
  resolution?: number;
  signal?: AbortSignal;
}

function num(v: unknown): number | null {
  const n = typeof v === 'string' ? Number(v) : v;
  return typeof n === 'number' && Number.isFinite(n) ? n : null;
}

function parseRaw(row: unknown): RawCandle | null {
  if (typeof row !== 'object' || row === null) return null;
  const r = row as Record<string, unknown>;
  const time = num(r.time);
  const open = num(r.open);
  const high = num(r.high);
  const low = num(r.low);
  const close = num(r.close);
  if (time === null || open === null || high === null || low === null || close === null) return null;
  return { time, open, high, low, close };
}

/**
 * Candles from Odin's TradingView feed (not wrapped by the SDK). `from`/`to`
 * must be ISO strings; unix seconds are silently ignored by the API.
 */
export async function fetchCandles(tokenId: string, opts: FetchOpts): Promise<RawCandle[]> {
  const params = new URLSearchParams({
    resolution: String(opts.resolution ?? HOURLY_RESOLUTION),
    from: opts.from.toISOString(),
    to: opts.to.toISOString(),
  });
  const res = await fetch(`${odin.api.BASE_URL}/token/${tokenId}/tv_feed?${params}`, {
    signal: opts.signal,
  });
  if (!res.ok) throw new Error(`tv_feed failed: HTTP ${res.status}`);
  const json: unknown = await res.json();
  if (!Array.isArray(json)) throw new Error('tv_feed returned no array');
  const out: RawCandle[] = [];
  for (const row of json) {
    const c = parseRaw(row);
    if (c !== null) out.push(c);
  }
  return out.sort((a, b) => a.time - b.time);
}

interface FillOpts {
  /** Window start (floored to the hour internally). */
  from: Date;
  /** Window end; the slot containing it is the last one. */
  to: Date;
  /** Close to carry into the first slots when no trade precedes them (e.g. `price_1d`). */
  seedPrice: number | null;
}

/**
 * Pure: expand sparse hourly bars into one candle per hour slot in
 * `[from, to]`. Hours without trades repeat the previous close as a flat
 * candle with `traded: false`. Returns `[]` when nothing can anchor a price.
 */
export function fillHourly(raw: readonly RawCandle[], opts: FillOpts): Candle[] {
  const start = Math.floor(opts.from.getTime() / 1000 / HOUR_S) * HOUR_S;
  const end = Math.floor(opts.to.getTime() / 1000 / HOUR_S) * HOUR_S;
  if (end < start) return [];

  const bySlot = new Map<number, RawCandle>();
  for (const c of raw) {
    const slot = Math.floor(c.time / HOUR_S) * HOUR_S;
    if (slot < start || slot > end) continue;
    bySlot.set(slot, c);
  }

  let prevClose: number | null =
    opts.seedPrice !== null && Number.isFinite(opts.seedPrice) && opts.seedPrice > 0
      ? opts.seedPrice
      : null;
  if (prevClose === null) {
    const first = [...bySlot.values()].sort((a, b) => a.time - b.time)[0];
    if (first === undefined) return [];
    prevClose = first.open;
  }

  const out: Candle[] = [];
  for (let slot = start; slot <= end; slot += HOUR_S) {
    const real = bySlot.get(slot);
    if (real !== undefined) {
      out.push({ time: slot, ...pick(real), traded: true });
      prevClose = real.close;
    } else {
      out.push({ time: slot, open: prevClose, high: prevClose, low: prevClose, close: prevClose, traded: false });
    }
  }
  return out;
}

function pick(c: RawCandle): Pick<Candle, 'open' | 'high' | 'low' | 'close'> {
  return { open: c.open, high: c.high, low: c.low, close: c.close };
}
