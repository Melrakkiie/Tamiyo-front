import { Alert, Group, Paper, SegmentedControl, Select, Stack, Text, Title } from '@mantine/core';

import { errorMessage } from '../api/errors';
import type { Preferences } from '../api/types';
import { DEFAULT_NIGHT_ENDS_AT, DEFAULT_NIGHT_STARTS_AT } from '../theme/colorScheme';
import { usePreferences, useUpdatePreferences } from './preferences';

type Theme = Preferences['theme'];

const themeOptions: { value: Theme; label: string }[] = [
  { value: 'day', label: 'Jour' },
  { value: 'night', label: 'Nuit' },
  { value: 'auto', label: "Selon l'heure" },
];

const hours = Array.from({ length: 24 }, (_, hour) => hour);

function hourOptions(excluded: number) {
  return hours.map((hour) => ({ value: String(hour), label: `${hour} h`, disabled: hour === excluded }));
}

export function AppearanceSection() {
  const preferences = usePreferences();
  const update = useUpdatePreferences();
  const theme = preferences.data?.theme ?? 'auto';
  const startsAt = preferences.data?.night_starts_at ?? DEFAULT_NIGHT_STARTS_AT;
  const endsAt = preferences.data?.night_ends_at ?? DEFAULT_NIGHT_ENDS_AT;

  return (
    <Paper withBorder p="lg">
      <Stack>
        <Title order={3} size="h4">
          Apparence
        </Title>
        <Text size="sm" c="dimmed">
          Tamiyo a des couleurs de jour et des couleurs de nuit. Choisis-en une, ou laisse l'heure décider.
        </Text>
        {preferences.error ? (
          <Alert color="red">{errorMessage(preferences.error)}</Alert>
        ) : (
          <>
            <SegmentedControl
              fullWidth
              data={themeOptions}
              value={theme}
              disabled={!preferences.data}
              onChange={(value) => update.mutate({ theme: value as Theme })}
            />
            {theme === 'auto' && (
              <Group grow align="flex-end">
                <Select
                  label="La nuit commence à"
                  data={hourOptions(endsAt)}
                  value={String(startsAt)}
                  allowDeselect={false}
                  disabled={!preferences.data}
                  onChange={(value) => value !== null && update.mutate({ night_starts_at: Number(value) })}
                />
                <Select
                  label="et se termine à"
                  data={hourOptions(startsAt)}
                  value={String(endsAt)}
                  allowDeselect={false}
                  disabled={!preferences.data}
                  onChange={(value) => value !== null && update.mutate({ night_ends_at: Number(value) })}
                />
              </Group>
            )}
          </>
        )}
      </Stack>
    </Paper>
  );
}
