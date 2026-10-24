import { openDB } from 'idb';
import type { DBSchema, IDBPDatabase } from 'idb';

/** A connected Odin login, keyed by principal. */
export interface StoredAccount {
  principal: string;
  username: string | null;
  image: string | null;
  /** Unix ms when the account was added. */
  addedAt: number;
}

/** A holding as stored: bigints serialised as decimal strings. */
export interface SerializedHolding {
  tokenId: string;
  ticker: string;
  name: string;
  image: string | null;
  divisibility: number;
  decimals: number;
  balance: string;
  priceMsats: string;
  price1d: number | null;
  valueMsats: string;
  /** Cost basis, millisats as string; null/absent when unknown. */
  costMsats?: string | null;
}

/** Last successful holdings fetch for an account (stale-while-revalidate). */
export interface StoredSnapshot {
  principal: string;
  fetchedAt: number;
  btcUsd: number | null;
  items: SerializedHolding[];
}

interface PortfolioDB extends DBSchema {
  accounts: { key: string; value: StoredAccount; indexes: { addedAt: number } };
  snapshots: { key: string; value: StoredSnapshot };
}

export const DB_NAME = 'odin-portfolio';
const DB_VERSION = 1;

let dbPromise: Promise<IDBPDatabase<PortfolioDB>> | null = null;

export function getDb(): Promise<IDBPDatabase<PortfolioDB>> {
  if (dbPromise === null) {
    dbPromise = openDB<PortfolioDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        const accounts = db.createObjectStore('accounts', { keyPath: 'principal' });
        accounts.createIndex('addedAt', 'addedAt');
        db.createObjectStore('snapshots', { keyPath: 'principal' });
      },
    });
  }
  return dbPromise;
}

/** Test hook: drop the cached connection so a fresh DB can be opened. */
export function resetDbForTests(): void {
  dbPromise = null;
}

export async function listAccounts(): Promise<StoredAccount[]> {
  const db = await getDb();
  return db.getAllFromIndex('accounts', 'addedAt');
}

export async function getAccount(principal: string): Promise<StoredAccount | undefined> {
  const db = await getDb();
  return db.get('accounts', principal);
}

/** Insert or update; returns whether the principal was already stored. */
export async function putAccount(account: StoredAccount): Promise<'added' | 'exists'> {
  const db = await getDb();
  const tx = db.transaction('accounts', 'readwrite');
  const existing = await tx.store.get(account.principal);
  if (existing === undefined) {
    await tx.store.put(account);
  } else {
    // Keep the original addedAt so ordering is stable; refresh profile fields.
    await tx.store.put({ ...existing, username: account.username, image: account.image });
  }
  await tx.done;
  return existing === undefined ? 'added' : 'exists';
}

export async function deleteAccount(principal: string): Promise<void> {
  const db = await getDb();
  const tx = db.transaction(['accounts', 'snapshots'], 'readwrite');
  await Promise.all([
    tx.objectStore('accounts').delete(principal),
    tx.objectStore('snapshots').delete(principal),
    tx.done,
  ]);
}

export async function getSnapshot(principal: string): Promise<StoredSnapshot | undefined> {
  const db = await getDb();
  return db.get('snapshots', principal);
}

export async function putSnapshot(snapshot: StoredSnapshot): Promise<void> {
  const db = await getDb();
  await db.put('snapshots', snapshot);
}
