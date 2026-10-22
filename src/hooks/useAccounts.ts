import { useCallback, useEffect, useState } from 'react';

import { deleteAccount, listAccounts, putAccount } from '../db/db';
import type { StoredAccount } from '../db/db';

export interface AccountsApi {
  accounts: StoredAccount[];
  /** False until IndexedDB has been read once. */
  loaded: boolean;
  add: (account: StoredAccount) => Promise<'added' | 'exists'>;
  remove: (principal: string) => Promise<void>;
}

/** Connected accounts, backed by IndexedDB. */
export function useAccounts(): AccountsApi {
  const [accounts, setAccounts] = useState<StoredAccount[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let active = true;
    listAccounts()
      .then((rows) => {
        if (active) setAccounts(rows);
      })
      .catch((err: unknown) => {
        console.error('Failed to read accounts from IndexedDB', err);
      })
      .finally(() => {
        if (active) setLoaded(true);
      });
    return () => {
      active = false;
    };
  }, []);

  const add = useCallback(async (account: StoredAccount): Promise<'added' | 'exists'> => {
    const result = await putAccount(account);
    setAccounts(await listAccounts());
    return result;
  }, []);

  const remove = useCallback(async (principal: string): Promise<void> => {
    await deleteAccount(principal);
    setAccounts((prev) => prev.filter((a) => a.principal !== principal));
  }, []);

  return { accounts, loaded, add, remove };
}
