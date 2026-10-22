import type { AddPendingCardInput, Card, PendingCard } from '../../api/types';
import type { ScryfallCard } from '../../scryfall/client';
import { foilFor, printingDetails } from '../../scryfall/printing';
import { commanderSlotOf, setSlotChanges } from '../commanders';
import { type DeckEntry, ownedEntry } from '../deckEntries';
import { addedPendingId, type Plan, type PlanDeck, type PlannedRequest } from './requests';

export type SwapTarget = { kind: 'owned'; copy: Card } | { kind: 'printing'; printing: ScryfallCard };

export interface SwapEdition {
  kind: 'swapEdition';
  target: SwapTarget;
}

function pendingInput(item: PendingCard, quantity: number): AddPendingCardInput {
  return {
    name: item.name,
    scryfall_id: item.scryfall_id,
    set_code: item.set_code,
    collector_number: item.collector_number,
    foil: item.foil,
    quantity,
    mana_value: item.mana_value,
    colors: item.colors,
    card_type: item.card_type,
    color_identity: item.color_identity,
    board: item.board,
  };
}

function removeSource(deck: PlanDeck, source: DeckEntry): PlannedRequest {
  return source.kind === 'pending'
    ? { kind: 'removePending', deckId: deck.id, pendingId: source.pending.id }
    : { kind: 'removeCard', deckId: deck.id, cardId: source.id };
}

// The pending copies a swap to one owned copy leaves wanted.
function remainder(deck: PlanDeck, source: DeckEntry): PlannedRequest[] {
  if (source.kind !== 'pending' || source.pending.quantity <= 1) {
    return [];
  }
  return [{ kind: 'addPending', deckId: deck.id, card: pendingInput(source.pending, source.pending.quantity - 1) }];
}

function swapToOwned(deck: PlanDeck, source: DeckEntry, copy: Card): Plan {
  const slot = commanderSlotOf(deck, source);
  const slotChanges: PlannedRequest[] = slot
    ? [{ kind: 'patchDeck', deckId: deck.id, changes: setSlotChanges(slot, { cardId: copy.id }) }]
    : [];
  return {
    steps: [
      { kind: 'putCardOnBoard', deckId: deck.id, cardId: copy.id, board: source.board },
      ...slotChanges,
      removeSource(deck, source),
      ...remainder(deck, source),
    ],
    affected: 1,
    entry: ownedEntry({ ...copy, board: source.board }),
  };
}

function swapToPrinting(deck: PlanDeck, source: DeckEntry, printing: ScryfallCard): Plan {
  const quantity = source.kind === 'pending' ? source.pending.quantity : 1;
  const added = addedPendingId(0);
  const slot = commanderSlotOf(deck, source);
  const slotChanges: PlannedRequest[] = slot
    ? [
        {
          kind: 'patchDeck',
          deckId: deck.id,
          changes: slot === 'commander' ? { commander_pending_id: added } : { partner_pending_id: added },
        },
      ]
    : [];
  return {
    steps: [
      {
        kind: 'addPending',
        deckId: deck.id,
        card: { ...printingDetails(printing), foil: foilFor(printing, source.foil), quantity, board: source.board },
      },
      ...slotChanges,
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
