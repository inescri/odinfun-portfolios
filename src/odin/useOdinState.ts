import { useSyncExternalStore } from 'react';
import type { OdinState } from 'odin-connect';

import { odin } from './client';

/** Subscribe a component to the SDK's state store: `{ status, user, request }`. */
export function useOdinState(): OdinState {
  return useSyncExternalStore(odin.subscribe, odin.getState, odin.getServerState);
}
