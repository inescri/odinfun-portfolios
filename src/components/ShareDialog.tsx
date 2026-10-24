import { Copy, Download, Share2, X } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';

import type { PortfolioSummary } from '../lib/aggregate';
import { renderShareCard } from '../lib/renderShareCard';
import { buildShareCard, shareCardFileName } from '../lib/shareCard';
import { tokenImageUrl } from '../lib/tokenImage';
import { canCopyImage, canShareFile, copyImage, downloadBlob, shareFile } from '../lib/shareTargets';

interface Props {
  open: boolean;
  onClose: () => void;
  summary: PortfolioSummary;
  btcUsd: number | null;
}

type Render = { status: 'rendering' } | { status: 'ready'; blob: Blob; url: string } | { status: 'error'; message: string };

const SHARE_TEXT = 'My ODIN•FUN portfolio';
const SITE_URL: string = (import.meta.env.VITE_SITE_URL as string | undefined) ?? '';
const FOOTER = SITE_URL.replace(/^https?:\/\//, '').replace(/\/+$/, '');

/**
 * Renders the portfolio to a 1200×630 PNG in the browser and offers it for
 * download, clipboard, or the OS share sheet. The card never includes
 * principals or usernames, and "Hide amounts" masks every value so the
 * holdings can be shown without the size.
 */
export function ShareDialog({ open, onClose, summary, btcUsd }: Props) {
  const ref = useRef<HTMLDialogElement>(null);
  const [hideAmounts, setHideAmounts] = useState(false);
  const [render, setRender] = useState<Render>({ status: 'rendering' });
  const [note, setNote] = useState<string | null>(null);

  // Native <dialog> handles focus trap, Escape and the backdrop.
  useEffect(() => {
    const el = ref.current;
    if (el === null) return;
    if (open && !el.open) el.showModal();
    else if (!open && el.open) el.close();
  }, [open]);

  const file = useMemo(
    () => (render.status === 'ready' ? new File([render.blob], shareCardFileName(), { type: 'image/png' }) : null),
    [render],
  );

  useEffect(() => {
    if (!open) return;
    let active = true;
    let url: string | null = null;
    setRender({ status: 'rendering' });
    setNote(null);
    const data = buildShareCard(summary, btcUsd, { hideAmounts });
    renderShareCard(data, { tokenImageUrl, footerText: FOOTER })
      .then((blob) => {
        if (!active) return;
        url = URL.createObjectURL(blob);
        setRender({ status: 'ready', blob, url });
      })
      .catch((err: unknown) => {
        if (!active) return;
        setRender({
          status: 'error',
          message: err instanceof Error ? err.message : 'Could not render the card.',
        });
      });
    return () => {
      active = false;
      if (url !== null) URL.revokeObjectURL(url);
    };
  }, [open, summary, btcUsd, hideAmounts]);

  const ready = render.status === 'ready';
  const showCopy = canCopyImage();
  const showShare = file !== null && canShareFile(file);

  const onDownload = () => {
    if (render.status !== 'ready') return;
    downloadBlob(render.blob, shareCardFileName());
    setNote('Saved. Attach it to your post.');
  };
  const onCopy = async () => {
    if (render.status !== 'ready') return;
    try {
      await copyImage(render.blob);
      setNote('Copied. Paste it into your post.');
    } catch {
      setNote('Copy failed in this browser. Use Download instead.');
    }
  };
  const onShare = async () => {
    if (file === null) return;
    try {
      const sent = await shareFile(file, SHARE_TEXT);
      if (sent) onClose();
    } catch {
      setNote('Sharing failed in this browser. Use Download instead.');
    }
  };

  return (
    <dialog
      ref={ref}
      className="share-dialog"
      onClose={onClose}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      aria-labelledby="share-title"
    >
      <div className="share-body">
        <div className="share-head">
          <h2 id="share-title">Share your portfolio</h2>
          <button className="icon-button" onClick={onClose} aria-label="Close">
            <X className="icon" aria-hidden="true" />
          </button>
        </div>

        <div className="share-preview" aria-busy={render.status === 'rendering'}>
          {render.status === 'ready' ? (
            <img src={render.url} alt="Preview of your portfolio card" width={1200} height={630} />
          ) : render.status === 'error' ? (
            <p className="share-error">{render.message}</p>
          ) : (
            <p className="muted small">Rendering…</p>
          )}
        </div>

        <label className="share-toggle">
          <input
            type="checkbox"
            checked={hideAmounts}
            onChange={(e) => setHideAmounts(e.target.checked)}
          />
          Hide amounts
          <span className="subtle small">Show tokens and allocation, not the size</span>
        </label>

        <div className="share-actions">
          {showShare ? (
            <button className="btn btn-primary" onClick={() => void onShare()} disabled={!ready}>
              <Share2 className="icon icon-inherit" aria-hidden="true" />
              Share…
            </button>
          ) : null}
          <button
            className={`btn ${showShare ? 'btn-outline' : 'btn-primary'}`}
            onClick={onDownload}
            disabled={!ready}
          >
            <Download className="icon icon-inherit" aria-hidden="true" />
            Download PNG
          </button>
          {showCopy ? (
            <button className="btn btn-outline" onClick={() => void onCopy()} disabled={!ready}>
              <Copy className="icon icon-inherit" aria-hidden="true" />
              Copy image
            </button>
          ) : null}
        </div>

        <p className="subtle small share-note" role="status">
          {note ?? 'Rendered on this device. Wallet addresses are never included.'}
        </p>
      </div>
    </dialog>
  );
}
