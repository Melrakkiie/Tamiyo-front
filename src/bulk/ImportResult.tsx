import { Alert, List, ScrollArea, Stack, Text } from '@mantine/core';

import type { ImportSummary } from '../api/types';

function plural(count: number, singular: string, pluralForm = `${singular}s`) {
  return `${count} ${count > 1 ? pluralForm : singular}`;
}

export function ImportResult({
  summary,
  kind = 'collection',
}: {
  summary: ImportSummary;
  kind?: 'collection' | 'deck';
}) {
  const created = summary.cards_created ?? 0;
  const linked = summary.cards_linked ?? 0;
  const pending = summary.cards_pending ?? 0;
  const skipped = summary.cards_skipped ?? 0;
  const storages = summary.storages_created ?? 0;
  const decks = summary.decks_created ?? 0;
  const warnings = summary.warnings ?? [];

  const details = [
    kind === 'deck' && linked > 0 ? `${linked} de ta collection` : null,
    kind === 'deck' && pending > 0 ? `${pending} pas encore dans ta collection` : null,
    storages > 0 ? plural(storages, 'rangement créé', 'rangements créés') : null,
    decks > 0 ? plural(decks, 'deck créé', 'decks créés') : null,
    skipped > 0 ? plural(skipped, 'carte ignorée', 'cartes ignorées') : null,
  ].filter(Boolean);

  return (
    <Alert
      color={skipped > 0 ? 'yellow' : 'green'}
      title={
        kind === 'deck'
          ? `${plural(linked + pending, 'carte dans le deck', 'cartes dans le deck')}`
          : `${plural(created, 'carte importée', 'cartes importées')}`
      }
    >
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
