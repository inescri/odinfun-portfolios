interface Props {
  kind: 'error' | 'notice';
  text: string;
  onDismiss: () => void;
}

export function Banner({ kind, text, onDismiss }: Props) {
  return (
    <div className={`banner banner-${kind}`} role={kind === 'error' ? 'alert' : 'status'}>
      <span>{text}</span>
      <button className="icon-button" onClick={onDismiss} aria-label="Dismiss">
        ×
      </button>
    </div>
  );
}
