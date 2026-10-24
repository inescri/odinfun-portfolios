import type { AggregatedToken } from '../lib/aggregate';
import { formatCompactAmount } from '../lib/amounts';
import { tokenPlaces } from '../lib/tokens';
import { GainChips } from './GainChips';
import { TokenBackdrop } from './TokenBackdrop';
import { TokenImage } from './TokenImage';
import { ValueStack } from './ValueStack';

interface Props {
  token: AggregatedToken;
  btcUsd: number | null;
}

export function AggregatedTokenCard({ token, btcUsd }: Props) {
  const n = token.holders.length;
  return (
    <div className="token-card">
      <TokenBackdrop tokenId={token.tokenId} />
      <div className="token-card-head">
        <TokenImage tokenId={token.tokenId} ticker={token.ticker} />
        <div className="token-card-id">
          <div className="token-ticker">{token.ticker}</div>
          <div className="token-name muted">{token.name}</div>
        </div>
      </div>
      <GainChips
        priceMsats={token.priceMsats}
        price1d={token.price1d}
        valueMsats={token.pnlValueMsats}
        costMsats={token.costMsats}
        btcUsd={btcUsd}
      />
      <div className="token-amount-row">
        <div className="token-amount">
          {formatCompactAmount(token.balance, tokenPlaces(token), { abbreviate: true })}
        </div>
      </div>
      <ValueStack msats={token.valueMsats} btcUsd={btcUsd} />
      <div className="subtle small">
        held by {n} account{n === 1 ? '' : 's'}
      </div>
    </div>
  );
}
