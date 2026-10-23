import {
  ActionIcon,
  Box,
  Button,
  Collapse,
  Group,
  Input,
  Menu,
  Modal,
  SegmentedControl,
  Select,
  SimpleGrid,
  Stack,
  Text,
  TextInput,
  UnstyledButton,
} from '@mantine/core';
import { useDebouncedValue } from '@mantine/hooks';
import { useMemo, useState } from 'react';

import { COLORLESS, type ColorMode, type TypeFilter } from '../cards/advancedFilters';
import { ColorChips, ComparisonInput, colorModes, typeOptions } from '../cards/AdvancedSearch';
import { SearchSyntaxHelp } from '../cards/SearchSyntaxHelp';
import { useScryfallCards } from '../scryfall/hooks';
import { allOf, matchesScryfallQuery, parseScryfallQuery, type QueryNode } from '../scryfall/query';
import type { Zone } from './engine';
import {
  activeLibraryFilterCount,
  emptyLibraryFilters,
  type LibraryFilters,
  libraryFiltersToQuery,
} from './libraryFilters';
import { CardFace } from './PlaytestCard';
import { useTable } from './table';

export type ViewedZone = 'library' | 'graveyard' | 'exile';

const zoneTitles: Record<ViewedZone, string> = {
  library: 'Chercher dans ta bibliothèque',
  graveyard: 'Cimetière',
  exile: 'Exil',
};

const destinations: { zone: Zone; position?: 'top' | 'bottom'; label: string }[] = [
  { zone: 'hand', label: 'En main' },
  { zone: 'battlefield', label: 'Sur le champ de bataille' },
  { zone: 'graveyard', label: 'Au cimetière' },
  { zone: 'exile', label: 'En exil' },
  { zone: 'library', position: 'top', label: 'Sur le dessus de la bibliothèque' },
  { zone: 'library', position: 'bottom', label: 'Sous la bibliothèque' },
];

const THUMB_WIDTH = 145;

