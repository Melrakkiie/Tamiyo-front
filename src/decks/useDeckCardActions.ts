import { notifications } from '@mantine/notifications';
import { useState } from 'react';

import { errorMessage } from '../api/errors';
import type { Deck, DeckBoard } from '../api/types';
import { movedMessage } from './boards';
import type { DragItem } from './dragDrop';
import type { Taggable } from './deckEntries';
import { heldSlot } from './entryMutations/slots';
import { useDeckEntryMutations } from './entryMutations/useDeckEntryMutations';
import type { MoveRequest } from './MoveCopiesModal';
import { useSetCardTags } from './tags';

export function useDeckCardActions(deck: Deck, tagsOfCard: (entry: Taggable) => string[]) {
  const mutations = useDeckEntryMutations(deck);
  const setTags = useSetCardTags();
  const [moveRequest, setMoveRequest] = useState<MoveRequest | null>(null);

  const callbacks = (message: string) => ({
    onSuccess: () => notifications.show({ color: 'green', message }),
    onError: (err: unknown) => notifications.show({ color: 'red', message: errorMessage(err) }),
  });

  function canMoveTo(item: DragItem, board: DeckBoard) {
    return board !== item.board && heldSlot(deck, item.entry) === null;
  }

  async function moveCopies({ entry, board }: MoveRequest, count: number) {
    try {
      const { affected } = await mutations.run(entry, { kind: 'moveToBoard', board, count });
      notifications.show({ color: 'green', message: movedMessage(entry.name, affected, board) });
    } catch (err) {
      notifications.show({ color: 'red', message: errorMessage(err) });
    }
  }

  // `beforeMove` runs only once the move is going ahead, so cancelling the modal changes nothing.
  function moveToBoard({ entry }: DragItem, board: DeckBoard, beforeMove?: () => void) {
    if (entry.quantity >= 2) {
      setMoveRequest({ entry, board, beforeMove });
      return Promise.resolve();
    }
    beforeMove?.();
    return moveCopies({ entry, board }, 1);
  }

  async function remove({ entry }: DragItem) {
    try {
      const { affected } = await mutations.run(entry, { kind: 'removeCopies', count: 'all' });
      const message =
        affected > 1 ? `${affected} exemplaires de ${entry.name} retirés du deck.` : `${entry.name} retirée du deck.`;
      notifications.show({ color: 'green', message });
    } catch (err) {
      notifications.show({ color: 'red', message: errorMessage(err) });
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

  const moveModal = {
    request: moveRequest,
    onConfirm: (request: MoveRequest, count: number) => {
      setMoveRequest(null);
      request.beforeMove?.();
      void moveCopies(request, count);
    },
    onClose: () => setMoveRequest(null),
  };

  return { canMoveTo, moveToBoard, moveModal, remove, addTag, removeTag, removeAllTags };
}

export type DeckCardActions = ReturnType<typeof useDeckCardActions>;
