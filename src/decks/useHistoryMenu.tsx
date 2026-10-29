import { Menu, Tooltip } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { type ReactNode, useState } from 'react';

import { errorMessage } from '../api/errors';
import type { Deck, DeckBoard } from '../api/types';
import { useDeckCards, usePendingCards } from './api';
import { boardLabels } from './boards';
import { deckEntries } from './deckEntries';
import { planPutBackFromHistory, planRemoveFromHistory } from './entryMutations/undoHistory';
import { useDeckEntryMutations } from './entryMutations/useDeckEntryMutations';
import type { HistoryChange } from './history';
import { type HistoryCountRequest, HistoryCountModal } from './HistoryCountModal';
import { putBackAction, retireAction } from './historyMenu';

/** Owner-only actions on the lines of the history. */
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

  async function putBack(change: HistoryChange, board: DeckBoard, count: number) {
    try {
      const { affected } = await mutations.runPlan(planPutBackFromHistory(deck, board, change, count));
      notifications.show({
        color: 'green',
        message:
          affected > 1
            ? `${affected} exemplaires de ${change.name} remis dans le deck.`
            : `${change.name} remise dans le deck.`,
      });
    } catch (err) {
      notifications.show({ color: 'red', message: errorMessage(err) });
    }
  }

  function menuFor(change: HistoryChange, board: DeckBoard, date: string): ReactNode {
    const removal = change.count < 0;
    const { max, disabledReason } = removal ? putBackAction(change, date) : retireAction(change, board, entries);
    const verb = removal ? 'Remettre' : 'Retirer';
    const label = `${verb} ${Math.abs(change.count)} × ${change.name} ${removal ? 'dans' : 'de'} ${boardLabels[board]}`;
    const run = removal ? putBack : retire;
    const onClick = () =>
      max >= 2
        ? setRequest({
            change,
            board,
            max,
            title: label,
            label: removal ? 'Exemplaires à remettre' : 'Exemplaires à retirer',
            confirm: verb,
            run,
          })
        : void run(change, board, 1);
    return (
      // The wrapper receives the hover: a disabled item gets no pointer events.
      <Tooltip label={disabledReason} disabled={disabledReason === undefined} position="right" withinPortal>
        <div>
          <Menu.Item color={removal ? undefined : 'red'} onClick={onClick} disabled={disabledReason !== undefined}>
            {label}
          </Menu.Item>
        </div>
      </Tooltip>
    );
  }

  const modal = (
    <HistoryCountModal
      request={request}
      onClose={() => setRequest(null)}
      onConfirm={(confirmed, count) => {
        setRequest(null);
        void confirmed.run(confirmed.change, confirmed.board, count);
      }}
    />
  );

  return { menuFor, modal };
}

export type HistoryMenu = ReturnType<typeof useHistoryMenu>;
