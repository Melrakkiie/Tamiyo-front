import { notifications } from '@mantine/notifications';

import { errorMessage } from '../api/errors';
import type { Deck, DeckBoard } from '../api/types';
import { movedMessage } from './boards';
import { commanderSlotOf } from './commanders';
import type { DragItem } from './dragDrop';
import type { Taggable } from './deckEntries';
import { useDeckEntryMutations } from './entryMutations/useDeckEntryMutations';
import { useSetCardTags } from './tags';

export function useDeckCardActions(deck: Deck, tagsOfCard: (entry: Taggable) => string[]) {
  const mutations = useDeckEntryMutations(deck);
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
      const { affected } = await mutations.run(entry, { kind: 'moveToBoard', board });
      notifications.show({ color: 'green', message: movedMessage(entry.name, affected, board) });
    } catch (err) {
      notifications.show({ color: 'red', message: errorMessage(err) });
    }
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

  return { canMoveTo, moveToBoard, remove, addTag, removeTag, removeAllTags };
}

export type DeckCardActions = ReturnType<typeof useDeckCardActions>;
