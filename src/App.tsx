import { useCallback, useMemo, useState } from 'react';

import { AccountCard } from './components/AccountCard';
import { Banner } from './components/Banner';
import { EmptyState } from './components/EmptyState';
import { Header } from './components/Header';
import { ShareDialog } from './components/ShareDialog';
import { SummaryPanel } from './components/SummaryPanel';
import { useAccounts } from './hooks/useAccounts';
import { useAddAccount } from './hooks/useAddAccount';
import { useHoldings } from './hooks/useHoldings';
import { aggregate } from './lib/aggregate';
import type { AccountHoldings } from './lib/holdings';

export default function App() {
  const { accounts, loaded, add, remove } = useAccounts();
  const { addAccount, status, error, notice, dismiss } = useAddAccount(add);
  const { byPrincipal, btcUsd, refreshing, lastUpdated, refresh } = useHoldings(accounts);
  const [sharing, setSharing] = useState(false);
  const openShare = useCallback(() => setSharing(true), []);
  const closeShare = useCallback(() => setSharing(false), []);

  const { summary, pending } = useMemo(() => {
    const ready: AccountHoldings[] = [];
    let pendingCount = 0;
    for (const a of accounts) {
      const s = byPrincipal[a.principal];
      if (s !== undefined && s.holdings.length > 0) {
        ready.push({ principal: a.principal, holdings: s.holdings });
      } else if (s === undefined || s.status !== 'ready') {
        pendingCount += 1;
      } else {
        ready.push({ principal: a.principal, holdings: [] });
      }
    }
    return { summary: aggregate(ready), pending: pendingCount };
  }, [accounts, byPrincipal]);

  const onRemove = useCallback(
    (principal: string) => {
      void remove(principal);
    },
    [remove],
  );

  return (
    <div className="app">
      <Header
        status={status}
        onAdd={addAccount}
        onRefresh={refresh}
        onShare={openShare}
        refreshing={refreshing}
        hasAccounts={accounts.length > 0}
      />
      {error !== null ? <Banner kind="error" text={error} onDismiss={dismiss} /> : null}
      {notice !== null ? <Banner kind="notice" text={notice} onDismiss={dismiss} /> : null}

      {!loaded ? (
        <section className="card summary hero-skeleton" aria-busy="true" aria-label="Loading" />
      ) : accounts.length === 0 ? (
        <EmptyState onAdd={addAccount} status={status} />
      ) : (
        <>
          <SummaryPanel
            summary={summary}
            btcUsd={btcUsd}
            lastUpdated={lastUpdated}
            pendingAccounts={pending}
          />
          <ShareDialog open={sharing} onClose={closeShare} summary={summary} btcUsd={btcUsd} />
          <h2 className="section-title">Accounts</h2>
          <div className="accounts">
            {accounts.map((a) => (
              <AccountCard
                key={a.principal}
                account={a}
                state={byPrincipal[a.principal]}
                btcUsd={btcUsd}
                onRemove={onRemove}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