export function ZoneModal({ zone, onClose }: { zone: ViewedZone | null; onClose: () => void }) {
  const { state, act } = useTable();
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState(emptyLibraryFilters);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const shownZone = zone ?? 'graveyard';
  const searching = shownZone === 'library';
  const cards = useScryfallCards(zone !== null ? Object.values(state.cards).map((card) => card.scryfallId) : []);
  const parsed = useMemo(() => parseScryfallQuery(search), [search]);
  const [lastValid, setLastValid] = useState<QueryNode | null>(null);
  if (!parsed.error && parsed.node !== lastValid) {
    setLastValid(parsed.node);
  }
  const query = parsed.error ? lastValid : parsed.node;
  const libraryQuery = useMemo(
    () => (searching ? allOf([query, libraryFiltersToQuery(filters)]) : query),
    [searching, query, filters],
  );
  const [settledSearch] = useDebouncedValue(search, 400);
  const searchError = settledSearch === search ? parsed.error : null;
  const ids = state.zones[shownZone].filter((id) => {
    const card = cards.data?.[state.cards[id].scryfallId];
    return matchesScryfallQuery(libraryQuery, card, state.cards[id].name);
  });
  const filterCount = activeLibraryFilterCount(filters);
  const shown = searching ? [...ids].sort((a, b) => state.cards[a].name.localeCompare(state.cards[b].name, 'fr')) : ids;

  function close() {
    setSearch('');
    setLastValid(null);
    setFilters(emptyLibraryFilters);
    setFiltersOpen(false);
    onClose();
  }

  function updateFilters(changes: Partial<LibraryFilters>) {
    setFilters((current) => ({ ...current, ...changes }));
  }

  function moveTo(id: string, to: Zone, position?: 'top' | 'bottom') {
    act(searching ? { type: 'searchLibrary', id, to } : { type: 'move', id, to, position });
  }

  const choices = destinations.filter((destination) =>
    searching ? destination.zone !== 'library' : destination.zone !== shownZone,
  );

  return (
    <Modal opened={zone !== null} onClose={close} title={zoneTitles[shownZone]} size="xl">
      <Stack>
        <Group gap="xs" wrap="nowrap">
          <TextInput
            placeholder="Nom ou syntaxe Scryfall : t:creature mv<=3"
            value={search}
            onChange={(event) => setSearch(event.currentTarget.value)}
            error={searchError && `Recherche invalide : ${searchError}`}
            rightSection={<SearchSyntaxHelp scope="playtest" />}
            rightSectionPointerEvents="all"
            data-autofocus
            style={{ flex: 1 }}
          />
          {searching && (
            <Button variant={filtersOpen ? 'light' : 'default'} onClick={() => setFiltersOpen((open) => !open)}>
              {filterCount > 0 ? `Filtres (${filterCount})` : 'Filtres'}
            </Button>
          )}
        </Group>
        {searching && (
          <Collapse in={filtersOpen}>
            <Stack gap="sm">
              <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md" verticalSpacing="sm">
                <Input.Wrapper label="Couleurs" style={{ gridColumn: '1 / -1' }}>
                  <Stack gap={6} mt={4}>
                    <ColorChips value={filters.colors} onChange={(colors) => updateFilters({ colors })} withColorless />
                    {filters.colors !== '' && filters.colors !== COLORLESS && (
                      <SegmentedControl
                        size="xs"
                        data={colorModes}
                        value={filters.colorMode}
                        onChange={(value) => updateFilters({ colorMode: value as ColorMode })}
                      />
                    )}
                  </Stack>
                </Input.Wrapper>
                <ComparisonInput
                  label="Coût de mana"
                  placeholder="Tous"
                  op={filters.manaValueOp}
                  value={filters.manaValue}
                  min={0}
                  max={20}
                  onChange={(manaValueOp, manaValue) => updateFilters({ manaValueOp, manaValue })}
                />
                <ComparisonInput
                  label="Force"
                  placeholder="Toutes"
                  op={filters.powerOp}
                  value={filters.power}
                  min={-20}
                  max={99}
                  onChange={(powerOp, power) => updateFilters({ powerOp, power })}
                />
                <ComparisonInput
                  label="Endurance"
                  placeholder="Toutes"
                  op={filters.toughnessOp}
                  value={filters.toughness}
                  min={-20}
                  max={99}
                  onChange={(toughnessOp, toughness) => updateFilters({ toughnessOp, toughness })}
                />
                <Select
                  label="Type"
                  placeholder="Tous les types"
                  data={typeOptions}
                  value={filters.type}
                  onChange={(value) => updateFilters({ type: (value as TypeFilter | null) ?? null })}
                  clearable
                />
                <TextInput
                  label="Sous-type"
                  placeholder="Elf, Vehicle, Equipment…"
                  value={filters.subtype}
                  onChange={(event) => updateFilters({ subtype: event.currentTarget.value })}
                  maxLength={50}
                />
              </SimpleGrid>
              {filterCount > 0 && (
                <Group justify="flex-end">
                  <Button variant="subtle" size="xs" onClick={() => setFilters(emptyLibraryFilters)}>
                    Réinitialiser
                  </Button>
                </Group>
              )}
            </Stack>
          </Collapse>
        )}
        {searching && (
          <Text size="sm" c="dimmed">
            Ta bibliothèque est mélangée après chaque carte que tu prends.
          </Text>
        )}
        {shown.length === 0 ? (
          <Text c="dimmed" ta="center" py="lg">
            {state.zones[shownZone].length === 0 ? 'Cette zone est vide.' : 'Aucune carte ne correspond.'}
          </Text>
        ) : (
          <SimpleGrid cols={{ base: 2, xs: 3, sm: 5 }} spacing="sm">
            {shown.map((id) => (
              <Menu key={id} position="bottom" withinPortal shadow="md" width={240}>
                <Menu.Target>
                  <UnstyledButton aria-label={state.cards[id].name}>
                    <CardFace card={state.cards[id]} width={THUMB_WIDTH} />
                  </UnstyledButton>
                </Menu.Target>
                <Menu.Dropdown>
                  <Menu.Label>{state.cards[id].name}</Menu.Label>
                  {choices.map((destination) => (
                    <Menu.Item
                      key={`${destination.zone}:${destination.position}`}
                      onClick={() => moveTo(id, destination.zone, destination.position)}
                    >
                      {destination.label}
                    </Menu.Item>
                  ))}
                </Menu.Dropdown>
              </Menu>
            ))}
          </SimpleGrid>
        )}
      </Stack>
    </Modal>
  );
}

