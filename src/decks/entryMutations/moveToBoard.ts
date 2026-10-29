import type { DeckBoard } from '../../api/types';
import type { DeckEntry } from '../deckEntries';
import { printingFields } from './printingFields';
import type { Plan, PlanDeck } from './requests';

export interface MoveToBoard {
  kind: 'moveToBoard';
  board: DeckBoard;
  // How many copies move; the whole entry when absent or not below its size.
  count?: number;
}

// The last copies move, the same rule as removing copies.
export function planMoveToBoard(deck: PlanDeck, entry: DeckEntry, { board, count }: MoveToBoard): Plan {
  const moved = Math.max(1, Math.min(count ?? entry.quantity, entry.quantity));
  if (entry.kind === 'pending') {
    const { pending } = entry;
    if (moved < pending.quantity) {
      const left = pending.quantity - moved;
      return {
        steps: [
          { kind: 'setPendingQuantity', deckId: deck.id, pendingId: pending.id, quantity: left },
          {
            kind: 'addPending',
            deckId: deck.id,
            card: { ...printingFields(pending), proxy: pending.proxy, quantity: moved, board },
          },
        ],
        affected: moved,
        entry: { ...entry, quantity: left, pending: { ...pending, quantity: left } },
      };
    }
    return {
      steps: [{ kind: 'movePending', deckId: deck.id, pendingId: pending.id, board }],
      affected: entry.quantity,
      entry: { ...entry, board, pending: { ...pending, board } },
    };
  }
  if (moved < entry.copy_ids.length) {
    const kept = entry.copy_ids.slice(0, entry.copy_ids.length - moved);
    return {
      steps: [{ kind: 'moveCards', deckId: deck.id, cardIds: entry.copy_ids.slice(kept.length), board }],
      affected: moved,
      entry: { ...entry, id: kept[0], quantity: kept.length, copy_ids: kept },
    };
  }
  return {
    steps: [{ kind: 'moveCards', deckId: deck.id, cardIds: entry.copy_ids, board }],
    affected: entry.copy_ids.length,
    entry: { ...entry, board },
  };
}
