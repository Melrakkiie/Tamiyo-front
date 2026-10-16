import { Alert, Divider, Group, Paper, SegmentedControl, Select, Stack, Switch, Text, Title } from '@mantine/core';

import { errorMessage } from '../api/errors';
import type { Preferences } from '../api/types';
import { DEFAULT_NIGHT_ENDS_AT, DEFAULT_NIGHT_STARTS_AT } from '../theme/colorScheme';
import { usePreferences, useUpdatePreferences } from './preferences';

type Theme = Preferences['theme'];
type Currency = Preferences['price_currency'];

const themeOptions: { value: Theme; label: string }[] = [
  { value: 'day', label: 'Jour' },
  { value: 'night', label: 'Nuit' },
  { value: 'auto', label: "Selon l'heure" },
];

const currencyOptions: { value: Currency; label: string }[] = [
  { value: 'eur', label: 'Euros (Cardmarket)' },
  { value: 'usd', label: 'Dollars (TCGplayer)' },
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
  const showPrices = preferences.data?.show_prices ?? true;
  const currency = preferences.data?.price_currency ?? 'eur';

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
            <Divider />
            <Switch
              label="Afficher les prix"
              description="Le prix des cartes et la valeur de ta collection, de tes rangements et de tes decks, d'après Scryfall. Les proxys ne comptent pas."
              checked={showPrices}
              disabled={!preferences.data}
              onChange={(event) => update.mutate({ show_prices: event.currentTarget.checked })}
            />
            {showPrices && (
              <SegmentedControl
                fullWidth
                data={currencyOptions}
                value={currency}
                disabled={!preferences.data}
                onChange={(value) => update.mutate({ price_currency: value as Currency })}
              />
            )}
          </>
        )}
      </Stack>
    </Paper>
  );
}