type ScryChoice = 'top' | 'bottom' | 'graveyard';

const scryChoices: { value: ScryChoice; label: string }[] = [
  { value: 'top', label: 'Dessus' },
  { value: 'bottom', label: 'Dessous' },
  { value: 'graveyard', label: 'Cimetière' },
];

export function ScryModal({ count, onClose }: { count: number | null; onClose: () => void }) {
  const { state } = useTable();
  return (
    <Modal opened={count !== null} onClose={onClose} title="Regarder le dessus de ta bibliothèque" size="xl">
      {count !== null && (
        <ScryChoices key={state.zones.library.slice(0, count).join()} count={count} onDone={onClose} />
      )}
    </Modal>
  );
}

function ScryChoices({ count, onDone }: { count: number; onDone: () => void }) {
  const { state, act } = useTable();
  const [order, setOrder] = useState(() => state.zones.library.slice(0, count));
  const [choices, setChoices] = useState<Record<string, ScryChoice>>({});

  function swap(index: number, offset: number) {
    setOrder((current) => {
      const next = [...current];
      [next[index], next[index + offset]] = [next[index + offset], next[index]];
      return next;
    });
  }

  function confirm() {
    const choiceOf = (id: string) => choices[id] ?? 'top';
    act({
      type: 'scry',
      result: {
        top: order.filter((id) => choiceOf(id) === 'top'),
        bottom: order.filter((id) => choiceOf(id) === 'bottom'),
        graveyard: order.filter((id) => choiceOf(id) === 'graveyard'),
      },
    });
    onDone();
  }

  if (order.length === 0) {
    return (
      <Text c="dimmed" ta="center" py="lg">
        Ta bibliothèque est vide.
      </Text>
    );
  }

  return (
    <Stack>
      <Text size="sm" c="dimmed">
        Les cartes laissées dessus y restent dans cet ordre : celle de gauche sera piochée en premier.
      </Text>
      <SimpleGrid cols={{ base: 2, xs: 3, sm: 5 }} spacing="sm">
        {order.map((id, index) => (
          <Stack key={id} gap={6} align="center">
            <Box w={THUMB_WIDTH}>
              <CardFace card={state.cards[id]} width={THUMB_WIDTH} />
            </Box>
            <Group gap={4}>
              <ActionIcon
                variant="default"
                size="sm"
                aria-label="Avancer"
                disabled={index === 0}
                onClick={() => swap(index, -1)}
              >
                ←
              </ActionIcon>
              <ActionIcon
                variant="default"
                size="sm"
                aria-label="Reculer"
                disabled={index === order.length - 1}
                onClick={() => swap(index, 1)}
              >
                →
              </ActionIcon>
            </Group>
            <SegmentedControl
              size="xs"
              orientation="vertical"
              fullWidth
              w={THUMB_WIDTH}
              data={scryChoices}
              value={choices[id] ?? 'top'}
              onChange={(value) => setChoices((current) => ({ ...current, [id]: value as ScryChoice }))}
            />
          </Stack>
        ))}
      </SimpleGrid>
      <Group justify="flex-end">
        <Button onClick={confirm}>Valider</Button>
      </Group>
    </Stack>
  );
}
