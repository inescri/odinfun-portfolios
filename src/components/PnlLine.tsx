import { formatPnlAmount } from '../lib/shareCard';
import { formatPct, pnlPct } from '../lib/value';

interface Props {
  /** Value and cost basis over the same positions; PNL is `value - cost`. */
  valueMsats: bigint;
  costMsats: bigint | null;
  btcUsd: number | null;
}

/**
 * Unrealized PNL as `PNL +$1,234.56 (+12.3%)`, or in BTC without a rate,
 * coloured by sign. Renders nothing when the cost basis is unknown.
 */
export function PnlLine({ valueMsats, costMsats, btcUsd }: Props) {
  const pct = pnlPct(valueMsats, costMsats);
  if (pct === null || costMsats === null) return null;
  const diff = valueMsats - costMsats;
  const up = diff >= 0n;
  return (
    <div className={`value-pnl ${up ? 'pct-up-text' : 'pct-down-text'}`} title="Unrealized PNL vs. average entry">
      <span className="value-pnl-label">PNL</span> {formatPnlAmount(diff, btcUsd)} ({formatPct(pct)})
    </div>
  );
}
