import type { AggregatedToken } from '../lib/aggregate';
import { formatCompactAmount } from '../lib/amounts';
import { tokenPlaces } from '../lib/tokens';
import { formatPct, priceChangePct } from '../lib/value';
import { TokenImage } from './TokenImage';
import { ValueStack } from './ValueStack';

interface Props {
  token: AggregatedToken;
  btcUsd: number | null;
}

export function AggregatedTokenCard({ token, btcUsd }: Props) {
  const change = priceChangePct(Number(token.priceMsats), token.price1d);
  const n = token.holders.length;
  return (
    <div className="token-card">
      <div className="token-card-head">
        <TokenImage tokenId={token.tokenId} ticker={token.ticker} />
        <div className="token-card-id">
          <div className="token-ticker">{token.ticker}</div>
          <div className="token-name muted">{token.name}</div>
        </div>
      </div>
      <div className="token-amount-row">
        <div className="token-amount">
          {formatCompactAmount(token.balance, tokenPlaces(token), { abbreviate: true })}
        </div>
        {change !== null ? (
          <span className={`pct ${change >= 0 ? 'pct-up' : 'pct-down'}`}>{formatPct(change)}</span>
        ) : null}
      </div>
      <ValueStack msats={token.valueMsats} btcUsd={btcUsd} />
      <div className="muted small">
        held by {n} account{n === 1 ? '' : 's'}
      </div>
    </div>
  );
}
