import { describe, expect, it } from 'vitest';
import { forest, grizzlyBears } from '../../scryfall/fixtures';
import { copies, pendingCard } from '../boardTestHelpers';
import { ownedEntry, pendingEntry } from '../deckEntries';
import type { PlanDeck } from './requests';
import { heldSlot, ownSlot } from './slots';

const deck: PlanDeck = { id: 'deck-1', commander_id: null, partner_id: null };

const cards = copies(3, grizzlyBears);
const ids = cards.map((card) => card.id);
const stack = ownedEntry({ ...cards[0], copy_ids: ids, quantity: 3 });

describe('the commander slot of an entry', () => {
  it('is held when any copy of a stack holds it', () => {
    expect(heldSlot({ ...deck, commander_id: ids[2] }, stack)).toEqual({
      slot: 'commander',
      target: { cardId: ids[2] },
    });
    expect(heldSlot({ ...deck, partner_id: ids[1] }, stack)).toEqual({ slot: 'partner', target: { cardId: ids[1] } });
  });

  it('is held by a pending card through its own id', () => {
    const entry = pendingEntry(pendingCard(forest, { id: 40 }));

    expect(heldSlot({ ...deck, partner_pending_id: 40 }, entry)).toEqual({
      slot: 'partner',
      target: { pendingId: 40 },
    });
  });

  it('is not held by an entry that holds no slot', () => {
    expect(heldSlot({ ...deck, commander_id: 999 }, stack)).toBeNull();
  });

  it('is the entry own slot only when its own copy holds it', () => {
    expect(ownSlot({ ...deck, commander_id: ids[0] }, stack)).toBe('commander');
    expect(ownSlot({ ...deck, partner_id: ids[0] }, stack)).toBe('partner');
    expect(ownSlot({ ...deck, commander_id: ids[2] }, stack)).toBeNull();
  });

  it('is the own slot of a pending entry through its pending id', () => {
    const entry = pendingEntry(pendingCard(forest, { id: 41 }));

    expect(ownSlot({ ...deck, commander_pending_id: 41 }, entry)).toBe('commander');
    expect(ownSlot(deck, entry)).toBeNull();
  });
});
