import {
  ActionIcon,
  Alert,
  Button,
  Center,
  Collapse,
  Group,
  Indicator,
  Input,
  Loader,
  Pagination,
  Paper,
  SegmentedControl,
  Select,
  SimpleGrid,
  Stack,
  Text,
  Title,
} from '@mantine/core';
import { useState } from 'react';
import { useSearchParams } from 'react-router';

import { errorMessage } from '../api/errors';
import { COLORLESS } from '../cards/advancedFilters';
import { ColorChips } from '../cards/AdvancedSearch';
import { COMMON_FORMATS } from '../decks/api';
import { deckArtId } from '../decks/art';
import {
  activePublicFilterCount,
  type PublicColorMode,
  type PublicDeckFilters,
  type PublicDeckSort,
  parsePublicDeckFilters,
  publicDeckFilterParams,
  publicDeckSortOptions,
  usePublicDecks,
} from '../decks/publicDecks';
import { PublicDeckTile } from '../decks/PublicDeckTile';
import { DebouncedTextInput } from '../layout/DebouncedTextInput';
import { GearIcon } from '../layout/SettingsMenu';
import { useCardArts } from '../scryfall/hooks';

const formatOptions = COMMON_FORMATS.map((format) => ({
  value: format,
  label: format.charAt(0).toUpperCase() + format.slice(1),
}));

const colorModes: { value: PublicColorMode; label: string }[] = [
  { value: 'exact', label: 'Exactement' },
  { value: 'include', label: 'Au moins' },
  { value: 'within', label: 'Au plus' },
];

const colorCountOptions = ['0', '1', '2', '3', '4', '5'].map((count) => ({
  value: count,
  label: count === '0' ? 'Incolore (0)' : count,
}));

interface FiltersPanelProps {
  filters: PublicDeckFilters;
  onChange: (changes: Partial<PublicDeckFilters>) => void;
  onReset: () => void;
}

function FiltersPanel({ filters, onChange, onReset }: FiltersPanelProps) {
  return (
    <Paper withBorder radius="md" p="md">
      <Stack gap="md">
        <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="md" verticalSpacing="md">
          <Input.Wrapper label="Couleurs du deck" description="L'identité couleur de son commandant, ou de ses cartes">
            <Stack gap={6} mt={4}>
              <ColorChips value={filters.colors} onChange={(colors) => onChange({ colors })} withColorless />
              {filters.colors !== '' && filters.colors !== COLORLESS && (
                <SegmentedControl
                  size="xs"
                  data={colorModes}
                  value={filters.colorMode}
                  onChange={(value) => onChange({ colorMode: value as PublicColorMode })}
                />
              )}
            </Stack>
          </Input.Wrapper>

          <Select
            label="Nombre de couleurs"
            placeholder="Peu importe"
            data={colorCountOptions}
            value={filters.colorCount === null ? null : String(filters.colorCount)}
            onChange={(value) => onChange({ colorCount: value === null ? null : Number(value) })}
            clearable
          />

          <Select
            label="Format"
            placeholder="Tous les formats"
            data={formatOptions}
            value={filters.format}
            onChange={(value) => onChange({ format: value })}
            clearable
            searchable
          />

          <DebouncedTextInput
            label="Commandant"
            placeholder="Atraxa, Kess…"
            value={filters.commander}
            onChange={(commander) => onChange({ commander })}
            maxLength={100}
          />

          <DebouncedTextInput
            label="Contient la carte"
            placeholder="Sol Ring"
            value={filters.card}
            onChange={(card) => onChange({ card })}
            maxLength={100}
          />

          <DebouncedTextInput
            label="Joueur"
            placeholder="Pseudo du propriétaire"
            value={filters.owner}
            onChange={(owner) => onChange({ owner })}
            maxLength={100}
          />
        </SimpleGrid>

        <Group justify="space-between" align="center">
          <Text size="xs" c="dimmed">
            Noms de cartes en anglais, comme sur les cartes. Seul le deck principal est pris en compte.
          </Text>
          <Button variant="subtle" size="xs" onClick={onReset}>
            Réinitialiser les filtres
          </Button>
        </Group>
      </Stack>
    </Paper>
  );
}

