import { notifications } from '@mantine/notifications';

import { errorMessage } from '../api/errors';
import type { Deck, DeckBoard } from '../api/types';
import { useRemoveCardFromDeck, useRemoveCopiesFromDeck, useRemovePendingCard } from './api';
import { movedMessage } from './boards';
import { commanderSlotOf } from './commanders';
import type { DragItem } from './dragDrop';
import type { Taggable } from './deckEntries';
import { useSetCardTags } from './tags';
import { useMoveEntry } from './useMoveEntry';

export function useDeckCardActions(deck: Deck, tagsOfCard: (entry: Taggable) => string[]) {
  const mover = useMoveEntry(deck.id);
  const removeOne = useRemoveCardFromDeck();
  const removeCopies = useRemoveCopiesFromDeck();
  const removePending = useRemovePendingCard();
  const setTags = useSetCardTags();

  const callbacks = (message: string) => ({
    onSuccess: () => notifications.show({ color: 'green', message }),
    onError: (err: unknown) => notifications.show({ color: 'red', message: errorMessage(err) }),
  });

  function canMoveTo(item: DragItem, board: DeckBoard) {
    return board !== item.board && commanderSlotOf(deck, item.entry) === null;
  }

  async function moveToBoard({ entry }: DragItem, board: DeckBoard) {
    try {
      const count = await mover.move(entry, board);
      notifications.show({ color: 'green', message: movedMessage(entry.name, count, board) });
    } catch (err) {
      notifications.show({ color: 'red', message: errorMessage(err) });
    }
  }

  function remove({ entry }: DragItem) {
    const count = entry.quantity;
    const message =
      count > 1 ? `${count} exemplaires de ${entry.name} retirés du deck.` : `${entry.name} retirée du deck.`;
    if (entry.kind === 'pending') {
      removePending.mutate({ deckId: deck.id, pendingId: entry.pending.id }, callbacks(message));
      return;
    }
    const ids = entry.copy_ids;
    if (ids.length === 1) {
      removeOne.mutate(
        { deckId: deck.id, cardId: ids[0], commanderSlot: commanderSlotOf(deck, entry) },
        callbacks(message),
      );
    } else {
      removeCopies.mutate({ deckId: deck.id, cardIds: ids }, callbacks(message));
    }
  }

  function changeTags(entry: Taggable, tags: string[], message: string) {
    setTags.mutate({ deckId: deck.id, name: entry.name, tags }, callbacks(message));
  }

  function addTag({ entry }: DragItem, tag: string) {
    const current = tagsOfCard(entry);
    if (!current.includes(tag)) {
      changeTags(entry, [...current, tag], `${entry.name} : tag « ${tag} » ajouté.`);
    }
  }

  function removeTag({ entry, tag }: DragItem) {
    if (tag !== null) {
      changeTags(
        entry,
        tagsOfCard(entry).filter((other) => other !== tag),
        `${entry.name} : tag « ${tag} » retiré.`,
      );
    }
  }

  function removeAllTags({ entry }: DragItem) {
    changeTags(entry, [], `${entry.name} n'a plus de tag.`);
  }

  return { canMoveTo, moveToBoard, remove, addTag, removeTag, removeAllTags };
}

export type DeckCardActions = ReturnType<typeof useDeckCardActions>;
