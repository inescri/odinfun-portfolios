import { useCallback, useEffect, useRef, useState } from 'react';
import type { OdinRequestState } from 'odin-connect';

import { odin } from '../odin/client';
import { useOdinState } from '../odin/useOdinState';
import type { StoredAccount } from '../db/db';

export type AddStatus = 'restoring' | 'idle' | 'connecting' | 'saving';

export interface AddAccountApi {
  addAccount: () => void;
  status: AddStatus;
  error: string | null;
  notice: string | null;
  dismiss: () => void;
}

function connectError(request: OdinRequestState | null): string | null {
  if (request?.action !== 'connect') return null;
  switch (request.status) {
    case 'rejected':
      return 'Connection was cancelled in the Odin window.';
    case 'unverified':
      return 'Odin could not verify this login. Try again.';
    case 'failed':
      return request.error ?? 'Connection failed. Check that popups are allowed.';
    default:
      return null;
  }
}

/**
 * Drives the "connect one more Odin login" flow.
 *
 * `connect()` is fired without `requires_api` / `requires_delegation`, so the
 * SDK verifies ownership but keeps the session in memory only. As soon as
 * `state.user` appears, the principal (plus best-effort profile) is handed to
 * `onConnected` for IndexedDB, then the SDK session is dropped so the next
 * account can be connected. Each connect request is handled at most once
 * (StrictMode-safe), and the same path serves redirect mode after a reload.
 */
export function useAddAccount(
  onConnected: (account: StoredAccount) => Promise<'added' | 'exists'>,
): AddAccountApi {
  const state = useOdinState();
  const { user, request } = state;
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const handledRef = useRef<string | null>(null);

  useEffect(() => {
    if (user === null) return;
    const key = request?.id ?? `restored:${user.principal}`;
    if (handledRef.current === key) return;
    handledRef.current = key;

    let active = true;
    setSaving(true);
    setSaveError(null);
    setNotice(null);

    (async () => {
      const principal = user.principal;
      let username: string | null = null;
      let image: string | null = null;
      try {
        const profile = await user.getUser();
        username = profile.username || null;
        image = profile.image || null;
      } catch {
        /* profile is best-effort */
      }
      const result = await onConnected({ principal, username, image, addedAt: Date.now() });
      if (!active) return;
      setNotice(
        result === 'exists'
          ? `${username ?? principal} is already in your portfolio.`
          : `Added ${username ?? principal}.`,
      );
    })()
      .catch((err: unknown) => {
        if (active) setSaveError(err instanceof Error ? err.message : 'Could not save account.');
      })
      .finally(() => {
        if (active) setSaving(false);
        // Drop the SDK session either way so the next connect starts clean.
        odin.disconnect();
      });

    return () => {
      active = false;
    };
  }, [user, request?.id, onConnected]);

  const addAccount = useCallback(() => {
    setNotice(null);
    setSaveError(null);
    // Fire and forget: the outcome lands in `state` (popup or redirect).
    void odin.connect();
  }, []);

  const dismiss = useCallback(() => {
    setNotice(null);
    setSaveError(null);
  }, []);

  let status: AddStatus = 'idle';
  if (state.status === 'initializing') status = 'restoring';
  else if (saving) status = 'saving';
  else if (request?.action === 'connect' && request.status === 'pending') status = 'connecting';

  const error = saveError ?? (saving ? null : connectError(request));

  return { addAccount, status, error, notice, dismiss };
}
