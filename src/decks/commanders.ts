import type { Deck, UpdateDeckInput } from '../api/types';
import type { DeckEntry } from './deckEntries';

export type CommanderSlot = 'commander' | 'partner';

export type DeckCommanders = Pick<Deck, 'commander_id' | 'commander_pending_id' | 'partner_id' | 'partner_pending_id'>;

function cardSlot(deck: DeckCommanders, cardId: number): CommanderSlot | null {
  if (deck.commander_id === cardId) {
    return 'commander';
  }
  return deck.partner_id === cardId ? 'partner' : null;
}

function pendingSlot(deck: DeckCommanders, pendingId: number): CommanderSlot | null {
  if (deck.commander_pending_id === pendingId) {
    return 'commander';
  }
  return deck.partner_pending_id === pendingId ? 'partner' : null;
}

export function commanderSlotOf(deck: DeckCommanders, entry: DeckEntry): CommanderSlot | null {
  return entry.kind === 'pending' ? pendingSlot(deck, entry.pending.id) : cardSlot(deck, entry.id);
}

function slotTarget(cardId: number | null | undefined, pendingId: number | null | undefined): SlotTarget[] {
  if (cardId != null) {
    return [{ cardId }];
  }
  return pendingId != null ? [{ pendingId }] : [];
}

export function commanderTargets(deck: Partial<DeckCommanders>): SlotTarget[] {
  return [
    ...slotTarget(deck.commander_id, deck.commander_pending_id),
    ...slotTarget(deck.partner_id, deck.partner_pending_id),
  ];
}

export function hasCommander(deck: DeckCommanders) {
  return deck.commander_id != null || deck.commander_pending_id != null;
}

export function hasPartner(deck: DeckCommanders) {
  return deck.partner_id != null || deck.partner_pending_id != null;
}

export type SlotTarget = { cardId: number } | { pendingId: number };

export function setSlotChanges(slot: CommanderSlot, target: SlotTarget): UpdateDeckInput {
  if ('cardId' in target) {
    return slot === 'commander' ? { commander_id: target.cardId } : { partner_id: target.cardId };
  }
  return slot === 'commander' ? { commander_pending_id: target.pendingId } : { partner_pending_id: target.pendingId };
}

export function clearSlotChanges(slot: CommanderSlot): UpdateDeckInput {
  return slot === 'commander' ? { clear_commander_id: true } : { clear_partner_id: true };
}
