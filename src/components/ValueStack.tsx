import { formatBtc, formatUsdCompact, msatsToUsd } from '../lib/value';

interface Props {
  msats: bigint;
  btcUsd: number | null;
  size?: 'sm' | 'lg';
}

/** BTC value with USD underneath (when a rate is known). */
export function ValueStack({ msats, btcUsd, size = 'sm' }: Props) {
  return (
    <div className={`value-stack value-stack-${size}`}>
      <span className="value-btc">
        {formatBtc(msats, { maxFractionDigits: size === 'lg' ? 8 : 6 })} <span className="unit">BTC</span>
      </span>
      <span className="value-usd">{btcUsd === null ? '—' : formatUsdCompact(msatsToUsd(msats, btcUsd))}</span>
    </div>
  );
}
