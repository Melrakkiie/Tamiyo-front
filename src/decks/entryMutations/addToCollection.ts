import type { DeckEntry, OwnedEntry, PendingEntry } from '../deckEntries';
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

// Creates real copies of the owned entry's printing in the collection, outside the deck.
function createCopies(entry: OwnedEntry, { storageId = null, count = 1 }: AddToCollection): Plan {
  const { name, scryfall_id, set_code, collector_number, foil, mana_value, colors, card_type, color_identity } = entry;
  return {
    steps: [
      {
        kind: 'createCards',
        card: {
          name,
          scryfall_id,
          set_code,
          collector_number,
          foil,
          proxy: false,
          storage_id: storageId,
          mana_value,
          colors,
          card_type,
          color_identity,
        },
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
