import { clearSlotChanges, type CommanderSlot, type SlotTarget } from '../commanders';
import { type DeckEntry, entryMatches } from '../deckEntries';
import type { PlanDeck, PlannedRequest } from './requests';

export interface HeldSlot {
  slot: CommanderSlot;
  target: SlotTarget;
}

function slotTarget(cardId: number | null | undefined, pendingId: number | null | undefined): SlotTarget | null {
  if (cardId != null) {
    return { cardId };
  }
  return pendingId != null ? { pendingId } : null;
}

// The commander slot one of the entry's copies holds, looking at every copy of a stacked entry.
export function heldSlot(deck: PlanDeck, entry: DeckEntry): HeldSlot | null {
  const slots: [CommanderSlot, SlotTarget | null][] = [
    ['commander', slotTarget(deck.commander_id, deck.commander_pending_id)],
    ['partner', slotTarget(deck.partner_id, deck.partner_pending_id)],
  ];
  for (const [slot, target] of slots) {
    if (target && entryMatches(entry, target)) {
      return { slot, target };
    }
  }
  return null;
}

export function clearSlot(deck: PlanDeck, slot: CommanderSlot): PlannedRequest {
  return { kind: 'patchDeck', deckId: deck.id, changes: clearSlotChanges(slot) };
}
