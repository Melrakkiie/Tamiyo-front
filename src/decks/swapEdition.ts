import type { AddPendingCardInput, Card, DeckBoard, PendingCard, UpdateDeckInput } from '../api/types';
import type { ScryfallCard } from '../scryfall/client';
import { foilFor, printingDetails } from '../scryfall/printing';
import { type CommanderSlot, setSlotChanges } from './commanders';
import { type DeckEntry, type OwnedEntry, ownedEntry } from './deckEntries';

export type SwapTarget = { kind: 'owned'; copy: Card } | { kind: 'printing'; printing: ScryfallCard };

export type SwapRemoval = { kind: 'card'; cardId: number } | { kind: 'pending'; pendingId: number };

export interface SwapToOwned {
  kind: 'owned';
  deckId: string;
  copyId: number;
  board: DeckBoard;
  slotChanges: UpdateDeckInput | null;
  remove: SwapRemoval;
  remainder: AddPendingCardInput | null;
  entry: OwnedEntry;
}

export interface SwapToPending {
  kind: 'pending';
  deckId: string;
  card: AddPendingCardInput;
  slotChanges: ((addedPendingId: number) => UpdateDeckInput) | null;
  remove: SwapRemoval;
}

export type SwapRequest = SwapToOwned | SwapToPending;

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

export function swapEdition(
  deckId: string,
  source: DeckEntry,
  target: SwapTarget,
  commanderSlot: CommanderSlot | null,
): SwapRequest {
  const pending = source.kind === 'pending' ? source.pending : null;
  const remove: SwapRemoval =
    source.kind === 'pending' ? { kind: 'pending', pendingId: source.pending.id } : { kind: 'card', cardId: source.id };
  if (target.kind === 'printing') {
    const { printing } = target;
    return {
      kind: 'pending',
      deckId,
      card: {
        ...printingDetails(printing),
        foil: foilFor(printing, source.foil),
        quantity: pending ? pending.quantity : 1,
        board: source.board,
      },
      slotChanges: commanderSlot ? (pendingId) => setSlotChanges(commanderSlot, { pendingId }) : null,
      remove,
    };
  }
  const { copy } = target;
  return {
    kind: 'owned',
    deckId,
    copyId: copy.id,
    board: source.board,
    slotChanges: commanderSlot ? setSlotChanges(commanderSlot, { cardId: copy.id }) : null,
    remove,
    remainder: pending && pending.quantity > 1 ? pendingInput(pending, pending.quantity - 1) : null,
    entry: ownedEntry({ ...copy, board: source.board }),
  };
}
