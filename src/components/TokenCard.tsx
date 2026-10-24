import { formatCompactAmount } from '../lib/amounts';
import type { Holding } from '../lib/holdings';
import { tokenPlaces } from '../lib/tokens';
import { TokenBackdrop } from './TokenBackdrop';
import { TokenImage } from './TokenImage';
import { priceChangePct } from '../lib/value';
import { PctChip } from './PctChip';
import { PnlLine } from './PnlLine';
import { ValueStack } from './ValueStack';

interface Props {
  holding: Holding;
  btcUsd: number | null;
}

export function TokenCard({ holding, btcUsd }: Props) {
  const change = priceChangePct(Number(holding.priceMsats), holding.price1d);
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
      <div className="token-amount-row">
        <div className="token-amount">
          {formatCompactAmount(holding.balance, tokenPlaces(holding), { abbreviate: true })}
        </div>
        {change !== null ? <PctChip change={change} title="Price change over 24h" /> : null}
      </div>
      <PnlLine valueMsats={holding.valueMsats} costMsats={holding.costMsats} btcUsd={btcUsd} />
      <ValueStack msats={holding.valueMsats} btcUsd={btcUsd} />
    </div>
  );
}
