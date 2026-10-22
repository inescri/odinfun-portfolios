import { useCallback, useEffect, useRef, useState } from 'react';

import { getSnapshot, putSnapshot } from '../db/db';
import type { StoredAccount } from '../db/db';
import { fetchBtcUsd } from '../lib/btcPrice';
import { deserializeHolding, fetchHoldings, serializeHolding } from '../lib/holdings';
import type { Holding } from '../lib/holdings';

export interface AccountState {
  status: 'loading' | 'ready' | 'error';
  holdings: Holding[];
  /** Unix ms of the data currently shown (live or cached). */
  fetchedAt: number | null;
  /** True while showing a cached snapshot before the live fetch lands. */
  stale: boolean;
  error: string | null;
}

export interface HoldingsApi {
  byPrincipal: Record<string, AccountState>;
  btcUsd: number | null;
  refreshing: boolean;
  lastUpdated: number | null;
  refresh: () => void;
}

const EMPTY: AccountState = {
  status: 'loading',
  holdings: [],
  fetchedAt: null,
  stale: false,
  error: null,
};

function errorMessage(err: unknown): string {
  return err instanceof Error ? err.message : 'Failed to load holdings.';
}

/**
 * Live holdings for every stored account, with an IndexedDB snapshot shown
 * first on reload (stale-while-revalidate). One account failing never blocks
 * the others.
 */
export function useHoldings(accounts: readonly StoredAccount[]): HoldingsApi {
  const [byPrincipal, setByPrincipal] = useState<Record<string, AccountState>>({});
  const [btcUsd, setBtcUsd] = useState<number | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<number | null>(null);
  const startedRef = useRef<Set<string>>(new Set());
  const btcUsdRef = useRef<number | null>(null);

  const patch = useCallback((principal: string, update: Partial<AccountState>) => {
    setByPrincipal((prev) => {
      const current = prev[principal];
      if (current === undefined) return prev; // removed meanwhile
      return { ...prev, [principal]: { ...current, ...update } };
    });
  }, []);

  const loadLive = useCallback(
    async (principal: string): Promise<void> => {
      try {
        const holdings = await fetchHoldings(principal);
        const fetchedAt = Date.now();
        patch(principal, { status: 'ready', holdings, fetchedAt, stale: false, error: null });
        setLastUpdated(fetchedAt);
        await putSnapshot({
          principal,
          fetchedAt,
          btcUsd: btcUsdRef.current,
          items: holdings.map(serializeHolding),
        });
      } catch (err: unknown) {
        patch(principal, { status: 'error', error: errorMessage(err) });
      }
    },
    [patch],
  );

  const loadBtcUsd = useCallback(async (): Promise<void> => {
    try {
      const rate = await fetchBtcUsd();
      btcUsdRef.current = rate;
      setBtcUsd(rate);
    } catch (err: unknown) {
      console.warn('BTC/USD rate unavailable', err);
    }
  }, []);

  // Start loading newly added accounts; forget removed ones.
  useEffect(() => {
    const present = new Set(accounts.map((a) => a.principal));

    setByPrincipal((prev) => {
      let changed = false;
      const next: Record<string, AccountState> = {};
      for (const p of present) {
        if (prev[p] !== undefined) next[p] = prev[p];
        else {
          next[p] = EMPTY;
          changed = true;
        }
      }
      if (Object.keys(prev).length !== Object.keys(next).length) changed = true;
      return changed ? next : prev;
    });

    for (const p of startedRef.current) {
      if (!present.has(p)) startedRef.current.delete(p);
    }

    for (const { principal } of accounts) {
      if (startedRef.current.has(principal)) continue;
      startedRef.current.add(principal);
      void (async () => {
        const snap = await getSnapshot(principal).catch(() => undefined);
        if (snap !== undefined) {
          patch(principal, {
            status: 'ready',
            holdings: snap.items.map(deserializeHolding),
            fetchedAt: snap.fetchedAt,
            stale: true,
          });
          if (btcUsdRef.current === null && snap.btcUsd !== null) {
            btcUsdRef.current = snap.btcUsd;
            setBtcUsd(snap.btcUsd);
          }
        }
        await loadLive(principal);
      })();
    }
  }, [accounts, loadLive, patch]);

  const btcStartedRef = useRef(false);
  useEffect(() => {
    if (btcStartedRef.current) return;
    btcStartedRef.current = true;
    void loadBtcUsd();
  }, [loadBtcUsd]);

  const refresh = useCallback(() => {
    if (refreshing) return;
    setRefreshing(true);
    const principals = accounts.map((a) => a.principal);
    for (const p of principals) patch(p, { stale: true, error: null });
    void Promise.all([loadBtcUsd(), ...principals.map(loadLive)]).finally(() => {
      setRefreshing(false);
    });
  }, [accounts, loadBtcUsd, loadLive, patch, refreshing]);

  return { byPrincipal, btcUsd, refreshing, lastUpdated, refresh };
}
