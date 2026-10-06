import { Alert, List, ScrollArea, Stack, Text } from '@mantine/core';

import type { ImportSummary } from '../api/types';

function plural(count: number, singular: string, pluralForm = `${singular}s`) {
  return `${count} ${count > 1 ? pluralForm : singular}`;
}

export function ImportResult({ summary }: { summary: ImportSummary }) {
  const created = summary.cards_created ?? 0;
  const skipped = summary.cards_skipped ?? 0;
  const storages = summary.storages_created ?? 0;
  const decks = summary.decks_created ?? 0;
  const warnings = summary.warnings ?? [];

  const details = [
    storages > 0 ? plural(storages, 'rangement créé', 'rangements créés') : null,
    decks > 0 ? plural(decks, 'deck créé', 'decks créés') : null,
    skipped > 0 ? plural(skipped, 'carte ignorée', 'cartes ignorées') : null,
  ].filter(Boolean);

  return (
    <Alert color={skipped > 0 ? 'yellow' : 'green'} title={`${plural(created, 'carte importée', 'cartes importées')}`}>
      <Stack gap="xs">
        {details.length > 0 && <Text size="sm">{details.join(' · ')}</Text>}
        {warnings.length > 0 && (
          <>
            <Text size="sm">Lignes non importées (message de l'API) :</Text>
            <ScrollArea.Autosize mah={200} type="auto">
              <List size="xs" spacing={2}>
                {warnings.map((warning, index) => (
                  <List.Item key={index}>{warning}</List.Item>
                ))}
              </List>
            </ScrollArea.Autosize>
          </>
        )}
      </Stack>
    </Alert>
  );
}
