import { Bitcoin, Clock, Coins, Layers, Wallet } from 'lucide-react';

import { useCandles } from '../hooks/useCandles';
import type { PortfolioSummary } from '../lib/aggregate';
import { formatBtc, formatUsd, msatsToUsd } from '../lib/value';
import { AggregatedTokenCard } from './AggregatedTokenCard';
import { FeaturedTokenCard } from './FeaturedTokenCard';

/** How many top non-BTC tokens get the wide card with a chart. */
const FEATURED_COUNT = 3;

interface Props {
  summary: PortfolioSummary;
  btcUsd: number | null;
  lastUpdated: number | null;
  /** Number of accounts still loading or in error (not included in totals). */
  pendingAccounts: number;
}

function timeAgo(ts: number): string {
  const s = Math.max(0, Math.round((Date.now() - ts) / 1000));
  if (s < 60) return 'just now';
  const m = Math.round(s / 60);
  if (m < 60) return `${m} min ago`;
  const h = Math.round(m / 60);
  return `${h} h ago`;
}

export function SummaryPanel({ summary, btcUsd, lastUpdated, pendingAccounts }: Props) {
  // byToken is BTC first, then value desc; BTC is pinned so it never takes a featured slot.
  const featured = summary.byToken.filter((t) => t.tokenId !== 'btc').slice(0, FEATURED_COUNT);
  const featuredIds = new Set(featured.map((t) => t.tokenId));
  const rest = summary.byToken.filter((t) => !featuredIds.has(t.tokenId));
  const candles = useCandles(
    featured.map((t) => ({ tokenId: t.tokenId, seedPrice: t.price1d })),
    lastUpdated,
  );
  return (
    <section className="card summary">
      <div className="summary-top">
        <div>
          <div className="muted small">Total portfolio value</div>
          <div className="summary-total">
            {formatBtc(summary.totalMsats)} <span className="unit">BTC</span>
          </div>
          <div className="summary-usd">
            {btcUsd === null ? 'USD rate unavailable' : formatUsd(msatsToUsd(summary.totalMsats, btcUsd))}
          </div>
        </div>
        <dl className="summary-stats">
          <div>
            <dt>
              <Wallet className="icon" aria-hidden="true" />
              Accounts
            </dt>
            <dd>{summary.accountCount}</dd>
          </div>
          <div>
            <dt>
              <Coins className="icon" aria-hidden="true" />
              Tokens
            </dt>
            <dd>{summary.tokenCount}</dd>
          </div>
          <div>
            <dt>
              <Bitcoin className="icon" aria-hidden="true" />
              BTC / USD
            </dt>
            <dd>{btcUsd === null ? '—' : formatUsd(btcUsd)}</dd>
          </div>
          <div>
            <dt>
              <Clock className="icon" aria-hidden="true" />
              Updated
            </dt>
            <dd>{lastUpdated === null ? '—' : timeAgo(lastUpdated)}</dd>
          </div>
        </dl>
      </div>
      {pendingAccounts > 0 ? (
        <p className="muted small">
          {pendingAccounts} account{pendingAccounts === 1 ? '' : 's'} not yet included (loading or
          failed).
        </p>
      ) : null}
      {summary.byToken.length > 0 ? (
        <>
          <h3>
            <Layers className="icon" aria-hidden="true" />
            All holdings combined
          </h3>
          {featured.length > 0 ? (
            <div className="token-grid token-grid-featured">
              {featured.map((t) => (
                <FeaturedTokenCard
                  key={t.tokenId}
                  token={t}
                  btcUsd={btcUsd}
                  candles={candles[t.tokenId]}
                />
              ))}
            </div>
          ) : null}
          {rest.length > 0 ? (
            <div className="token-grid">
              {rest.map((t) => (
                <AggregatedTokenCard key={t.tokenId} token={t} btcUsd={btcUsd} />
              ))}
            </div>
          ) : null}
        </>
      ) : null}
    </section>
  );
}
