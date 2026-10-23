import { CheckCircle } from 'lucide-react';

interface Props {
  kind: 'error' | 'notice';
  text: string;
  onDismiss: () => void;
}

export function Banner({ kind, text, onDismiss }: Props) {
  return (
    <div className={`banner banner-${kind}`} role={kind === 'error' ? 'alert' : 'status'}>
      <span className="banner-body">
        {kind === 'notice' ? <CheckCircle className="icon banner-icon" aria-hidden="true" /> : null}
        {text}
      </span>
      <button className="icon-button" onClick={onDismiss} aria-label="Dismiss">
        ×
      </button>
    </div>
  );
}
