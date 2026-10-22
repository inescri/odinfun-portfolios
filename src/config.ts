import type { OdinConnect } from 'odin-connect';

/**
 * Odin environments this app supports. Kept as a runtime array so the value
 * from `.env` can be validated; `satisfies` makes the build fail if the SDK's
 * environment union ever changes.
 */
const ODIN_ENVS = [
  'prod',
  'staging',
  'dev',
  'local',
  'legacy',
] as const satisfies readonly OdinConnect['currentEnv'][];
export type OdinEnv = (typeof ODIN_ENVS)[number];

/** Validate `VITE_ODIN_ENV`; fail loudly at module load on a typo. */
export function parseOdinEnv(raw: string | undefined): OdinEnv {
  if (raw === undefined || raw === '') return 'prod';
  if ((ODIN_ENVS as readonly string[]).includes(raw)) return raw as OdinEnv;
  throw new Error(
    `VITE_ODIN_ENV="${raw}" is not a valid Odin environment. ` +
      `Expected one of: ${ODIN_ENVS.join(', ')}`,
  );
}

export const APP_NAME: string = import.meta.env.VITE_ODIN_APP_NAME ?? 'Odin Portfolio';
export const APP_ENV: OdinEnv = parseOdinEnv(import.meta.env.VITE_ODIN_ENV);

/** Where the user must switch accounts before adding another principal. */
export const ODIN_ORIGINS: Record<OdinEnv, string> = {
  prod: 'https://odin.fun',
  staging: 'https://staging.odin.fun',
  dev: 'https://dev.odin.fun',
  local: 'http://localhost:5173',
  legacy: 'https://legacy.odin.fun',
};
