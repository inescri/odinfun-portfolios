import { ExternalLink, Lock, Plus } from 'lucide-react';

import { APP_ENV, ODIN_ORIGINS } from '../config';
import type { AddStatus } from '../hooks/useAddAccount';
import { OdinRunes } from './brand/OdinRunes';
import { OdinWordmark } from './brand/OdinWordmark';
import { ADD_LABEL } from './Header';

interface Props {
  onAdd: () => void;
  status: AddStatus;
}

/**
 * First-run screen, styled after odin.fun's landing: dim art, wordmark,
 * cyan runes, one quiet line, one call to action. No card chrome.
 */
export function EmptyState({ onAdd, status }: Props) {
  const origin = ODIN_ORIGINS[APP_ENV];
  const host = origin.replace(/^https?:\/\//, '');
  const idle = status === 'idle';
  return (
    <section className="empty-state">
      <div className="empty-art" aria-hidden="true" />
      <div className="empty-content">
        <OdinWordmark className="empty-wordmark" />
        <OdinRunes className="empty-runes" />
        <h2 className="empty-tagline">Every ODIN•FUN wallet. One total.</h2>
        <div className="empty-actions">
          <button className="btn btn-primary" onClick={onAdd} disabled={!idle}>
            {idle ? <Plus className="icon icon-inherit" aria-hidden="true" /> : null}
            {ADD_LABEL[status]}
          </button>
          <a className="btn btn-ghost" href={origin} target="_blank" rel="noreferrer">
            Open {host}
            <ExternalLink className="icon icon-inherit" aria-hidden="true" />
          </a>
        </div>
        <p className="empty-hint subtle small">
          To add a second wallet, switch account on {host} first, then connect again.
        </p>
        <p className="empty-privacy subtle small">
          <Lock className="icon" aria-hidden="true" />
          Stored in this browser only. Read via the ODIN•FUN public API.
        </p>
      </div>
    </section>
  );
}
