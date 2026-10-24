import { formatBtc, formatUsd, msatsToUsd, pnlPct, priceChangePct } from '../lib/value';
import { PctChip } from './PctChip';

interface Props {
  priceMsats: bigint;
  price1d: number | null;
  /** Value and cost basis over the same positions, so PNL is `value - cost`. */
  valueMsats: bigint | null;
  costMsats: bigint | null;
  btcUsd: number | null;
  className?: string;
}

/** Absolute gain for the PNL tooltip: `+$12.34` or `+0.0012 BTC`. */
function gainTitle(valueMsats: bigint, costMsats: bigint, btcUsd: number | null): string {
  const pnl = valueMsats - costMsats;
  const sign = pnl < 0n ? '-' : '+';
  const abs = pnl < 0n ? -pnl : pnl;
  const amount =
    btcUsd === null
      ? `${formatBtc(abs, { maxFractionDigits: 6 })} BTC`
      : formatUsd(msatsToUsd(abs, btcUsd));
  return `Unrealized PNL ${sign}${amount} vs. average entry`;
}

/** The 24h price move and unrealized PNL side by side; each hidden when unknown. */
export function GainChips({ priceMsats, price1d, valueMsats, costMsats, btcUsd, className }: Props) {
  const day = priceChangePct(Number(priceMsats), price1d);
  const pnl = valueMsats === null ? null : pnlPct(valueMsats, costMsats);
  if (day === null && pnl === null) return null;
  return (
    <span className={`gain-chips${className ? ` ${className}` : ''}`}>
      {day !== null ? <PctChip change={day} label="24h" title="Price change over 24h" /> : null}
      {pnl !== null && valueMsats !== null && costMsats !== null ? (
        <PctChip change={pnl} label="PNL" title={gainTitle(valueMsats, costMsats, btcUsd)} />
      ) : null}
    </span>
  );
}
