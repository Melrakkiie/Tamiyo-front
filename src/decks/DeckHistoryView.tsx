import { Alert, Center, Group, Loader, SegmentedControl, Stack, Text, Title } from '@mantine/core';
import { useState } from 'react';

import { errorMessage } from '../api/errors';
import type { DeckHistory } from '../api/types';
import { EmptyNote } from '../theme/EmptyNote';
import { useDeckHistory } from './api';
import { boardLabels } from './boards';
import { CardHoverPreview } from './CardHoverPreview';
import { filterHistory, type HistoryFilter } from './history';
import { useSharedDeckHistory } from './shared';

const filterOptions: { value: HistoryFilter; label: string }[] = [
  { value: 'all', label: 'Tout' },
  { value: 'additions', label: 'Ajouts' },
  { value: 'removals', label: 'Retraits' },
];

const dateFormat = new Intl.DateTimeFormat('fr-FR', { dateStyle: 'long', timeZone: 'UTC' });

interface DeckHistoryViewProps {
  history: { data: DeckHistory | undefined; error: Error | null; isLoading: boolean };
}

export function DeckHistoryView({ history }: DeckHistoryViewProps) {
  const [filter, setFilter] = useState<HistoryFilter>('all');

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
            <Title order={4}>{dateFormat.format(new Date(day.date))}</Title>
            {day.boards.map((board) => (
              <Stack key={board.board} gap={2}>
                <Text size="sm" fw={600} c="dimmed">
                  {boardLabels[board.board]}
                </Text>
                {board.changes.map((change) => (
                  <HistoryLine key={change.name} name={change.name} count={change.count} />
                ))}
              </Stack>
            ))}
          </Stack>
        ))
      )}
    </Stack>
  );
}

function HistoryLine({ name, count }: { name: string; count: number }) {
  const added = count > 0;
  return (
    <Group gap="xs" wrap="nowrap" c={added ? 'green' : 'red'}>
      <Text span fw={700} w={12} ta="center" aria-label={added ? 'Ajout' : 'Retrait'}>
        {added ? '+' : '−'}
      </Text>
      <CardHoverPreview name={name}>
        <Text span>
          {Math.abs(count)} × {name}
        </Text>
      </CardHoverPreview>
    </Group>
  );
}

export function DeckHistoryPanel({ deckId }: { deckId: string }) {
  return <DeckHistoryView history={useDeckHistory(deckId)} />;
}

export function SharedDeckHistoryPanel({ deckId }: { deckId: string }) {
  return <DeckHistoryView history={useSharedDeckHistory(deckId)} />;
}
