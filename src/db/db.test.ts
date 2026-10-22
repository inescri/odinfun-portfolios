import 'fake-indexeddb/auto';
import { beforeEach, describe, expect, it } from 'vitest';
import { IDBFactory } from 'fake-indexeddb';

import {
  deleteAccount,
  getSnapshot,
  listAccounts,
  putAccount,
  putSnapshot,
  resetDbForTests,
} from './db';
import { deserializeHolding, serializeHolding } from '../lib/holdings';
import type { Holding } from '../lib/holdings';

beforeEach(() => {
  // Fresh database per test.
  globalThis.indexedDB = new IDBFactory();
  resetDbForTests();
});

describe('accounts store', () => {
  it('adds, lists in insertion order, detects duplicates, deletes', async () => {
    expect(await putAccount({ principal: 'p1', username: 'one', image: null, addedAt: 1 })).toBe(
      'added',
    );
    expect(await putAccount({ principal: 'p2', username: null, image: null, addedAt: 2 })).toBe(
      'added',
    );
    expect(await putAccount({ principal: 'p1', username: 'uno', image: 'x', addedAt: 99 })).toBe(
      'exists',
    );

    const rows = await listAccounts();
    expect(rows.map((r) => r.principal)).toEqual(['p1', 'p2']);
    // Duplicate keeps original addedAt but refreshes profile.
    expect(rows[0]).toEqual({ principal: 'p1', username: 'uno', image: 'x', addedAt: 1 });

    await deleteAccount('p1');
    expect((await listAccounts()).map((r) => r.principal)).toEqual(['p2']);
  });
});

describe('snapshots store', () => {
  it('round-trips bigint holdings through strings and is removed with the account', async () => {
    const holding: Holding = {
      tokenId: 'foo',
      ticker: 'FOO',
      name: 'Foo',
      image: null,
      divisibility: 8,
      decimals: 3,
      balance: 123_456_789_012_345_678_901n,
      priceMsats: 42n,
      price1d: 40,
      valueMsats: 5_185_185_185n,
    };
    await putAccount({ principal: 'p1', username: null, image: null, addedAt: 1 });
    await putSnapshot({
      principal: 'p1',
      fetchedAt: 123,
      btcUsd: 100_000,
      items: [serializeHolding(holding)],
    });

    const snap = await getSnapshot('p1');
    expect(snap?.fetchedAt).toBe(123);
    expect(snap?.items.map(deserializeHolding)).toEqual([holding]);

    await deleteAccount('p1');
    expect(await getSnapshot('p1')).toBeUndefined();
  });
});
