import { formatBtc, formatPct, formatUsd, msatsToUsd, pnlPct } from '../lib/value';

interface Pnl {
  /** Value and cost basis over the same positions; PNL is `value - cost`. */
  valueMsats: bigint;
  costMsats: bigint | null;
}

interface Props {
  msats: bigint;
  btcUsd: number | null;
  size?: 'sm' | 'lg';
  /** When given and the cost basis is known, a third line shows unrealized PNL. */
  pnl?: Pnl;
}

/** `+$1,234.56 (+12.3%)`, or `+0.0012 BTC (+12.3%)` without a rate. */
function pnlLine(pnl: Pnl, btcUsd: number | null): { text: string; up: boolean } | null {
  const pct = pnlPct(pnl.valueMsats, pnl.costMsats);
  if (pct === null || pnl.costMsats === null) return null;
  const diff = pnl.valueMsats - pnl.costMsats;
  const up = diff >= 0n;
  const abs = up ? diff : -diff;
  const amount =
    btcUsd === null
      ? `${formatBtc(abs, { maxFractionDigits: 6 })} BTC`
      : formatUsd(msatsToUsd(abs, btcUsd));
  return { text: `${up ? '+' : '-'}${amount} (${formatPct(pct)})`, up };
}

/** BTC value with USD underneath (when a rate is known), and optionally unrealized PNL. */
export function ValueStack({ msats, btcUsd, size = 'sm', pnl }: Props) {
  const line = pnl === undefined ? null : pnlLine(pnl, btcUsd);
  return (
    <div className={`value-stack value-stack-${size}`}>
      <span className="value-btc">
        {formatBtc(msats, { maxFractionDigits: size === 'lg' ? 8 : 6 })} <span className="unit">BTC</span>
      </span>
      <span className="value-usd">{btcUsd === null ? '—' : formatUsd(msatsToUsd(msats, btcUsd))}</span>
      {line !== null ? (
        <span
          className={`value-pnl ${line.up ? 'pct-up-text' : 'pct-down-text'}`}
          title="Unrealized PNL vs. average entry"
        >
          <span className="value-pnl-label">PNL</span> {line.text}
        </span>
      ) : null}
    </div>
  );
}
