import type { DeckEntry, OwnedEntry, PendingEntry } from '../deckEntries';
import { printingFields } from './printingFields';
import type { Plan, PlanDeck } from './requests';

export interface AddToCollection {
  kind: 'addToCollection';
  // Without a storage the copies go into the collection unsorted.
  storageId?: number | null;
  // Without a count every pending copy is committed.
  count?: number;
}

// Pending cards are not collection cards: committing creates them there (ADR-0004).
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

// Creates real copies of the owned entry's printing in the collection, outside the deck.
function createCopies(entry: OwnedEntry, { storageId = null, count = 1 }: AddToCollection): Plan {
  return {
    steps: [
      {
        kind: 'createCards',
        card: { ...printingFields(entry), proxy: false, storage_id: storageId },
        quantity: count,
      },
    ],
    affected: count,
    entry,
  };
}

export function planAddToCollection(deck: PlanDeck, entry: DeckEntry, intent: AddToCollection): Plan {
  return entry.kind === 'pending' ? commitPending(deck, entry, intent) : createCopies(entry, intent);
}
