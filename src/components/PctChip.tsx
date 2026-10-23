import { formatPct } from '../lib/value';

interface Props {
  /** Percent change; the caller hides the chip when unknown. */
  change: number;
}

/** 24h price change pill with a ▲/▼ glyph for colour-blind readers. */
export function PctChip({ change }: Props) {
  const up = change >= 0;
  return (
    <span className={`pct ${up ? 'pct-up' : 'pct-down'}`}>
      <span className="pct-glyph" aria-hidden="true">
        {up ? '▲' : '▼'}
      </span>
      {formatPct(change)}
    </span>
  );
}
