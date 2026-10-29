import { Alert, Center, Group, Loader, SegmentedControl, Stack, Text, Title } from '@mantine/core';
import { type MouseEvent, useState } from 'react';

import { errorMessage } from '../api/errors';
import type { Deck, DeckHistory } from '../api/types';
import { useCardContextMenu } from '../cards/CardContextMenu';
import { EmptyNote } from '../theme/EmptyNote';
import { useDeckHistory } from './api';
import { boardLabels } from './boards';
import { CardHoverPreview } from './CardHoverPreview';
import { filterHistory, type HistoryFilter, historyDateFormat } from './history';
import { useSharedDeckHistory } from './shared';
import { type HistoryMenu, useHistoryMenu } from './useHistoryMenu';

const filterOptions: { value: HistoryFilter; label: string }[] = [
  { value: 'all', label: 'Tout' },
  { value: 'additions', label: 'Ajouts' },
  { value: 'removals', label: 'Retraits' },
];

interface DeckHistoryViewProps {
  history: { data: DeckHistory | undefined; error: Error | null; isLoading: boolean };
  /** Owner page only: the shared page passes none, so its lines have no menu. */
  menu?: HistoryMenu;
}

export function DeckHistoryView({ history, menu }: DeckHistoryViewProps) {
  const [filter, setFilter] = useState<HistoryFilter>('all');
  const contextMenu = useCardContextMenu();

  if (history.isLoading) {
    return (
      <Center p="xl">
        <Loader />
      </Center>
    );
  }
  if (!history.data) {
    return <Alert color="red">{errorMessage(history.error)}</Alert>;
  }

  const days = filterHistory(history.data, filter);
  return (
    <Stack gap="md">
      <SegmentedControl
        value={filter}
        onChange={(value) => setFilter(value as HistoryFilter)}
        data={filterOptions}
        w="fit-content"
      />
      {days.length === 0 ? (
        <EmptyNote
          title="Rien à afficher"
          note={
            filter === 'all' ? "Ce deck n'a pas encore d'historique." : 'Aucun changement ne correspond à ce filtre.'
          }
        />
      ) : (
        days.map((day) => (
          <Stack key={day.date} gap="xs">
            <Title order={4}>{historyDateFormat.format(new Date(day.date))}</Title>
            {day.boards.map((board) => (
              <Stack key={board.board} gap={2}>
                <Text size="sm" fw={600} c="dimmed">
                  {boardLabels[board.board]}
                </Text>
                {board.changes.map((change) => (
                  <HistoryLine
                    key={change.name}
                    name={change.name}
                    count={change.count}
                    printing={
                      change.set_code && change.collector_number
                        ? { set: change.set_code, number: change.collector_number }
                        : undefined
                    }
                    onContextMenu={
                      menu && ((event) => contextMenu.open(event, menu.menuFor(change, board.board, day.date)))
                    }
                  />
                ))}
              </Stack>
            ))}
          </Stack>
        ))
      )}
      {contextMenu.element}
    </Stack>
  );
}

function HistoryLine({
  name,
  count,
  printing,
  onContextMenu,
}: {
  name: string;
  count: number;
  printing?: { set: string; number: string };
  onContextMenu?: (event: MouseEvent<HTMLElement>) => void;
}) {
  const added = count > 0;
  return (
    <Group gap="xs" wrap="nowrap" c={added ? 'green' : 'red'} onContextMenu={onContextMenu}>
      <Text span fw={700} w={12} ta="center" aria-label={added ? 'Ajout' : 'Retrait'}>
        {added ? '+' : '−'}
      </Text>
      <CardHoverPreview name={name} printing={printing}>
        <Text span>
          {Math.abs(count)} × {name}
        </Text>
      </CardHoverPreview>
    </Group>
  );
}

export function DeckHistoryPanel({ deck }: { deck: Deck }) {
  const menu = useHistoryMenu(deck);
  return (
    <>
      <DeckHistoryView history={useDeckHistory(deck.id)} menu={menu} />
      {menu.modal}
    </>
  );
}

export function SharedDeckHistoryPanel({ deckId }: { deckId: string }) {
  return <DeckHistoryView history={useSharedDeckHistory(deckId)} />;
}
