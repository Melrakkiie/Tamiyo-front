import type { Card } from '../../api/types';
import type { ScryfallCard } from '../../scryfall/client';
import { foilFor, printingDetails } from '../../scryfall/printing';
import { setSlotChanges, type SlotTarget } from '../commanders';
import { type DeckEntry, ownedEntry } from '../deckEntries';
import { printingFields } from './printingFields';
import { addedPendingId, type AddedPendingId, type Plan, type PlanDeck, type PlannedRequest } from './requests';
import { ownSlot } from './slots';

export type SwapTarget = { kind: 'owned'; copy: Card } | { kind: 'printing'; printing: ScryfallCard };

export interface SwapEdition {
  kind: 'swapEdition';
  target: SwapTarget;
}

function removeSource(deck: PlanDeck, source: DeckEntry): PlannedRequest {
  return source.kind === 'pending'
    ? { kind: 'removePending', deckId: deck.id, pendingId: source.pending.id }
    : { kind: 'removeCard', deckId: deck.id, cardId: source.id };
}

// The pending copies a swap to one owned copy leaves wanted.
function readdLeftoverPending(deck: PlanDeck, source: DeckEntry): PlannedRequest[] {
  if (source.kind !== 'pending' || source.pending.quantity <= 1) {
    return [];
  }
  const { pending } = source;
  return [
    {
      kind: 'addPending',
      deckId: deck.id,
      card: { ...printingFields(pending), quantity: pending.quantity - 1, board: pending.board },
    },
  ];
}

// The source gives its commander slot, if it holds one, to what replaces it.
function carrySlot(deck: PlanDeck, source: DeckEntry, target: SlotTarget<AddedPendingId>): PlannedRequest[] {
  const slot = ownSlot(deck, source);
  return slot ? [{ kind: 'patchDeck', deckId: deck.id, changes: setSlotChanges(slot, target) }] : [];
}

function swapToOwned(deck: PlanDeck, source: DeckEntry, copy: Card): Plan {
  return {
    steps: [
      { kind: 'putCardOnBoard', deckId: deck.id, cardId: copy.id, board: source.board },
      ...carrySlot(deck, source, { cardId: copy.id }),
      removeSource(deck, source),
      ...readdLeftoverPending(deck, source),
    ],
    affected: 1,
    entry: ownedEntry({ ...copy, board: source.board }),
  };
}

function swapToPrinting(deck: PlanDeck, source: DeckEntry, printing: ScryfallCard): Plan {
  const quantity = source.kind === 'pending' ? source.pending.quantity : 1;
  const added = addedPendingId(0);
  return {
    steps: [
      {
        kind: 'addPending',
        deckId: deck.id,
        card: { ...printingDetails(printing), foil: foilFor(printing, source.foil), quantity, board: source.board },
      },
      ...carrySlot(deck, source, { pendingId: added }),
      removeSource(deck, source),
    ],
    affected: quantity,
    entry: added,
  };
}

export function planSwapEdition(deck: PlanDeck, source: DeckEntry, { target }: SwapEdition): Plan {
  return target.kind === 'owned'
    ? swapToOwned(deck, source, target.copy)
    : swapToPrinting(deck, source, target.printing);
}
