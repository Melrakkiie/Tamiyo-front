import { notifications } from '@mantine/notifications';

import { errorMessage } from '../api/errors';
import type { Card, Deck, DeckBoard } from '../api/types';
import { copyCount, copyIds } from '../cards/api';
import {
  useMoveDeckCards,
  useMovePendingCard,
  useRemoveCardFromDeck,
  useRemoveCopiesFromDeck,
  useRemovePendingCard,
} from './api';
import { movedMessage } from './boards';
import type { DragItem } from './dragDrop';
import { isPendingCard, pendingIdOf } from './pendingCards';
import { useSetCardTags } from './tags';

export function useDeckCardActions(deck: Deck, tagsOfCard: (card: Card) => string[]) {
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

  function isCommander(card: Card) {
    return isPendingCard(card) ? pendingIdOf(card) === deck.commander_pending_id : card.id === deck.commander_id;
  }

  function canMoveTo(item: DragItem, board: DeckBoard) {
    return board !== item.board && !isCommander(item.card);
  }

  function moveToBoard({ card }: DragItem, board: DeckBoard) {
    const message = movedMessage(card.name, copyCount(card), board);
    if (isPendingCard(card)) {
      movePending.mutate({ deckId: deck.id, pendingId: pendingIdOf(card), board }, callbacks(message));
    } else {
      moveCards.mutate({ deckId: deck.id, cardIds: copyIds(card), board }, callbacks(message));
    }
  }

  function remove({ card }: DragItem) {
    const count = copyCount(card);
    const message =
      count > 1 ? `${count} exemplaires de ${card.name} retirés du deck.` : `${card.name} retirée du deck.`;
    if (isPendingCard(card)) {
      removePending.mutate({ deckId: deck.id, pendingId: pendingIdOf(card) }, callbacks(message));
      return;
    }
    const ids = copyIds(card);
    if (ids.length === 1) {
      removeOne.mutate({ deckId: deck.id, cardId: ids[0], isCommander: isCommander(card) }, callbacks(message));
    } else {
      removeCopies.mutate({ deckId: deck.id, cardIds: ids }, callbacks(message));
    }
  }

  function changeTags(card: Card, tags: string[], message: string) {
    setTags.mutate({ deckId: deck.id, name: card.name, tags }, callbacks(message));
  }

  function addTag({ card }: DragItem, tag: string) {
    const current = tagsOfCard(card);
    if (!current.includes(tag)) {
      changeTags(card, [...current, tag], `${card.name} : tag « ${tag} » ajouté.`);
    }
  }

  function removeTag({ card, tag }: DragItem) {
    if (tag !== null) {
      changeTags(
        card,
        tagsOfCard(card).filter((other) => other !== tag),
        `${card.name} : tag « ${tag} » retiré.`,
      );
    }
  }

  function removeAllTags({ card }: DragItem) {
    changeTags(card, [], `${card.name} n'a plus de tag.`);
  }

  return { canMoveTo, moveToBoard, remove, addTag, removeTag, removeAllTags };
}

export type DeckCardActions = ReturnType<typeof useDeckCardActions>;
