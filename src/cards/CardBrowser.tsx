import {
  ActionIcon,
  Alert,
  Center,
  Collapse,
  Divider,
  Group,
  Indicator,
  Loader,
  Pagination,
  Select,
  SimpleGrid,
  Stack,
  Text,
  TextInput,
  Title,
} from '@mantine/core';
import { useDebouncedValue, useLocalStorage } from '@mantine/hooks';
import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router';

import { errorMessage } from '../api/errors';
import type { Card, CardSort } from '../api/types';
import { useCardBackImages, useCardImages, useManaCosts } from '../scryfall/hooks';
import { DropOverlay } from '../scryfall/DropOverlay';
import { ScryfallCardSearch } from '../scryfall/ScryfallCardSearch';
import { useScryfallDrop } from '../scryfall/useScryfallDrop';
import { GearIcon } from '../layout/SettingsMenu';
import { useAllStorages } from '../storages/api';
import { AddCardModal, type CardToAdd } from './AddCardModal';
import { AdvancedSearch } from './AdvancedSearch';
import {
  activeFilterCount,
  type AdvancedFilters,
  advancedFilterKeys,
  advancedFilterParams,
  cardsQueryFilters,
  parseAdvancedFilters,
} from './advancedFilters';
import { copyCount, useCards } from './api';
import { CardDetailModal } from './CardDetailModal';
import { CardSizeControl, useCardSize } from './CardSizeControl';
import { CardTile } from './CardTile';
import { MissingDetailsAlert } from './MissingDetailsAlert';
import { groupCards, groupingOptions, hasMissingDetails, parseGrouping } from './grouping';

const PAGE_SIZE = 24;
const GROUPED_PAGE_SIZE = 48;
const PAGE_SIZE_OPTIONS = ['24', '48', '96'];

function usePageSize() {
  const [chosen, setChosen] = useLocalStorage<string>({
    key: 'tamiyo-page-size',
    defaultValue: '',
    deserialize: (value) => (value && PAGE_SIZE_OPTIONS.includes(value) ? value : ''),
    serialize: (value) => value,
  });
  return { chosen: chosen ? Number(chosen) : null, setChosen };
}

const sortOptions: { value: CardSort; label: string }[] = [
  { value: '-added', label: 'Ajoutées récemment' },
  { value: '-updated', label: 'Modifiées récemment' },
  { value: 'name', label: 'Nom (A → Z)' },
  { value: '-name', label: 'Nom (Z → A)' },
  { value: 'mana_value', label: 'Coût de mana croissant' },
  { value: '-mana_value', label: 'Coût de mana décroissant' },
  { value: 'color', label: 'Couleur (blanc → vert)' },
  { value: '-color', label: 'Couleur (vert → blanc)' },
  { value: 'type', label: 'Type' },
];

const sortsNeedingDetails: CardSort[] = ['color', '-color', 'type', '-type'];

const DEFAULT_SORT: CardSort = '-added';

function parseSort(raw: string | null): CardSort {
  return sortOptions.find((option) => option.value === raw)?.value ?? DEFAULT_SORT;
}

interface CardBrowserProps {
  storageId?: number;
  pageSize?: number;
}

