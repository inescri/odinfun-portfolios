import type { Candle } from '../lib/candles';
import { formatBtc, priceToMsats } from '../lib/value';

interface Props {
  candles: readonly Candle[];
  /** Used in the accessible label, e.g. "ODINDOG". */
  ticker: string;
}

const W = 240;
const H = 64;
const PAD_Y = 3;
/** Body takes this share of each slot; the rest is the gap between candles. */
const BODY_RATIO = 0.6;
const MIN_BODY_H = 1;

function fmt(price: number): string {
  return `${formatBtc(priceToMsats(price), { maxFractionDigits: 8 })} BTC`;
}

/**
 * 24 hourly candles as inline SVG. Up/down reuse the P&L chip colours, and
 * down bodies are hollow so direction survives red/green colour blindness.
 * Gap hours (no trades) are drawn muted so they read as "quiet", not as a move.
 * Stretches to the card width; wicks keep a 1px stroke via non-scaling-stroke.
 */
export function CandleChart({ candles, ticker }: Props) {
  if (candles.length === 0) return null;

  let lo = Infinity;
  let hi = -Infinity;
  for (const c of candles) {
    if (c.low < lo) lo = c.low;
    if (c.high > hi) hi = c.high;
  }
  if (hi === lo) {
    // Flat series: give it a visible band instead of dividing by zero.
    hi *= 1.01;
    lo *= 0.99;
  }
  const span = hi - lo;
  const y = (p: number) => PAD_Y + ((hi - p) / span) * (H - PAD_Y * 2);

  const slot = W / candles.length;
  const bodyW = slot * BODY_RATIO;
  const traded = candles.filter((c) => c.traded).length;
  const label = `${ticker} 24h price: low ${fmt(lo)}, high ${fmt(hi)}, ${traded} of ${candles.length} hours traded`;

  return (
    <svg
      className="candle-chart"
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="none"
      role="img"
      aria-label={label}
    >
      {candles.map((c, i) => {
        const cx = slot * i + slot / 2;
        const top = y(Math.max(c.open, c.close));
        const bottom = y(Math.min(c.open, c.close));
        const bodyH = Math.max(MIN_BODY_H, bottom - top);
        const cls = !c.traded ? 'candle-gap' : c.close >= c.open ? 'candle-up' : 'candle-down';
        const when = new Date(c.time * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        return (
          <g key={c.time} className={`candle ${cls}`}>
            <title>
              {c.traded
                ? `${when}  O ${fmt(c.open)}  H ${fmt(c.high)}  L ${fmt(c.low)}  C ${fmt(c.close)}`
                : `${when}  no trades, ${fmt(c.close)}`}
            </title>
            <line x1={cx} x2={cx} y1={y(c.high)} y2={y(c.low)} vectorEffect="non-scaling-stroke" />
            <rect
              x={cx - bodyW / 2}
              y={top}
              width={bodyW}
              height={bodyH}
              vectorEffect="non-scaling-stroke"
            />
          </g>
        );
      })}
    </svg>
  );
}
