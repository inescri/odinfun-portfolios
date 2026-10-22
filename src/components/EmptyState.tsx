interface Props {
  onAdd: () => void;
  disabled: boolean;
}

export function EmptyState({ onAdd, disabled }: Props) {
  return (
    <section className="card empty-state">
      <h2>No accounts yet</h2>
      <p className="muted">
        Connect an Odin login to see its BTC and token holdings here. Every principal you connect is
        saved in this browser only (IndexedDB) and read through Odin&apos;s public API.
      </p>
      <button className="btn btn-primary" onClick={onAdd} disabled={disabled}>
        + Add account
      </button>
    </section>
  );
}