export function CardBrowser({ storageId: fixedStorageId, pageSize: fixedPageSize }: CardBrowserProps) {
  const [params, setParams] = useSearchParams();
  const page = Math.max(1, Number(params.get('page')) || 1);
  const sort = parseSort(params.get('sort'));
  const grouping = parseGrouping(params.get('group'));
  const { chosen: chosenPageSize, setChosen: setChosenPageSize } = usePageSize();
  const pageSize = chosenPageSize ?? fixedPageSize ?? (grouping ? GROUPED_PAGE_SIZE : PAGE_SIZE);
  const name = params.get('q') ?? '';
  const parsedFilters = parseAdvancedFilters(params);
  const advanced = fixedStorageId ? { ...parsedFilters, storageType: null, storageId: null } : parsedFilters;
  const storageId = fixedStorageId ?? advanced.storageId ?? undefined;
  const activeFilters = activeFilterCount(advanced, !fixedStorageId);
  const queryFilters = cardsQueryFilters(advanced);
  const [advancedOpen, setAdvancedOpen] = useState(activeFilters > 0);

  const [search, setSearch] = useState(name);
  const [debouncedSearch] = useDebouncedValue(search.trim(), 300);
  const [cardToAdd, setCardToAdd] = useState<CardToAdd | null>(null);
  const drop = useScryfallDrop((printing) => setCardToAdd({ name: printing.name, printing }));
  const [searchKey, setSearchKey] = useState(0);
  const [openedCard, setOpenedCard] = useState<Card | null>(null);

  const storages = useAllStorages();
  const storageNames = new Map<number, string>((storages.data ?? []).map((storage) => [storage.id, storage.name]));
  const showStorage = !storageId;
  const cards = useCards({
    page,
    limit: pageSize,
    sort,
    group: grouping ?? undefined,
    name,
    storageId,
    stack: true,
    advanced: queryFilters,
  });
  const copies = useCards({ page: 1, limit: 1, sort: '-updated', name, storageId, advanced: queryFilters });
  const copiesTotal = copies.data?.total;
  const pageCards = cards.data?.data ?? [];
  const images = useCardImages(pageCards.map((card) => card.scryfall_id));
  const backImages = useCardBackImages(pageCards.map((card) => card.scryfall_id));
  const manaCosts = useManaCosts(pageCards.map((card) => card.scryfall_id));
  const showMissingDetails =
    (grouping === 'type' || grouping === 'color' || sortsNeedingDetails.includes(sort)) && hasMissingDetails(pageCards);

  function renderTile(card: Card) {
    return (
      <CardTile
        key={card.id}
        card={card}
        imageUrl={images.data?.[card.scryfall_id]}
        backImageUrl={backImages.data?.[card.scryfall_id]}
        imageLoading={images.isLoading}
        textOnly={textOnly}
        manaCost={manaCosts.isLoading ? undefined : (manaCosts.data?.[card.scryfall_id] ?? null)}
        storageName={
          showStorage ? (card.storage_id ? (storageNames.get(card.storage_id) ?? null) : null) : undefined
        }
        onOpen={setOpenedCard}
      />
    );
  }

  const { size, setSize, textOnly, gridProps } = useCardSize();

  function updateParams(changes: Record<string, string | null>) {
    setParams(
      (previous) => {
        const next = new URLSearchParams(previous);
        for (const [key, value] of Object.entries(changes)) {
          if (value) {
            next.set(key, value);
          } else {
            next.delete(key);
          }
        }
        return next;
      },
      { replace: true },
    );
  }

  useEffect(() => {
    if (debouncedSearch !== name) {
      updateParams({ q: debouncedSearch || null, page: null });
    }
  }, [debouncedSearch]);

  useEffect(() => {
    setSearch((current) => (current.trim() === name ? current : name));
  }, [name]);

  const filteredStorageMissing =
    !fixedStorageId && !!storageId && !!storages.data && !storages.data.some((storage) => storage.id === storageId);
  useEffect(() => {
    if (filteredStorageMissing) {
      changeFilters({ storageId: null });
    }
  }, [filteredStorageMissing]);

  const totalPages = cards.data?.total_pages ?? 0;
  useEffect(() => {
    if (!cards.isPlaceholderData && totalPages > 0 && page > totalPages) {
      updateParams({ page: String(totalPages) });
    }
  }, [page, totalPages, cards.isPlaceholderData]);

  const filtered = !!name || activeFilters > 0;

  function changeFilters(changes: Partial<AdvancedFilters>) {
    updateParams({ ...advancedFilterParams(changes), page: null });
  }

  function resetFilters() {
    updateParams({ ...Object.fromEntries(advancedFilterKeys.map((key) => [key, null])), page: null });
  }

  return (
    <Stack>
      <ScryfallCardSearch
        key={searchKey}
        label="Ajouter une carte"
        placeholder="Cherche une carte sur Scryfall (ex. Lightning Bolt, ou t:creature c:g)"
        onSelect={(selected) => setCardToAdd({ name: selected })}
      />
      <Text size="xs" c="dimmed" mt={-8}>
        Tu peux aussi glisser-déposer une carte depuis scryfall.com, directement dans l'édition voulue.
      </Text>
      <DropOverlay dragging={drop.dragging} resolving={drop.resolving} />

      <Group justify="space-between" align="flex-end">
        <Text size="sm" c="dimmed">
          {copiesTotal !== undefined
            ? `${copiesTotal} carte${copiesTotal > 1 ? 's' : ''}${filtered ? ' correspondant aux filtres' : ''}`
            : ' '}
        </Text>
        <Group gap="md" align="flex-end">
          <Select
            label="Cartes par page"
            data={PAGE_SIZE_OPTIONS}
            value={String(pageSize)}
            onChange={(value) => {
              if (value) {
                setChosenPageSize(value);
                updateParams({ page: null });
              }
            }}
            allowDeselect={false}
            w={130}
          />
          <CardSizeControl value={size} onChange={setSize} />
        </Group>
      </Group>

      <Group grow align="flex-end">
        <Group gap="xs" wrap="nowrap" align="flex-end">
          <TextInput
            label="Filtrer par nom"
            placeholder="Nom d'une carte de ta collection"
            value={search}
            onChange={(event) => setSearch(event.currentTarget.value)}
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
          label="Grouper par"
          placeholder="Aucun regroupement"
          data={groupingOptions}
          value={grouping}
          onChange={(value) => updateParams({ group: value, page: null })}
          clearable
        />
        <Select
          label={grouping ? 'Tri dans chaque groupe' : 'Tri'}
          data={sortOptions}
          value={sort}
          onChange={(value) => updateParams({ sort: value === DEFAULT_SORT ? null : value, page: null })}
          allowDeselect={false}
        />
      </Group>

      <Collapse in={advancedOpen}>
        <AdvancedSearch
          filters={advanced}
          showStorage={!fixedStorageId}
          onChange={changeFilters}
          onReset={resetFilters}
        />
      </Collapse>

      {cards.error && <Alert color="red">{errorMessage(cards.error)}</Alert>}

      {showMissingDetails && <MissingDetailsAlert />}

      {cards.isLoading ? (
        <Center p="xl">
          <Loader />
        </Center>
      ) : pageCards.length === 0 && !cards.error ? (
        <Center p="xl">
          <Stack align="center" gap="xs">
            <Text c="dimmed">
              {filtered
                ? 'Aucune carte ne correspond à ces filtres.'
                : fixedStorageId
                  ? 'Ce rangement est vide pour le moment.'
                  : 'Ta collection est vide pour le moment.'}
            </Text>
            {!filtered && (
              <Text size="sm" c="dimmed">
                Cherche une carte dans la barre ci-dessus pour l'ajouter.
              </Text>
            )}
          </Stack>
        </Center>
      ) : grouping ? (
        <Stack gap="lg">
          {groupCards(pageCards, grouping).map((group, index) => (
            <Stack key={`${index}-${group.label}`} gap="sm">
              <Divider
                labelPosition="left"
                label={
                  <Title order={4}>
                    {group.label}{' '}
                    <Text span size="sm" c="dimmed">
                      ({group.cards.reduce((total, card) => total + copyCount(card), 0)})
                    </Text>
                  </Title>
                }
              />
              <SimpleGrid {...gridProps}>{group.cards.map(renderTile)}</SimpleGrid>
            </Stack>
          ))}
        </Stack>
      ) : (
        <SimpleGrid {...gridProps}>{pageCards.map(renderTile)}</SimpleGrid>
      )}

      {totalPages > 1 && (
        <Center>
          <Pagination
            total={totalPages}
            value={Math.min(page, totalPages)}
            onChange={(next) => {
              updateParams({ page: next > 1 ? String(next) : null });
              window.scrollTo({ top: 0 });
            }}
          />
        </Center>
      )}

      <Text size="xs" c="dimmed" ta="center" mt="md">
        Images et données de cartes fournies par Scryfall.
      </Text>

      <AddCardModal
        card={cardToAdd}
        onClose={() => {
          setCardToAdd(null);
          setSearchKey((key) => key + 1);
        }}
        defaultStorageId={storageId}
      />
      <CardDetailModal
        card={openedCard}
        imageUrl={openedCard ? images.data?.[openedCard.scryfall_id] : undefined}
        onClose={() => setOpenedCard(null)}
      />
    </Stack>
  );
}
