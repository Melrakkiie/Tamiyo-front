import { describe, expect, it } from 'vitest';
import { forest } from '../scryfall/fixtures';
import { copies, pendingCard } from './boardTestHelpers';
import { entrySlotTarget, entrySources, entryTargets, ownedEntry, pendingEntry } from './deckEntries';

describe('entry targets', () => {
  const [first, second] = copies(2, forest);
  const owned = ownedEntry({ ...first, copy_ids: [first.id, second.id], quantity: 2 });
  const pending = pendingEntry(pendingCard(forest, { id: 7, quantity: 3 }));

  it('names every copy of an owned entry and the pending card of a pending one', () => {
    expect(entryTargets(owned)).toEqual([{ cardId: first.id }, { cardId: second.id }]);
    expect(entryTargets(pending)).toEqual([{ pendingId: 7 }]);
  });

  it('names the commander slot target of an entry', () => {
    expect(entrySlotTarget(owned)).toEqual({ cardId: first.id });
    expect(entrySlotTarget(pending)).toEqual({ pendingId: 7 });
  });

  it('gives the ids a bulk call takes for an entry', () => {
    expect(entrySources(owned)).toEqual({ cardIds: [first.id, second.id] });
    expect(entrySources(pending)).toEqual({ pendingIds: [7] });
  });
});
