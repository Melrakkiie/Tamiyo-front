import { Alert, Button, Center, Group, Loader, ScrollArea, Stack, Text } from '@mantine/core';

import { errorMessage } from '../api/errors';
import { useCardNameSuggestions } from '../scryfall/hooks';

const MAX_RESULTS = 15;

interface ScryfallFallbackProps {
  search: string;
  identity: string | undefined;
  onPick: (name: string) => void;
}

function scryfallQuery(search: string, identity: string | undefined) {
  if (identity === undefined) {
    return search;
  }
  return `${search} ${identity === '' ? 'id:c' : `id<=${identity}`}`;
}

export function ScryfallFallback({ search, identity, onPick }: ScryfallFallbackProps) {
  const suggestions = useCardNameSuggestions(scryfallQuery(search, identity));
  const results = (suggestions.data ?? []).slice(0, MAX_RESULTS);

  return (
    <Stack gap="xs">
      <Text size="sm" fw={500}>
        Sur Scryfall
      </Text>
      <Text size="xs" c="dimmed">
        La carte apparaîtra dans le deck entourée en orange, en attendant que tu l'ajoutes à ta collection.
      </Text>
      {suggestions.isLoading ? (
        <Center p="md">
          <Loader size="sm" />
        </Center>
      ) : suggestions.error ? (
        <Alert color="red">
          {errorMessage(suggestions.error, {
            400: 'Scryfall ne comprend pas cette recherche : vérifie la syntaxe.',
          })}
        </Alert>
      ) : results.length === 0 ? (
        <Text size="sm" c="dimmed">
          Aucune carte ne correspond sur Scryfall non plus.
        </Text>
      ) : (
        <ScrollArea.Autosize mah={320} type="auto">
          <Stack gap="xs">
            {results.map((result) => (
              <Group key={result.name} justify="space-between" wrap="nowrap">
                <div style={{ minWidth: 0 }}>
                  <Text size="sm" fw={500} lineClamp={1}>
                    {result.name}
                  </Text>
                  {result.typeLine && (
                    <Text size="xs" c="dimmed" lineClamp={1}>
                      {result.typeLine}
                    </Text>
                  )}
                </div>
                <Button size="xs" variant="light" color="orange" onClick={() => onPick(result.name)}>
                  Ajouter au deck
                </Button>
              </Group>
            ))}
          </Stack>
        </ScrollArea.Autosize>
      )}
    </Stack>
  );
}
