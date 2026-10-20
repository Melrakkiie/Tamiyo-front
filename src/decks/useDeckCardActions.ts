import { notifications } from '@mantine/notifications';

import { errorMessage } from '../api/errors';
import type { Card, Deck, DeckBoard } from '../api/types';
import {
  useMoveDeckCards,
  useMovePendingCard,
  useRemoveCardFromDeck,
  useRemoveCopiesFromDeck,
  useRemovePendingCard,
} from './api';
import { movedMessage } from './boards';
import { commanderSlotOf } from './commanders';
import type { DragItem } from './dragDrop';
import { useSetCardTags } from './tags';

type Named = Pick<Card, 'name'>;

export function useDeckCardActions(deck: Deck, tagsOfCard: (card: Named) => string[]) {
  const moveCards = useMoveDeckCards();
  const movePending = useMovePendingCard();
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

  function moveToBoard({ entry }: DragItem, board: DeckBoard) {
    const message = movedMessage(entry.name, entry.quantity, board);
    if (entry.kind === 'pending') {
      movePending.mutate({ deckId: deck.id, pendingId: entry.pending.id, board }, callbacks(message));
    } else {
      moveCards.mutate({ deckId: deck.id, cardIds: entry.copy_ids, board }, callbacks(message));
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

  function changeTags(card: Named, tags: string[], message: string) {
    setTags.mutate({ deckId: deck.id, name: card.name, tags }, callbacks(message));
  }

  function addTag({ entry: card }: DragItem, tag: string) {
    const current = tagsOfCard(card);
    if (!current.includes(tag)) {
      changeTags(card, [...current, tag], `${card.name} : tag « ${tag} » ajouté.`);
    }
  }

  function removeTag({ entry: card, tag }: DragItem) {
    if (tag !== null) {
      changeTags(
        card,
        tagsOfCard(card).filter((other) => other !== tag),
        `${card.name} : tag « ${tag} » retiré.`,
      );
    }
  }

  function removeAllTags({ entry: card }: DragItem) {
    changeTags(card, [], `${card.name} n'a plus de tag.`);
  }

  return { canMoveTo, moveToBoard, remove, addTag, removeTag, removeAllTags };
}

export type DeckCardActions = ReturnType<typeof useDeckCardActions>;
