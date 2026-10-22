import type { DeckEntry, PendingEntry } from '../deckEntries';
import type { Plan, PlanDeck } from './requests';

export interface AddToCollection {
  kind: 'addToCollection';
  // Without a storage the copies go into the collection unsorted.
  storageId?: number | null;
  // Without a count every pending copy is committed.
  count?: number;
}

// Commits the pending copies into the collection (ADR-0004).
function commitPending(deck: PlanDeck, entry: PendingEntry, { storageId = null, count }: AddToCollection): Plan {
  const { pending } = entry;
  const committed = count === undefined ? pending.quantity : Math.min(count, pending.quantity);
  const left = pending.quantity - committed;
  return {
    steps: [
      {
        kind: 'commitPending',
        deckId: deck.id,
        storageId,
        pendingId: pending.id,
        ...(count === undefined ? {} : { quantity: committed }),
      },
    ],
    affected: committed,
    entry: left > 0 ? { ...entry, quantity: left, pending: { ...pending, quantity: left } } : null,
  };
}

export function planAddToCollection(deck: PlanDeck, entry: DeckEntry, intent: AddToCollection): Plan {
  if (entry.kind === 'pending') {
    return commitPending(deck, entry, intent);
  }
  throw new Error('not planned yet');
}
