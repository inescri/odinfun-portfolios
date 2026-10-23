import { formatCompactAmount } from '../lib/amounts';
import type { Holding } from '../lib/holdings';
import { tokenPlaces } from '../lib/tokens';
import { formatPct, priceChangePct } from '../lib/value';
import { TokenImage } from './TokenImage';
import { ValueStack } from './ValueStack';

interface Props {
  holding: Holding;
  btcUsd: number | null;
}

export function TokenCard({ holding, btcUsd }: Props) {
  const change = priceChangePct(Number(holding.priceMsats), holding.price1d);
  return (
    <div className="token-card">
      <div className="token-card-head">
        <TokenImage tokenId={holding.tokenId} ticker={holding.ticker} size={36} />
        <div className="token-card-id">
          <div className="token-ticker">{holding.ticker}</div>
          <div className="token-name muted">{holding.name}</div>
        </div>
      </div>
      <div className="token-amount-row">
        <div className="token-amount">
          {formatCompactAmount(holding.balance, tokenPlaces(holding), { abbreviate: true })}
        </div>
        {change !== null ? (
          <span className={`pct ${change >= 0 ? 'pct-up' : 'pct-down'}`}>
            <span className="pct-glyph" aria-hidden="true">
              {change >= 0 ? '▲' : '▼'}
            </span>
            {formatPct(change)}
          </span>
        ) : null}
      </div>
      <ValueStack msats={holding.valueMsats} btcUsd={btcUsd} />
    </div>
  );
}