export function ExplorePage() {
  const [params, setParams] = useSearchParams();
  const filters = parsePublicDeckFilters(params);
  const activeFilters = activePublicFilterCount(filters);
  const [advancedOpen, setAdvancedOpen] = useState(activeFilters > 0);
  const decks = usePublicDecks(filters);
  const results = decks.data?.data ?? [];
  const arts = useCardArts(results.map(deckArtId));
  const totalPages = decks.data?.total_pages ?? 0;
  const searching = filters.name !== '' || activeFilters > 0;

  function update(changes: Partial<PublicDeckFilters>) {
    const next = publicDeckFilterParams({ page: 1, ...changes });
    setParams(
      (previous) => {
        const updated = new URLSearchParams(previous);
        for (const [key, value] of Object.entries(next)) {
          if (value) {
            updated.set(key, value);
          } else {
            updated.delete(key);
          }
        }
        return updated;
      },
      { replace: true },
    );
  }

  function resetFilters() {
    update({ format: null, commander: '', card: '', owner: '', colors: '', colorMode: 'exact', colorCount: null });
  }

  return (
    <Stack>
      <div>
        <Title order={2}>Explorer les decks</Title>
        <Text size="sm" c="dimmed">
          {decks.data
            ? `${decks.data.total} deck${decks.data.total > 1 ? 's' : ''} public${decks.data.total > 1 ? 's' : ''}${searching ? ' correspondant' + (decks.data.total > 1 ? 's' : '') : ''}`
            : ' '}
        </Text>
      </div>

      <Group grow align="flex-end">
        <Group gap="xs" wrap="nowrap" align="flex-end">
          <DebouncedTextInput
            label="Rechercher par nom"
            placeholder="Nom d'un deck"
            value={filters.name}
            onChange={(name) => update({ name })}
            maxLength={100}
            style={{ flex: 1 }}
          />
          <Indicator label={activeFilters} size={16} disabled={activeFilters === 0} offset={4}>
            <ActionIcon
              variant={advancedOpen ? 'filled' : 'default'}
              size={36}
              onClick={() => setAdvancedOpen((open) => !open)}
              aria-label="Recherche avancée"
              aria-expanded={advancedOpen}
              title="Recherche avancée"
            >
              <GearIcon />
            </ActionIcon>
          </Indicator>
        </Group>
        <Select
          label="Tri"
          data={publicDeckSortOptions}
          value={filters.sort}
          onChange={(value) => value && update({ sort: value as PublicDeckSort })}
          allowDeselect={false}
        />
      </Group>

      <Collapse in={advancedOpen}>
        <FiltersPanel filters={filters} onChange={update} onReset={resetFilters} />
      </Collapse>

      {decks.error && (
        <Alert color="red">
          {errorMessage(decks.error, {
            429: 'Trop de recherches en peu de temps. Patiente une minute avant de continuer.',
          })}
        </Alert>
      )}

      {decks.isLoading ? (
        <Center p="xl">
          <Loader />
        </Center>
      ) : results.length === 0 && !decks.error ? (
        <Center p="xl">
          <Text c="dimmed">
            {searching ? 'Aucun deck public ne correspond à cette recherche.' : "Aucun deck public pour l'instant."}
          </Text>
        </Center>
      ) : (
        <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} style={{ opacity: decks.isPlaceholderData ? 0.6 : undefined }}>
          {results.map((deck) => {
            const artId = deckArtId(deck);
            return <PublicDeckTile key={deck.id} deck={deck} art={artId ? (arts.data?.[artId] ?? null) : null} />;
          })}
        </SimpleGrid>
      )}

      {totalPages > 1 && (
        <Center>
          <Pagination
            total={totalPages}
            value={Math.min(filters.page, totalPages)}
            onChange={(next) => {
              update({ page: next });
              window.scrollTo({ top: 0 });
            }}
          />
        </Center>
      )}
    </Stack>
  );
}
