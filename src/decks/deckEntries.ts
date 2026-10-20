import type { Card, DeckBoard, PendingCard } from '../api/types';
import { copyCount, copyIds } from '../cards/copies';
import type { SlotTarget } from './commanders';

type EntryPrinting = Pick<
  Card,
  | 'name'
  | 'scryfall_id'
  | 'set_code'
  | 'collector_number'
  | 'foil'
  | 'mana_value'
  | 'colors'
  | 'card_type'
  | 'color_identity'
  | 'added'
  | 'updated'
>;

interface EntryFields extends EntryPrinting {
  key: string;
  proxy: boolean;
  board: DeckBoard;
  price: number | null;
  quantity: number;
}

export type OwnedEntry = Card & EntryFields & { kind: 'owned'; copy_ids: number[] };

export type PendingEntry = EntryFields & { kind: 'pending'; pending: PendingCard };

export type DeckEntry = OwnedEntry | PendingEntry;

export type OwnedCard = Card & { board: DeckBoard; price?: number | null };

export function ownedEntry(card: OwnedCard): OwnedEntry {
  return {
    ...card,
    kind: 'owned',
    key: `owned-${card.id}`,
    proxy: card.proxy ?? false,
    price: card.price ?? null,
    quantity: copyCount(card),
    copy_ids: copyIds(card),
  };
}

export function pendingEntry(pending: PendingCard): PendingEntry {
  return {
    kind: 'pending',
    key: `pending-${pending.id}`,
    pending,
    name: pending.name,
    scryfall_id: pending.scryfall_id,
    set_code: pending.set_code,
    collector_number: pending.collector_number,
    foil: pending.foil,
    proxy: pending.proxy,
    mana_value: pending.mana_value,
    colors: pending.colors,
    card_type: pending.card_type,
    color_identity: pending.color_identity,
    added: pending.added,
    updated: pending.added,
    board: pending.board,
    price: pending.price,
    quantity: pending.quantity,
  };
}

export function deckEntries(cards: OwnedCard[], pending: PendingCard[] = []): DeckEntry[] {
  return [...cards.map(ownedEntry), ...pending.map(pendingEntry)];
}

export function entryMatches(entry: DeckEntry, target: SlotTarget): boolean {
  if (entry.kind === 'pending') {
    return 'pendingId' in target && entry.pending.id === target.pendingId;
  }
  return 'cardId' in target && entry.copy_ids.includes(target.cardId);
}

function stackKey(entry: DeckEntry, commanders: SlotTarget[], byPrinting: boolean) {
  if (entry.kind === 'pending') {
    return entry.key;
  }
  const commander = commanders.find((target) => entryMatches(entry, target));
  if (commander && 'cardId' in commander) {
    return `commander-${commander.cardId}`;
  }
  return byPrinting
    ? `${entry.scryfall_id}-${entry.foil}`
    : `${entry.scryfall_id}-${entry.foil}-${entry.proxy}-${entry.storage_id ?? ''}`;
}

export function stackEntries<E extends DeckEntry>(entries: E[], commanders: SlotTarget[], byPrinting = false): E[] {
  const stacks = new Map<string, E>();
  for (const entry of entries) {
    const key = stackKey(entry, commanders, byPrinting);
    const stack = stacks.get(key);
    if (!stack) {
      stacks.set(key, entry);
    } else if (stack.kind === 'owned' && entry.kind === 'owned') {
      stacks.set(key, {
        ...stack,
        quantity: stack.quantity + entry.quantity,
        copy_ids: [...stack.copy_ids, ...entry.copy_ids],
      });
    }
  }
  return [...stacks.values()];
}
