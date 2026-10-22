import { OdinConnect } from 'odin-connect';

import { APP_ENV, APP_NAME } from '../config';

/**
 * The one `OdinConnect` instance for this page load.
 *
 * The SDK holds a single session, so this app uses it only as a *login
 * prover*: `connect()` is called without `requires_api` / `requires_delegation`,
 * which keeps the verified session in memory only (nothing hits the SDK's
 * localStorage). Once the principal is captured into IndexedDB the session is
 * dropped with `disconnect()` so the next account can be connected.
 *
 * `mode` stays at the default `"auto"`: popups in normal browsers, a full-page
 * redirect inside wallet in-app browsers.
 */
export const odin = new OdinConnect({ name: APP_NAME, env: APP_ENV });
