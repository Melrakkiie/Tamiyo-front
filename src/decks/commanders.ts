import type { Deck, UpdateDeckInput } from '../api/types';

export type CommanderSlot = 'commander' | 'partner';

export type DeckCommanders = Pick<Deck, 'commander_id' | 'commander_pending_id' | 'partner_id' | 'partner_pending_id'>;

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

// `PendingId` lets a plan name a pending card that does not exist yet.
export type SlotTarget<PendingId = number> = { cardId: number } | { pendingId: PendingId };

interface SlotChanges<PendingId> {
  commander_id?: number;
  partner_id?: number;
  commander_pending_id?: PendingId;
  partner_pending_id?: PendingId;
}

export function setSlotChanges<PendingId = number>(
  slot: CommanderSlot,
  target: SlotTarget<PendingId>,
): SlotChanges<PendingId> {
  if ('cardId' in target) {
    return slot === 'commander' ? { commander_id: target.cardId } : { partner_id: target.cardId };
  }
  return slot === 'commander' ? { commander_pending_id: target.pendingId } : { partner_pending_id: target.pendingId };
}

export function clearSlotChanges(slot: CommanderSlot): UpdateDeckInput {
  return slot === 'commander' ? { clear_commander_id: true } : { clear_partner_id: true };
}
