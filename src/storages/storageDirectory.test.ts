import { describe, expect, it } from 'vitest';

import type { Storage } from '../api/types';
import { storageDirectory } from './storageDirectory';

function storage(changes: Partial<Storage> & Pick<Storage, 'id' | 'name'>): Storage {
  return {
    type: 'binder',
    card_count: 0,
    value: { eur: 0, usd: 0 },
    added: '2026-01-01T00:00:00Z',
    updated: '2026-01-01T00:00:00Z',
    locked: false,
    allowed_deck_ids: [],
    ...changes,
  };
}

const binder = storage({ id: 1, name: 'Classeur bleu' });
const vault = storage({ id: 2, name: 'Coffre', locked: true, allowed_deck_ids: ['deck-a'] });
const sealed = storage({ id: 3, name: 'Scellé', locked: true });

describe('storageDirectory name lookup', () => {
  it('names a storage from the list', () => {
    expect(storageDirectory([binder, vault]).nameOf(2)).toEqual({ kind: 'named', name: 'Coffre' });
  });

  it('calls a storage missing from the list an unknown storage', () => {
    expect(storageDirectory([binder]).nameOf(42)).toEqual({ kind: 'unknown' });
  });

  it('keeps a storage really named like the unknown label a named storage', () => {
    const lookalike = storage({ id: 5, name: 'Rangement inconnu' });
    expect(storageDirectory([lookalike]).nameOf(5)).toEqual({ kind: 'named', name: 'Rangement inconnu' });
  });

  it('gives no storage to a copy without storage', () => {
    expect(storageDirectory([binder]).nameOf(null)).toEqual({ kind: 'none' });
    expect(storageDirectory([binder]).nameOf(undefined)).toEqual({ kind: 'none' });
  });

  it('names nothing while the storages are loading', () => {
    expect(storageDirectory(undefined).nameOf(1)).toEqual({ kind: 'loading' });
    expect(storageDirectory(undefined).nameOf(null)).toEqual({ kind: 'none' });
  });
});

describe('storageDirectory membership', () => {
  it('tells whether a storage is in the list', () => {
    const directory = storageDirectory([binder]);
    expect(directory.has(1)).toBe(true);
    expect(directory.has(42)).toBe(false);
  });

  it('knows no storage while loading', () => {
    expect(storageDirectory(undefined).loaded).toBe(false);
    expect(storageDirectory([]).loaded).toBe(true);
  });
});

describe('storageDirectory lock check', () => {
  const directory = storageDirectory([binder, vault, sealed], 'deck-b');

  it('leaves an unlocked storage open', () => {
    expect(directory.isLocked(1)).toBe(false);
  });

  it('locks a locked storage for a deck it does not allow', () => {
    expect(directory.isLocked(2)).toBe(true);
    expect(directory.isLocked(3)).toBe(true);
  });

  it('opens a locked storage to a deck it allows', () => {
    expect(storageDirectory([vault], 'deck-a').isLocked(2)).toBe(false);
  });

  it('never locks a copy without storage or in an unknown storage', () => {
    expect(directory.isLocked(null)).toBe(false);
    expect(directory.isLocked(42)).toBe(false);
  });

  it('locks nothing without a deck', () => {
    expect(storageDirectory([vault, sealed]).isLocked(3)).toBe(false);
  });

  it('tells whether any storage is locked for the deck', () => {
    expect(directory.anyLocked).toBe(true);
    expect(storageDirectory([binder, vault], 'deck-a').anyLocked).toBe(false);
  });
});
