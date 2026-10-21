import { Alert, Anchor, Center, Divider, Group, Loader, Stack, Text, Title } from '@mantine/core';

import type { CombosQuery } from './combos';

const UNAVAILABLE = 'Commander Spellbook ne répond pas, réessaie plus tard.';

export function CombosTileValue({ combos }: { combos: CombosQuery }) {
  if (combos.isLoading) {
    return <Loader size="sm" />;
  }
  return combos.data ? combos.data.combos.length : '—';
}

function CombosBody({ combos }: { combos: CombosQuery }) {
  if (combos.isLoading) {
    return (
      <Center p="md">
        <Loader size="sm" />
      </Center>
    );
  }
  if (!combos.data) {
    return (
      <Alert color="orange" variant="light">
        {UNAVAILABLE}
      </Alert>
    );
  }
  if (combos.data.combos.length === 0) {
    return (
      <Text size="sm" c="dimmed">
        Aucun combo connu dans ce deck.
      </Text>
    );
  }
  return (
    <Stack gap="xs">
      {combos.data.combos.map((combo, index) => (
        <Stack key={combo.id} gap="xs">
          {index > 0 && <Divider />}
          <Group justify="space-between" align="flex-start" wrap="nowrap" gap="md">
            <Stack gap={2}>
              <Text size="sm" fw={500}>
                {combo.cards.join(' + ')}
              </Text>
              <Text size="xs" c="dimmed" lang="en">
                {combo.results.join(' · ')}
              </Text>
            </Stack>
            <Anchor
              href={combo.url}
              aria-label={`Voir le combo ${combo.cards.join(' + ')} sur Commander Spellbook`}
              target="_blank"
              rel="noreferrer"
              size="sm"
              style={{ whiteSpace: 'nowrap' }}
            >
              Voir le combo
            </Anchor>
          </Group>
        </Stack>
      ))}
    </Stack>
  );
}

export function CombosSection({ combos, creditUrl }: { combos: CombosQuery; creditUrl: string | undefined }) {
  return (
    <Stack gap="xs">
      <Title order={3} size="h5">
        Combos
      </Title>
      <Text size="xs" c="dimmed">
        Combos connus dont toutes les cartes sont dans le deck principal.
      </Text>
      <CombosBody combos={combos} />
      {creditUrl && (
        <Text size="xs" c="dimmed">
          <Anchor href={creditUrl} target="_blank" rel="noreferrer" inherit>
            Combos fournis par Commander Spellbook
          </Anchor>
        </Text>
      )}
    </Stack>
  );
}
