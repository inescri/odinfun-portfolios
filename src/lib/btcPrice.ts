import { odin } from '../odin/client';

interface CurrencyResponse {
  amount?: unknown;
  data?: { amount?: unknown };
}

/**
 * USD per BTC from Odin's `GET /currency/btc` (not wrapped by the SDK).
 * Same base URL the SDK uses for the configured environment.
 */
export async function fetchBtcUsd(signal?: AbortSignal): Promise<number> {
  const res = await fetch(`${odin.api.BASE_URL}/currency/btc`, { signal });
  if (!res.ok) throw new Error(`currency/btc failed: HTTP ${res.status}`);
  const json = (await res.json()) as CurrencyResponse;
  const raw = json.data?.amount ?? json.amount;
  const amount = typeof raw === 'string' ? Number(raw) : raw;
  if (typeof amount !== 'number' || !Number.isFinite(amount) || amount <= 0) {
    throw new Error('currency/btc returned no usable amount');
  }
  return amount;
}
