import type { DeckEntry, OwnedEntry, PendingEntry } from '../deckEntries';
import type { Plan, PlanDeck, PlannedRequest } from './requests';

export interface RemoveCopies {
  kind: 'removeCopies';
  count: number | 'all';
}

function removeOwned(deck: PlanDeck, entry: OwnedEntry, count: number): Plan {
  const ids = entry.copy_ids;
  const removed = ids.slice(ids.length - count);
  const left = ids.slice(0, ids.length - count);
  const step: PlannedRequest =
    removed.length === 1
      ? { kind: 'removeCard', deckId: deck.id, cardId: removed[0] }
      : { kind: 'removeCopies', deckId: deck.id, cardIds: removed };
  return {
    steps: [step],
    affected: removed.length,
    entry: left.length === 0 ? null : { ...entry, id: left[0], quantity: left.length, copy_ids: left },
  };
}

function removePending(deck: PlanDeck, entry: PendingEntry, count: number): Plan {
  const { pending } = entry;
  const left = pending.quantity - count;
  if (left === 0) {
    return { steps: [{ kind: 'removePending', deckId: deck.id, pendingId: pending.id }], affected: count, entry: null };
  }
  return {
    steps: [{ kind: 'setPendingQuantity', deckId: deck.id, pendingId: pending.id, quantity: left }],
    affected: count,
    entry: { ...entry, quantity: left, pending: { ...pending, quantity: left } },
  };
}

export function planRemoveCopies(deck: PlanDeck, entry: DeckEntry, intent: RemoveCopies): Plan {
  const count = intent.count === 'all' ? entry.quantity : Math.min(intent.count, entry.quantity);
  return entry.kind === 'owned' ? removeOwned(deck, entry, count) : removePending(deck, entry, count);
}
