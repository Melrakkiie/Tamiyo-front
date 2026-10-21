import type { AddPendingCardInput, Card, DeckBoard, PendingCard, UpdateDeckInput } from '../api/types';
import { type CommanderSlot, setSlotChanges } from './commanders';
import { type DeckEntry, type OwnedEntry, ownedEntry } from './deckEntries';

export type SwapTarget = { kind: 'owned'; copy: Card };

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

export type SwapRequest = SwapToOwned;

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
  const { copy } = target;
  const pending = source.kind === 'pending' ? source.pending : null;
  return {
    kind: 'owned',
    deckId,
    copyId: copy.id,
    board: source.board,
    slotChanges: commanderSlot ? setSlotChanges(commanderSlot, { cardId: copy.id }) : null,
    remove: pending ? { kind: 'pending', pendingId: pending.id } : { kind: 'card', cardId: source.id },
    remainder: pending && pending.quantity > 1 ? pendingInput(pending, pending.quantity - 1) : null,
    entry: ownedEntry({ ...copy, board: source.board }),
  };
}
