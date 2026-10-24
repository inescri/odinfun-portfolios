import { formatPct } from '../lib/value';

interface Props {
  /** Percent change; the caller hides the chip when unknown. */
  change: number;
  /** Short prefix such as `24h` or `PNL`, shown muted inside the chip. */
  label?: string;
  /** Tooltip, e.g. the absolute gain. */
  title?: string;
}

/** Percent pill with a ▲/▼ glyph for colour-blind readers. */
export function PctChip({ change, label, title }: Props) {
  const up = change >= 0;
  return (
    <span className={`pct ${up ? 'pct-up' : 'pct-down'}`} title={title}>
      {label !== undefined ? <span className="pct-label">{label}</span> : null}
      <span className="pct-glyph" aria-hidden="true">
        {up ? '▲' : '▼'}
      </span>
      {formatPct(change)}
    </span>
  );
}
