import { ExternalLink, Lock, LogIn, Plus, RefreshCw, Wallet } from 'lucide-react';

import { APP_ENV, ODIN_ORIGINS } from '../config';
import type { AddStatus } from '../hooks/useAddAccount';
import { ADD_LABEL } from './Header';

interface Props {
  onAdd: () => void;
  status: AddStatus;
}

const STEPS = [
  { Icon: LogIn, text: 'Connect your Odin login' },
  { Icon: RefreshCw, text: 'Switch account on odin.fun' },
  { Icon: Plus, text: 'Connect again to add it' },
] as const;

/** First-run hero: one call to action, the multi-account dance, and a ghost of what you get. */
export function EmptyState({ onAdd, status }: Props) {
  const origin = ODIN_ORIGINS[APP_ENV];
  const idle = status === 'idle';
  return (
    <section className="card summary empty-state">
      <div className="empty-tile" aria-hidden="true">
        <Wallet className="empty-tile-icon" />
      </div>
      <h2>All your Odin wallets, one total.</h2>
      <p className="muted">
        Connect a login to see its BTC and token holdings. Add as many as you like.
      </p>
      <div className="empty-actions">
        <button className="btn btn-primary" onClick={onAdd} disabled={!idle}>
          {idle ? <Plus className="icon icon-inherit" aria-hidden="true" /> : null}
          {ADD_LABEL[status]}
        </button>
        <a className="btn btn-ghost" href={origin} target="_blank" rel="noreferrer">
          Open {origin.replace(/^https?:\/\//, '')}
          <ExternalLink className="icon icon-inherit" aria-hidden="true" />
        </a>
      </div>
      <ol className="empty-steps">
        {STEPS.map(({ Icon, text }, i) => (
          <li key={text}>
            <span className="empty-step-num">{i + 1}</span>
            <Icon className="icon" aria-hidden="true" />
            <span>{text}</span>
          </li>
        ))}
      </ol>
      <div className="empty-preview" aria-hidden="true">
        {[0, 1, 2].map((i) => (
          <div key={i} className="token-card token-card-featured empty-preview-card">
            <div className="token-card-head">
              <div className="empty-ghost empty-ghost-img" />
              <div className="token-card-id">
                <div className="empty-ghost empty-ghost-line" style={{ width: '40%' }} />
                <div className="empty-ghost empty-ghost-line" style={{ width: '65%' }} />
              </div>
            </div>
            <div className="empty-ghost empty-ghost-line" style={{ width: '55%', height: 18 }} />
            <div className="empty-ghost empty-ghost-chart" />
          </div>
        ))}
      </div>
      <p className="subtle small empty-privacy">
        <Lock className="icon" aria-hidden="true" />
        Stored in this browser only. Read via Odin&apos;s public API.
      </p>
    </section>
  );
}
