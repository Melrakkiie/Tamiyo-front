import type { DeckEntry, OwnedEntry, PendingEntry } from '../deckEntries';
import type { Plan, PlanDeck, PlannedRequest } from './requests';
import { clearSlot, heldSlot } from './slots';

export interface RemoveCopies {
  kind: 'removeCopies';
  count: number | 'all';
}

// The last copies go first; a partial removal spares the copy holding a commander slot.
function removedCopies(ids: number[], count: number, kept: number | null): number[] {
  const candidates = ids.filter((id) => id !== kept);
  return count >= ids.length ? ids : candidates.slice(candidates.length - count);
}

function removeOwned(deck: PlanDeck, entry: OwnedEntry, count: number): Plan {
  const held = heldSlot(deck, entry);
  const ids = entry.copy_ids;
  const kept = held && 'cardId' in held.target ? held.target.cardId : null;
  const removed = removedCopies(ids, count, kept);
  const left = ids.filter((id) => !removed.includes(id));
  const removal: PlannedRequest =
    removed.length === 1
      ? { kind: 'removeCard', deckId: deck.id, cardId: removed[0] }
      : { kind: 'removeCopies', deckId: deck.id, cardIds: removed };
  return {
    steps: held && left.length === 0 ? [clearSlot(deck, held.slot), removal] : [removal],
    affected: removed.length,
    entry: left.length === 0 ? null : { ...entry, id: left[0], quantity: left.length, copy_ids: left },
  };
}

function removePending(deck: PlanDeck, entry: PendingEntry, count: number): Plan {
  const { pending } = entry;
  const left = pending.quantity - count;
  if (left > 0) {
    return {
      steps: [{ kind: 'setPendingQuantity', deckId: deck.id, pendingId: pending.id, quantity: left }],
      affected: count,
      entry: { ...entry, quantity: left, pending: { ...pending, quantity: left } },
    };
  }
  const held = heldSlot(deck, entry);
  const removal: PlannedRequest = { kind: 'removePending', deckId: deck.id, pendingId: pending.id };
  return { steps: held ? [clearSlot(deck, held.slot), removal] : [removal], affected: count, entry: null };
}

export function planRemoveCopies(deck: PlanDeck, entry: DeckEntry, intent: RemoveCopies): Plan {
  const count = intent.count === 'all' ? entry.quantity : Math.min(intent.count, entry.quantity);
  return entry.kind === 'owned' ? removeOwned(deck, entry, count) : removePending(deck, entry, count);
}
