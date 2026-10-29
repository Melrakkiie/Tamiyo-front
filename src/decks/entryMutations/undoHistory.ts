import type { DeckBoard } from '../../api/types';
import type { DeckEntry } from '../deckEntries';
import type { HistoryChange } from '../history';
import { planRemoveCopies } from './removeCopies';
import type { Plan, PlanDeck } from './requests';

type LinePrinting = Pick<HistoryChange, 'name' | 'set_code' | 'collector_number' | 'foil'>;

function matchesPrinting(entry: DeckEntry, line: LinePrinting): boolean {
  return (
    entry.set_code === line.set_code && entry.collector_number === line.collector_number && entry.foil === line.foil
  );
}

/** Copies of the entries of that name on that board: the line's printing and finish first, then the rest. */
export function copiesOfLine(entries: DeckEntry[], board: DeckBoard, line: LinePrinting): DeckEntry[] {
  const named = entries.filter((entry) => entry.board === board && entry.name === line.name);
  const first = line.set_code === undefined ? [] : named.filter((entry) => matchesPrinting(entry, line));
  return [...first, ...named.filter((entry) => !first.includes(entry))];
}

/** Takes `count` copies of an addition out of the deck, each entry going through the usual removal planning. */
export function planRemoveFromHistory(
  deck: PlanDeck,
  entries: DeckEntry[],
  board: DeckBoard,
  line: LinePrinting,
  count: number,
): Plan {
  const plan: Plan = { steps: [], affected: 0, entry: null };
  for (const entry of copiesOfLine(entries, board, line)) {
    if (plan.affected >= count) {
      break;
    }
    const part = planRemoveCopies(deck, entry, { kind: 'removeCopies', count: count - plan.affected });
    plan.steps.push(...part.steps);
    plan.affected += part.affected;
  }
  return plan;
}

/** Puts `count` copies of a removal back: one import line, which picks a free collection copy or a pending card. */
export function planPutBackFromHistory(deck: PlanDeck, board: DeckBoard, line: LinePrinting, count: number): Plan {
  const { name, set_code, collector_number, foil } = line;
  // Lines recorded before the printing was remembered cannot be put back.
  if (set_code === undefined || collector_number === undefined || foil === undefined) {
    return { steps: [], affected: 0, entry: null };
  }
  return {
    steps: [
      { kind: 'importDeckLine', deckId: deck.id, card: { name, set_code, collector_number, foil }, count, board },
    ],
    affected: count,
    entry: null,
  };
}
