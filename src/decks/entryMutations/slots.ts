import { clearSlotChanges, type CommanderSlot, type SlotTarget } from '../commanders';
import { type DeckEntry, entryMatches, entrySlotTarget } from '../deckEntries';
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

function deckSlots(deck: PlanDeck): [CommanderSlot, SlotTarget | null][] {
  return [
    ['commander', slotTarget(deck.commander_id, deck.commander_pending_id)],
    ['partner', slotTarget(deck.partner_id, deck.partner_pending_id)],
  ];
}

// The commander slot one of the entry's copies holds, looking at every copy of a stacked entry.
export function heldSlot(deck: PlanDeck, entry: DeckEntry): HeldSlot | null {
  for (const [slot, target] of deckSlots(deck)) {
    if (target && entryMatches(entry, target)) {
      return { slot, target };
    }
  }
  return null;
}

// The slot held by the copy the entry stands for (`entry.id`), for edits that replace that one copy.
export function ownSlot(deck: PlanDeck, entry: DeckEntry): CommanderSlot | null {
  const own = entrySlotTarget(entry);
  const held = deckSlots(deck).find(([, target]) => target !== null && sameTarget(target, own));
  return held ? held[0] : null;
}

function sameTarget(a: SlotTarget, b: SlotTarget): boolean {
  if ('cardId' in a) {
    return 'cardId' in b && a.cardId === b.cardId;
  }
  return 'pendingId' in b && a.pendingId === b.pendingId;
}

export function clearSlot(deck: PlanDeck, slot: CommanderSlot): PlannedRequest {
  return { kind: 'patchDeck', deckId: deck.id, changes: clearSlotChanges(slot) };
}
