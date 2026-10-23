import { useEffect, useRef, useState } from 'react';

import { fetchCandles, fillHourly, HOUR_S } from '../lib/candles';
import type { Candle } from '../lib/candles';

export interface CandleRequest {
  tokenId: string;
  /** Price 24h ago, used to anchor hours before the first trade. */
  seedPrice: number | null;
}

export interface CandleState {
  status: 'loading' | 'ready' | 'error';
  candles: Candle[];
}

const WINDOW_HOURS = 24;
const CACHE_TTL_MS = 5 * 60 * 1000;

interface CacheEntry {
  fetchedAt: number;
  candles: Candle[];
}

/** Module-level so re-mounts and re-sorts of the summary do not refetch. */
const cache = new Map<string, CacheEntry>();

function isAbort(err: unknown): boolean {
  return err instanceof DOMException && err.name === 'AbortError';
}

/**
 * 24h hourly candles for a few tokens, gap-filled. Charts are decoration, so
 * there is no IndexedDB snapshot; a short in-memory cache is enough.
 * Bumping `refreshKey` (e.g. holdings `lastUpdated`) bypasses the cache.
 */
export function useCandles(
  requests: readonly CandleRequest[],
  refreshKey: number | null,
): Record<string, CandleState> {
  const [states, setStates] = useState<Record<string, CandleState>>({});
  const key = requests.map((r) => r.tokenId).join(',');
  const lastRefreshKey = useRef(refreshKey);

  useEffect(() => {
    if (requests.length === 0) return;
    const controller = new AbortController();
    const now = Date.now();
    const to = new Date(now);
    const from = new Date(now - WINDOW_HOURS * HOUR_S * 1000);
    // Only a *change* in refreshKey (the user pressed Refresh) bypasses the cache;
    // a remount with the same key reuses it.
    const forceFresh = refreshKey !== lastRefreshKey.current;
    lastRefreshKey.current = refreshKey;

    const patch = (tokenId: string, state: CandleState) =>
      setStates((prev) => ({ ...prev, [tokenId]: state }));

    for (const req of requests) {
      const hit = cache.get(req.tokenId);
      if (!forceFresh && hit !== undefined && now - hit.fetchedAt < CACHE_TTL_MS) {
        patch(req.tokenId, { status: 'ready', candles: hit.candles });
        continue;
      }
      patch(req.tokenId, { status: 'loading', candles: hit?.candles ?? [] });
      fetchCandles(req.tokenId, { from, to, signal: controller.signal })
        .then((raw) => {
          const candles = fillHourly(raw, { from, to, seedPrice: req.seedPrice });
          cache.set(req.tokenId, { fetchedAt: Date.now(), candles });
          patch(req.tokenId, { status: 'ready', candles });
        })
        .catch((err: unknown) => {
          if (isAbort(err)) return;
          patch(req.tokenId, { status: 'error', candles: hit?.candles ?? [] });
        });
    }

    return () => controller.abort();
    // `key` stands in for `requests` identity; seedPrice changes alone need no refetch.
  }, [key, refreshKey]);

  return states;
}
