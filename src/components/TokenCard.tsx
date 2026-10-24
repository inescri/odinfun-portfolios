import { formatCompactAmount } from '../lib/amounts';
import type { Holding } from '../lib/holdings';
import { tokenPlaces } from '../lib/tokens';
import { GainChips } from './GainChips';
import { TokenBackdrop } from './TokenBackdrop';
import { TokenImage } from './TokenImage';
import { ValueStack } from './ValueStack';

interface Props {
  holding: Holding;
  btcUsd: number | null;
}

export function TokenCard({ holding, btcUsd }: Props) {
  return (
    <div className="token-card">
      <TokenBackdrop tokenId={holding.tokenId} />
      <div className="token-card-head">
        <TokenImage tokenId={holding.tokenId} ticker={holding.ticker} size={36} />
        <div className="token-card-id">
          <div className="token-ticker">{holding.ticker}</div>
          <div className="token-name muted">{holding.name}</div>
        </div>
      </div>
      <GainChips
        priceMsats={holding.priceMsats}
        price1d={holding.price1d}
        valueMsats={holding.valueMsats}
        costMsats={holding.costMsats}
        btcUsd={btcUsd}
      />
      <div className="token-amount-row">
        <div className="token-amount">
          {formatCompactAmount(holding.balance, tokenPlaces(holding), { abbreviate: true })}
        </div>
      </div>
      <ValueStack msats={holding.valueMsats} btcUsd={btcUsd} />
    </div>
  );
}
