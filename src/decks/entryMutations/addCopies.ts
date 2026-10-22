import type { DeckBoard } from '../../api/types';
import type { DeckEntry } from '../deckEntries';
import type { Plan, PlanDeck } from './requests';

export interface AddCopies {
  kind: 'addCopies';
  count: number;
  // Defaults to the board of the entry.
  board?: DeckBoard;
}

export function planAddCopies(deck: PlanDeck, entry: DeckEntry, { count, board = entry.board }: AddCopies): Plan {
  const { name, set_code, collector_number, foil } = entry;
  return {
    steps: [
      { kind: 'importDeckLine', deckId: deck.id, card: { name, set_code, collector_number, foil }, count, board },
    ],
    affected: count,
    // The import decides whether the new copies come from the collection or stay pending.
    entry,
  };
}
