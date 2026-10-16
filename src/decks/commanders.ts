import type { Card, Deck, UpdateDeckInput } from '../api/types';
import { isPendingCard, pendingIdOf } from './pendingCards';

export type CommanderSlot = 'commander' | 'partner';

export type DeckCommanders = Pick<Deck, 'commander_id' | 'commander_pending_id' | 'partner_id' | 'partner_pending_id'>;

export function cardSlot(deck: DeckCommanders, cardId: number): CommanderSlot | null {
  if (deck.commander_id === cardId) {
    return 'commander';
  }
  return deck.partner_id === cardId ? 'partner' : null;
}

export function pendingSlot(deck: DeckCommanders, pendingId: number): CommanderSlot | null {
  if (deck.commander_pending_id === pendingId) {
    return 'commander';
  }
  return deck.partner_pending_id === pendingId ? 'partner' : null;
}

export function commanderSlotOf(deck: DeckCommanders, card: Card): CommanderSlot | null {
  return isPendingCard(card) ? pendingSlot(deck, pendingIdOf(card)) : cardSlot(deck, card.id);
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
