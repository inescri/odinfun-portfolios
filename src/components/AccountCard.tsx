import { useState } from 'react';

import type { StoredAccount } from '../db/db';
import type { AccountState } from '../hooks/useHoldings';
import { odin } from '../odin/client';
import { sumMsats } from '../lib/holdings';
import { shortPrincipal } from '../lib/tokens';
import { TokenCard } from './TokenCard';
import { ValueStack } from './ValueStack';

interface Props {
  account: StoredAccount;
  state: AccountState | undefined;
  btcUsd: number | null;
  onRemove: (principal: string) => void;
}

export function AccountCard({ account, state, btcUsd, onRemove }: Props) {
  const [avatarFailed, setAvatarFailed] = useState(false);
  const [copied, setCopied] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const holdings = state?.holdings ?? [];
  const label = account.username ?? shortPrincipal(account.principal);

  const copy = () => {
    navigator.clipboard
      ?.writeText(account.principal)
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 1200);
      })
      .catch(() => undefined);
  };

  return (
    <section className="card account">
      <div className="account-head">
        {avatarFailed ? (
          <div className="avatar avatar-fallback">{label.slice(0, 1).toUpperCase()}</div>
        ) : (
          <img
            className="avatar"
            src={odin.api.getUserAvatarUrl(account.principal)}
            alt=""
            onError={() => setAvatarFailed(true)}
          />
        )}
        <div className="account-id">
          <div className="account-name">{label}</div>
          <button className="principal" onClick={copy} title={account.principal}>
            <code>{shortPrincipal(account.principal)}</code> {copied ? '✓ copied' : '⧉'}
          </button>
        </div>
        <div className="account-value">
          <ValueStack msats={sumMsats(holdings)} btcUsd={btcUsd} size="lg" />
          {state?.stale ? <span className="muted small">updating…</span> : null}
        </div>
        <div className="account-actions">
          {confirming ? (
            <>
              <button className="btn btn-sm btn-danger" onClick={() => onRemove(account.principal)}>
                Remove
              </button>
              <button className="btn btn-sm btn-outline" onClick={() => setConfirming(false)}>
                Cancel
              </button>
            </>
          ) : (
            <button className="btn btn-sm btn-ghost" onClick={() => setConfirming(true)}>
              Remove
            </button>
          )}
        </div>
      </div>

      {state?.status === 'error' ? (
        <p className="error small">Could not load holdings: {state.error}</p>
      ) : null}

      {state === undefined || (state.status === 'loading' && holdings.length === 0) ? (
        <div className="token-grid">
          {[0, 1, 2].map((i) => (
            <div key={i} className="token-card skeleton" />
          ))}
        </div>
      ) : holdings.length === 0 ? (
        <p className="muted">No holdings.</p>
      ) : (
        <div className="token-grid">
          {holdings.map((h) => (
            <TokenCard key={h.tokenId} holding={h} btcUsd={btcUsd} />
          ))}
        </div>
      )}
    </section>
  );
}
