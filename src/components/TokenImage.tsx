import { useState } from 'react';

import { tokenImageUrl } from '../lib/tokenImage';

interface Props {
  tokenId: string;
  ticker: string;
  size?: number;
}

/** Token image from the Odin CDN with a ticker-initial fallback. */
export function TokenImage({ tokenId, ticker, size = 40 }: Props) {
  const [failed, setFailed] = useState(false);
  const style = { width: size, height: size };
  if (tokenId === 'btc') {
    return (
      <div className="token-img token-img-btc" style={style} aria-hidden="true">
        ₿
      </div>
    );
  }
  if (failed) {
    return (
      <div className="token-img token-img-fallback" style={style} aria-hidden="true">
        {ticker.slice(0, 2).toUpperCase()}
      </div>
    );
  }
  return (
    <img
      className="token-img"
      style={style}
      src={tokenImageUrl(tokenId)}
      alt=""
      loading="lazy"
      onError={() => setFailed(true)}
    />
  );
}
