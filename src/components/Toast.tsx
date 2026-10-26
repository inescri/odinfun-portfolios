import { useEffect } from 'react';
import { CheckCircle } from 'lucide-react';

interface Props {
  kind: 'error' | 'notice';
  text: string;
  onDismiss: () => void;
}

const NOTICE_MS = 4000;

/** Bottom-centre toast. Notices auto-dismiss; errors stay until closed. */
export function Toast({ kind, text, onDismiss }: Props) {
  useEffect(() => {
    if (kind !== 'notice') return;
    const id = setTimeout(onDismiss, NOTICE_MS);
    return () => clearTimeout(id);
  }, [kind, text, onDismiss]);

  return (
    <div className={`toast toast-${kind}`} role={kind === 'error' ? 'alert' : 'status'}>
      <span className="toast-body">
        {kind === 'notice' ? <CheckCircle className="icon toast-icon" aria-hidden="true" /> : null}
        {text}
      </span>
      <button className="icon-button" onClick={onDismiss} aria-label="Dismiss">
        ×
      </button>
    </div>
  );
}
