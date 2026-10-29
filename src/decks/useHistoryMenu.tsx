import { Menu } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { type ReactNode, useState } from 'react';

import { errorMessage } from '../api/errors';
import type { Deck, DeckBoard } from '../api/types';
import { useDeckCards, usePendingCards } from './api';
import { boardLabels } from './boards';
import { deckEntries } from './deckEntries';
import { planRemoveFromHistory } from './entryMutations/undoHistory';
import { useDeckEntryMutations } from './entryMutations/useDeckEntryMutations';
import type { HistoryChange } from './history';
import { type HistoryCountRequest, HistoryCountModal } from './HistoryCountModal';
import { retireAction } from './historyMenu';

/** Owner-only actions on the lines of the history; a second action ("Remettre") adds its own item and request. */
export function useHistoryMenu(deck: Deck) {
  const cards = useDeckCards(deck.id, 'mana_value');
  const pending = usePendingCards(deck.id);
  const mutations = useDeckEntryMutations(deck);
  const [request, setRequest] = useState<HistoryCountRequest | null>(null);
  const entries = deckEntries(cards.data ?? [], pending.data ?? []);

  async function retire(change: HistoryChange, board: DeckBoard, count: number) {
    try {
      const plan = planRemoveFromHistory(deck, entries, board, change, count);
      const { affected } = await mutations.runPlan(plan);
      notifications.show({
        color: 'green',
        message:
          affected > 1
            ? `${affected} exemplaires de ${change.name} retirés du deck.`
            : `${change.name} retirée du deck.`,
      });
    } catch (err) {
      notifications.show({ color: 'red', message: errorMessage(err) });
    }
  }

  function menuFor(change: HistoryChange, board: DeckBoard): ReactNode {
    if (change.count <= 0) {
      return null;
    }
    const { max, disabledReason } = retireAction(change, board, entries);
    const label = `Retirer ${change.count} × ${change.name} de ${boardLabels[board]}`;
    const onClick = () =>
      max >= 2
        ? setRequest({
            change,
            board,
            max,
            title: label,
            label: 'Exemplaires à retirer',
            confirm: 'Retirer',
          })
        : void retire(change, board, 1);
    return (
      <Menu.Item color="red" onClick={onClick} disabled={disabledReason !== undefined} title={disabledReason}>
        {label}
      </Menu.Item>
    );
  }

  const modal = (
    <HistoryCountModal
      request={request}
      onClose={() => setRequest(null)}
      onConfirm={(confirmed, count) => {
        setRequest(null);
        void retire(confirmed.change, confirmed.board, count);
      }}
    />
  );

  return { menuFor, modal };
}

export type HistoryMenu = ReturnType<typeof useHistoryMenu>;
