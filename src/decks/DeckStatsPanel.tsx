import { Alert, Card, Center, Loader, SimpleGrid, Stack, Text, Title } from '@mantine/core';

import { ApiError, errorMessage } from '../api/errors';
import type { DeckStats } from '../api/types';
import { useDeckStats } from './api';
import { BarList, ColumnChart, type BarDatum } from './charts';

const COLOR_LABELS: [string, string][] = [
  ['W', 'Blanc'],
  ['U', 'Bleu'],
  ['B', 'Noir'],
  ['R', 'Rouge'],
  ['G', 'Vert'],
  ['C', 'Incolore'],
];

const TYPE_LABELS: Record<string, string> = {
  Creature: 'Créatures',
  Instant: 'Éphémères',
  Sorcery: 'Rituels',
  Artifact: 'Artefacts',
  Enchantment: 'Enchantements',
  Planeswalker: 'Planeswalkers',
  Battle: 'Batailles',
  Land: 'Terrains',
  Other: 'Autres',
  Unknown: 'Introuvables sur Scryfall',
};

function curveData(curve: { mana_value: number; count: number }[]): BarDatum[] {
  const counts = new Map(curve.map((bucket) => [bucket.mana_value, bucket.count]));
  const max = Math.max(0, ...curve.map((bucket) => bucket.mana_value));
  return Array.from({ length: max + 1 }, (_, mv) => ({ label: String(mv), value: counts.get(mv) ?? 0 }));
}

function StatTile({ label, value }: { label: string; value: string | number }) {
  return (
    <Card withBorder padding="md">
      <Text size="xs" c="dimmed">
        {label}
      </Text>
      <Text size="xl" fw={600}>
        {value}
      </Text>
    </Card>
  );
}

export function DeckStatsPanel({ deckId }: { deckId: number }) {
  return <DeckStatsView stats={useDeckStats(deckId, true)} />;
}

interface DeckStatsViewProps {
  stats: { data: DeckStats | undefined; error: Error | null; isLoading: boolean };
  emptyMessage?: string;
}

export function DeckStatsView({
  stats,
  emptyMessage = 'Ajoute des cartes au deck pour voir ses statistiques.',
}: DeckStatsViewProps) {
  if (stats.isLoading) {
    return (
      <Center p="xl">
        <Loader />
      </Center>
    );
  }

  if (!stats.data) {
    return (
      <Alert color="red">
        {errorMessage(stats.error, {
          502: 'Scryfall est momentanément indisponible. Réessaie dans un instant.',
        })}
      </Alert>
    );
  }

  const data = stats.data;
  if (data.card_count === 0) {
    return <Text c="dimmed">{emptyMessage}</Text>;
  }

  const colors = COLOR_LABELS.map(([key, label]) => ({ label, value: data.color_breakdown[key] ?? 0 })).filter(
    (d) => d.value > 0,
  );
  const types = Object.entries(data.type_breakdown)
    .map(([key, value]) => ({ label: TYPE_LABELS[key] ?? key, value: Number(value) }))
    .sort((a, b) => b.value - a.value);

  return (
    <Stack gap="xl">
      {stats.error instanceof ApiError && <Alert color="orange">{errorMessage(stats.error)}</Alert>}

      <SimpleGrid cols={{ base: 2, sm: 4 }}>
        <StatTile label="Cartes" value={data.card_count} />
        <StatTile label="Terrains" value={data.land_count} />
        <StatTile label="Hors terrains" value={data.nonland_count} />
        <StatTile label="Coût de mana moyen" value={data.average_mana_value.toFixed(2)} />
      </SimpleGrid>

      <Stack gap="xs">
        <Title order={3} size="h5">
          Courbe de mana
        </Title>
        <Text size="xs" c="dimmed">
          Nombre de cartes par coût de mana, terrains exclus.
        </Text>
        {(data.mana_curve ?? []).length === 0 ? (
          <Text size="sm" c="dimmed">
            Aucune carte hors terrain.
          </Text>
        ) : (
          <ColumnChart
            data={curveData(data.mana_curve ?? [])}
            ariaLabel="Courbe de mana"
            describe={(d) => `${d.value} carte${d.value > 1 ? 's' : ''} à ${d.label}`}
          />
        )}
      </Stack>

      <SimpleGrid cols={{ base: 1, md: 2 }} spacing="xl">
        <Stack gap="xs">
          <Title order={3} size="h5">
            Couleurs
          </Title>
          <Text size="xs" c="dimmed">
            Cartes par couleur, terrains exclus. Une carte multicolore compte pour chacune de ses couleurs.
          </Text>
          <BarList data={colors} ariaLabel="Répartition par couleur" />
        </Stack>
        <Stack gap="xs">
          <Title order={3} size="h5">
            Types
          </Title>
          <Text size="xs" c="dimmed">
            Type principal de chaque carte, terrains compris.
          </Text>
          <BarList data={types} ariaLabel="Répartition par type" />
        </Stack>
      </SimpleGrid>
    </Stack>
  );
}
