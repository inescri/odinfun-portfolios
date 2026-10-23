import { useState } from 'react';

import { tokenImageUrl } from '../lib/tokenImage';

interface Props {
  tokenId: string;
}

/**
 * Token artwork as a faded card background. BTC has no CDN image, so it gets
 * an orange wash instead; a failed load renders nothing and the card stays flat.
 */
export function TokenBackdrop({ tokenId }: Props) {
  const [failed, setFailed] = useState(false);
  if (tokenId === 'btc') {
    return <div className="token-backdrop token-backdrop-btc" aria-hidden="true" />;
  }
  if (failed) return null;
  return (
    <img
      className="token-backdrop"
      src={tokenImageUrl(tokenId)}
      alt=""
      loading="lazy"
      aria-hidden="true"
      onError={() => setFailed(true)}
    />
  );
}
