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
    expect(storageDirectory([binder, vault]).nameOf(2)).toBe('Coffre');
  });

  it('calls a storage missing from the list an unknown storage', () => {
    expect(storageDirectory([binder]).nameOf(42)).toBe('Rangement inconnu');
  });

  it('gives no name to a copy without storage', () => {
    expect(storageDirectory([binder]).nameOf(null)).toBeNull();
    expect(storageDirectory([binder]).nameOf(undefined)).toBeNull();
  });
});
