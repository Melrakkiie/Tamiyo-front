import { Alert, Card, Center, Grid, Loader, SimpleGrid, Stack, Text, Title } from '@mantine/core';
import { type ReactNode, useState } from 'react';

import { ApiError, errorMessage } from '../api/errors';
import type { DeckStats } from '../api/types';
import { useDeckStats } from './api';
import { withSymbols } from '../scryfall/manaSymbols';
import { BarList } from './charts';
import { BackFacesExtra } from './DeckCardGroups';
import { CurveCardList } from './CurveCardList';
import { CurveLegend, fullCurve, ManaCurveChart } from './ManaCurveChart';

const COLORS: { key: string; name: string; color: string }[] = [
  { key: 'W', name: 'Blanc', color: '#F8F6D8' },
  { key: 'U', name: 'Bleu', color: '#C1D7E9' },
  { key: 'B', name: 'Noir', color: '#BAB1AB' },
  { key: 'R', name: 'Rouge', color: '#E49977' },
  { key: 'G', name: 'Vert', color: '#A3C095' },
  { key: 'C', name: 'Incolore', color: '#CAC5C0' },
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

function StatTile({ label, value }: { label: string; value: ReactNode }) {
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

export function DeckStatsPanel({ deckId }: { deckId: string }) {
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
  const [selectedManaValue, setSelectedManaValue] = useState<number | null>(null);

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

  const colors = COLORS.map(({ key, name, color }) => ({
    key,
    label: (
      <Text span size="lg" title={name} aria-label={name}>
        {withSymbols(`{${key}}`)}
      </Text>
    ),
    value: data.color_breakdown[key] ?? 0,
    color,
  })).filter((d) => d.value > 0);
  const types = Object.entries(data.type_breakdown)
    .map(([key, value]) => ({ key, label: TYPE_LABELS[key] ?? key, value: Number(value) }))
    .sort((a, b) => b.value - a.value);
  const curve = fullCurve(data.mana_curve ?? []);
  const selectedBucket = curve.find((bucket) => bucket.mana_value === selectedManaValue && bucket.count > 0);

  return (
    <Stack gap="xl">
      {stats.error instanceof ApiError && <Alert color="orange">{errorMessage(stats.error)}</Alert>}

      <SimpleGrid cols={{ base: 2, sm: 4 }}>
        <StatTile label="Cartes" value={data.card_count} />
        <StatTile
          label="Terrains"
          value={
            <>
              {data.land_count}{' '}
              <Text span size="sm" fw={400} c="dimmed">
                <BackFacesExtra label="Terrains" count={data.land_count} backFaces={data.back_face_lands ?? []} />
              </Text>
            </>
          }
        />
        <StatTile label="Hors terrains" value={data.nonland_count} />
        <StatTile label="Coût de mana moyen" value={data.average_mana_value.toFixed(2)} />
      </SimpleGrid>

      <Stack gap="xs">
        <Title order={3} size="h5">
          Courbe de mana
        </Title>
        <Text size="xs" c="dimmed">
          Nombre de cartes par coût de mana, terrains exclus. Clique sur une barre pour voir ses cartes.
        </Text>
        {(data.mana_curve ?? []).length === 0 ? (
          <Text size="sm" c="dimmed">
            Aucune carte hors terrain.
          </Text>
        ) : (
          <Grid gutter="xl">
            <Grid.Col span={{ base: 12, md: 8 }}>
              <Stack gap="xs">
                <CurveLegend />
                <ManaCurveChart
                  buckets={curve}
                  selected={selectedBucket ? selectedManaValue : null}
                  onSelect={setSelectedManaValue}
                />
              </Stack>
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 4 }}>
              {selectedBucket ? (
                <CurveCardList bucket={selectedBucket} />
              ) : (
                <Text size="sm" c="dimmed">
                  Aucun coût sélectionné.
                </Text>
              )}
            </Grid.Col>
          </Grid>
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
          <BarList data={colors} ariaLabel="Répartition par couleur" labelWidth={32} />
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
