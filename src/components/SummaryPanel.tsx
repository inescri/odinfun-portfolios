import type { PortfolioSummary } from '../lib/aggregate';
import { formatBtc, formatUsd, msatsToUsd } from '../lib/value';
import { AggregatedTokenCard } from './AggregatedTokenCard';

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
            <dt>Accounts</dt>
            <dd>{summary.accountCount}</dd>
          </div>
          <div>
            <dt>Tokens</dt>
            <dd>{summary.tokenCount}</dd>
          </div>
          <div>
            <dt>BTC / USD</dt>
            <dd>{btcUsd === null ? '—' : formatUsd(btcUsd)}</dd>
          </div>
          <div>
            <dt>Updated</dt>
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
          <h3>All holdings combined</h3>
          <div className="token-grid">
            {summary.byToken.map((t) => (
              <AggregatedTokenCard key={t.tokenId} token={t} btcUsd={btcUsd} />
            ))}
          </div>
        </>
      ) : null}
    </section>
  );
}
