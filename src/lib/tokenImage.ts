import { OdinUtils } from 'odin-connect';

import { APP_ENV } from '../config';

/** CDN URL for a token's image in the configured environment. */
export function tokenImageUrl(tokenId: string): string {
  return OdinUtils.buildTokenImageUrl(tokenId, APP_ENV);
}
