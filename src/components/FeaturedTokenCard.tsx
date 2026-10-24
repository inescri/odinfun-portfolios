import type { CandleState } from '../hooks/useCandles';
import type { AggregatedToken } from '../lib/aggregate';
import { formatCompactAmount } from '../lib/amounts';
import { tokenPlaces } from '../lib/tokens';
import { CandleChart } from './CandleChart';
import { GainChips } from './GainChips';
import { TokenBackdrop } from './TokenBackdrop';
import { TokenImage } from './TokenImage';
import { ValueStack } from './ValueStack';

interface Props {
  token: AggregatedToken;
  btcUsd: number | null;
  candles: CandleState | undefined;
}

/** Wide card for a top holding: same facts as the compact card plus a 24h chart. */
export function FeaturedTokenCard({ token, btcUsd, candles }: Props) {
  const n = token.holders.length;
  const showSkeleton = candles === undefined || (candles.status === 'loading' && candles.candles.length === 0);
  return (
    <div className="token-card token-card-featured">
      <TokenBackdrop tokenId={token.tokenId} />
      <div className="token-card-head">
        <TokenImage tokenId={token.tokenId} ticker={token.ticker} size={44} />
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
      <div className="featured-row">
        <div className="token-amount featured-amount">
          {formatCompactAmount(token.balance, tokenPlaces(token), { abbreviate: true })}
        </div>
        <ValueStack msats={token.valueMsats} btcUsd={btcUsd} />
      </div>
      {showSkeleton ? (
        <div className="candle-chart candle-skeleton" aria-hidden="true" />
      ) : (
        <CandleChart candles={candles.candles} ticker={token.ticker} />
      )}
      <div className="subtle small">
        held by {n} account{n === 1 ? '' : 's'}
      </div>
    </div>
  );
}
