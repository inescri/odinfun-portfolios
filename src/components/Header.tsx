import { Bitcoin, Plus, RefreshCw, Share2 } from 'lucide-react';

import { SITE_NAME } from '../brand';
import { APP_ENV, ODIN_ORIGINS } from '../config';
import type { AddStatus } from '../hooks/useAddAccount';
import { formatUsd } from '../lib/value';

interface Props {
  status: AddStatus;
  onAdd: () => void;
  onRefresh: () => void;
  onShare: () => void;
  refreshing: boolean;
  hasAccounts: boolean;
  /** False until at least one account has a snapshot; an empty card is not worth sharing. */
  canShare: boolean;
  /** Current BTC/USD rate, or null while unknown. */
  btcUsd: number | null;
}

export const ADD_LABEL: Record<AddStatus, string> = {
  restoring: 'Loading…',
  idle: 'Add account',
  connecting: 'Waiting for ODIN•FUN…',
  saving: 'Saving…',
};

export function Header({
  status,
  onAdd,
  onRefresh,
  onShare,
  refreshing,
  hasAccounts,
  canShare,
  btcUsd,
}: Props) {
  const origin = ODIN_ORIGINS[APP_ENV];
  return (
    <header className="app-header">
      <div className="title-block">
        <h1>
          {SITE_NAME}
          {APP_ENV !== 'prod' ? <span className="env-badge">{APP_ENV}</span> : null}
        </h1>
        {hasAccounts ? (
          <p className="muted small">
            Connect as many ODIN•FUN logins as you like. To add another, switch account on{' '}
            <a href={origin} target="_blank" rel="noreferrer">
              {origin.replace(/^https?:\/\//, '')}
            </a>{' '}
            first.
          </p>
        ) : null}
      </div>
      {/* With no accounts the empty state owns the only call to action. */}
      {hasAccounts ? (
        <div className="header-controls">
          <div className="header-rate" title="BTC / USD">
            <Bitcoin className="icon" aria-hidden="true" />
            <span className="muted small">BTC / USD</span>
            <strong>{btcUsd === null ? '—' : formatUsd(btcUsd)}</strong>
          </div>
          <button className="btn btn-outline" onClick={onShare} disabled={!canShare}>
            <Share2 className="icon icon-inherit" aria-hidden="true" />
            Share
          </button>
          <button className="btn btn-outline" onClick={onRefresh} disabled={refreshing}>
            <RefreshCw
              className={`icon icon-inherit${refreshing ? ' icon-spin' : ''}`}
              aria-hidden="true"
            />
            {refreshing ? 'Refreshing…' : 'Refresh'}
          </button>
          <button className="btn btn-primary" onClick={onAdd} disabled={status !== 'idle'}>
            {status === 'idle' ? <Plus className="icon icon-inherit" aria-hidden="true" /> : null}
            {ADD_LABEL[status]}
          </button>
        </div>
      ) : null}
    </header>
  );
}
