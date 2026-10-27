import {
  ActionIcon,
  Alert,
  Center,
  Collapse,
  Group,
  Indicator,
  Loader,
  Pagination,
  Select,
  Stack,
  Text,
} from '@mantine/core';
import { useLocalStorage } from '@mantine/hooks';
import { useEffect, useState } from 'react';
import { useLocation, useSearchParams } from 'react-router';

import { errorMessage } from '../api/errors';
import type { Card, CardSort } from '../api/types';
import { useCardImages } from '../scryfall/hooks';
import { DropOverlay } from '../scryfall/DropOverlay';
import { ScryfallCardSearch } from '../scryfall/ScryfallCardSearch';
import { useScryfallDrop } from '../scryfall/useScryfallDrop';
import { setDefaultCardPreview, showCardPreview } from '../layout/cardPreview';
import { FilterIcon } from '../layout/FilterIcon';
import { usePreferences, useUpdatePreferences } from '../auth/preferences';
import { useStorageDirectory } from '../storages/useStorageDirectory';
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
import { useCard, useCards } from './api';
import { copyIds, totalCopies } from './copies';
import { useCardContextMenu } from './CardContextMenu';
import { CardDetailModal } from './CardDetailModal';
import { CardDisplayControls, useCardDisplay } from './CardDisplay';
import { SectionTitle } from '../theme/SectionTitle';
import { EmptyNote } from '../theme/EmptyNote';
import { CardGrid, CardGroupsLayout } from './CardLayout';
import { CardTile } from './CardTile';
import { useCardVisuals } from './useCardVisuals';
import { CollectionSearchInput } from './CollectionSearchInput';
import { MissingDetailsAlert } from './MissingDetailsAlert';
import { SearchSyntaxHelp, searchSyntaxError } from './SearchSyntaxHelp';
import { groupCards, groupingOptions, hasMissingDetails, parseGrouping } from './grouping';
import { useCollectionCardMenu } from './useCollectionCardMenu';

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

const priceSortOptions: { value: CardSort; label: string }[] = [
  { value: '-price', label: 'Prix décroissant' },
  { value: 'price', label: 'Prix croissant' },
];

const sortsNeedingDetails: CardSort[] = ['color', '-color', 'type', '-type'];

const DEFAULT_SORT: CardSort = '-added';

function sortChoices(showPrices: boolean) {
  return showPrices ? [...sortOptions, ...priceSortOptions] : sortOptions;
}

function parseSort(raw: string | null, showPrices: boolean): CardSort {
  return sortChoices(showPrices).find((option) => option.value === raw)?.value ?? DEFAULT_SORT;
}

interface CardBrowserProps {
  storageId?: number;
  pageSize?: number;
}

export function CardBrowser({ storageId: fixedStorageId, pageSize: fixedPageSize }: CardBrowserProps) {
  const [params, setParams] = useSearchParams();
  const { pathname } = useLocation();
  const page = Math.max(1, Number(params.get('page')) || 1);
  const preferences = usePreferences();
  const updatePreferences = useUpdatePreferences();
  const showPrices = preferences.data?.show_prices ?? false;
  const sort = parseSort(preferences.data?.collection_sort ?? null, showPrices);
  const grouping = parseGrouping(preferences.data?.collection_grouping ?? null);
  const { chosen: chosenPageSize, setChosen: setChosenPageSize } = usePageSize();
  const pageSize = chosenPageSize ?? fixedPageSize ?? (grouping ? GROUPED_PAGE_SIZE : PAGE_SIZE);
  const query = params.get('q') ?? '';
  const parsedFilters = parseAdvancedFilters(params);
  const advanced = fixedStorageId ? { ...parsedFilters, storageType: null, storageId: null } : parsedFilters;
  const storageId = fixedStorageId ?? advanced.storageId ?? undefined;
  const activeFilters = activeFilterCount(advanced, !fixedStorageId);
  const queryFilters = cardsQueryFilters(advanced);
  const [advancedOpen, setAdvancedOpen] = useState(activeFilters > 0);

  const [cardToAdd, setCardToAdd] = useState<CardToAdd | null>(null);
  const drop = useScryfallDrop((printing) => setCardToAdd({ name: printing.name, printing }));
  const [searchKey, setSearchKey] = useState(0);
  const [opened, setOpened] = useState<{ card: Card; ids: number[] } | null>(null);
  const linkedCardId = Number(params.get('carte')) || null;
  const linkedCard = useCard(linkedCardId);
  const contextMenu = useCardContextMenu();
  const cardMenu = useCollectionCardMenu();

  const storageDirectory = useStorageDirectory();
  const showStorage = !storageId;
  const cards = useCards({
    page,
    limit: pageSize,
    sort,
    group: grouping ?? undefined,
    query,
    storageId,
    stack: true,
    advanced: queryFilters,
  });
  const pageCards = cards.data?.data ?? [];
  const openedOnPage = opened ? pageCards.find((stack) => copyIds(stack).includes(opened.ids[0])) : undefined;
  const openedElsewhere = useCard(opened && !openedOnPage ? opened.ids[0] : null);
  const openedCard = opened
    ? (openedOnPage ??
      (openedElsewhere.data
        ? { ...openedElsewhere.data, copy_ids: opened.ids, quantity: opened.ids.length }
        : opened.card))
    : null;
  const detailCard = openedCard ?? (linkedCardId ? (linkedCard.data ?? null) : null);
  const detailImage = useCardImages(detailCard ? [detailCard.scryfall_id] : []);
  const display = useCardDisplay();
  const visuals = useCardVisuals(pageCards, display);
  const showMissingDetails =
    (grouping === 'type' || grouping === 'color' || sortsNeedingDetails.includes(sort)) && hasMissingDetails(pageCards);

  const groups = grouping ? groupCards(pageCards, grouping) : null;
  const firstCard = groups ? groups[0]?.cards[0] : pageCards[0];
  const firstImage = firstCard ? visuals.imageUrl(firstCard) : undefined;
  useEffect(() => {
    setDefaultCardPreview(
      firstCard
        ? {
            name: firstCard.name,
            scryfallId: firstCard.scryfall_id,
            foil: firstCard.foil,
            imageUrl: firstImage,
            open: () => openCard(firstCard),
          }
        : null,
      pathname,
    );
  });
  useEffect(() => () => setDefaultCardPreview(null), []);
  useEffect(() => showCardPreview(null), [page]);

  function openCard(card: Card) {
    setOpened({ card, ids: copyIds(card) });
  }

  function renderTile(card: Card) {
    return (
      <CardTile
        key={card.id}
        card={card}
        faces={visuals.faces(card)}
        imageLoading={visuals.imageLoading}
        display={display}
        manaCost={visuals.manaCost(card)}
        storageName={showStorage ? storageDirectory.nameOf(card.storage_id) : undefined}
        onOpen={openCard}
        onContextMenu={(event, clicked, shown) => contextMenu.open(event, cardMenu.menuFor(clicked, shown))}
      />
    );
  }

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

  const filteredStorageMissing =
    !fixedStorageId && !!storageId && storageDirectory.loaded && !storageDirectory.has(storageId);
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

  const filtered = !!query || activeFilters > 0;
  const searchError = searchSyntaxError(cards.error);

  function changeFilters(changes: Partial<AdvancedFilters>) {
    updateParams({ ...advancedFilterParams(changes), page: null });
  }

  function resetFilters() {
    updateParams({ ...Object.fromEntries(advancedFilterKeys.map((key) => [key, null])), page: null });
  }

  function groupingSelect() {
    return (
      <Select
        label="Grouper par"
        placeholder="Aucun regroupement"
        data={groupingOptions}
        value={grouping}
        onChange={(value) => {
          const next = parseGrouping(value);
          updatePreferences.mutate(next ? { collection_grouping: next } : { clear_collection_grouping: true });
          updateParams({ page: null });
        }}
        clearable
        w={200}
      />
    );
  }

  function sortSelect() {
    return (
      <Select
        label={grouping ? 'Tri dans chaque groupe' : 'Tri'}
        data={sortChoices(showPrices)}
        value={sort}
        onChange={(value) => {
          updatePreferences.mutate({ collection_sort: parseSort(value, showPrices) });
          updateParams({ page: null });
        }}
        allowDeselect={false}
        w={240}
        miw={0}
      />
    );
  }

  return (
    <Stack>
      <ScryfallCardSearch
        key={searchKey}
        label="Ajouter une carte"
        placeholder="Cherche une carte sur Scryfall (ex. Lightning Bolt, ou t:creature c:g)"
        onSelect={(selected) => setCardToAdd({ name: selected })}
        hint="Tu peux aussi glisser-déposer une carte depuis scryfall.com ou edhrec.com, directement dans l'édition voulue."
      />
      <DropOverlay dragging={drop.dragging} resolving={drop.resolving} />

      <Group justify="flex-end" align="flex-end" gap="md">
        <Group gap="md" align="flex-end" wrap="nowrap">
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
          {groupingSelect()}
        </Group>
        <CardDisplayControls display={display} wrap="nowrap" options={sortSelect()} />
      </Group>

      <Group grow align="flex-end">
        <Group gap="xs" wrap="nowrap" align="flex-end">
          <CollectionSearchInput
            label={
              <Group gap={8} component="span" display="inline-flex" mb={6}>
                Rechercher
                <SearchSyntaxHelp />
              </Group>
            }
            placeholder="Nom ou syntaxe Scryfall : t:creature c:g mv<=3"
            value={query}
            onSearch={(next) => updateParams({ q: next || null, page: null })}
            error={searchError}
            loading={cards.isFetching && cards.isPlaceholderData}
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
              <FilterIcon />
            </ActionIcon>
          </Indicator>
        </Group>
      </Group>

      <Collapse in={advancedOpen}>
        <AdvancedSearch
          filters={advanced}
          showStorage={!fixedStorageId}
          onChange={changeFilters}
          onReset={resetFilters}
        />
      </Collapse>

      {cards.error && !searchError && <Alert color="red">{errorMessage(cards.error)}</Alert>}

      {showMissingDetails && <MissingDetailsAlert />}

      {cards.isLoading ? (
        <Center p="xl">
          <Loader />
        </Center>
      ) : pageCards.length === 0 && !cards.error ? (
        <EmptyNote
          title={
            filtered
              ? 'Aucune carte ne correspond à ces filtres'
              : fixedStorageId
                ? 'Ce rangement est vide pour le moment'
                : 'Ta collection est vide pour le moment'
          }
          note={
            filtered ? 'essaie d’enlever un filtre ou deux' : 'cherche une carte dans la barre, là-haut, pour l’ajouter'
          }
          arrow={filtered ? undefined : 'up'}
        />
      ) : groups ? (
        <CardGroupsLayout
          display={display}
          groups={groups.map((group, index) => ({
            key: `${index}-${group.label}`,
            cards: group.cards,
            header: <SectionTitle count={totalCopies(group.cards)}>{group.label}</SectionTitle>,
          }))}
          renderTile={renderTile}
        />
      ) : (
        <CardGrid display={display} cards={pageCards} renderTile={renderTile} />
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
      {contextMenu.element}
      {cardMenu.modals}
      <CardDetailModal
        card={detailCard}
        imageUrl={detailCard ? detailImage.data?.[detailCard.scryfall_id] : undefined}
        onUpdated={(ids) => detailCard && setOpened({ card: detailCard, ids })}
        onClose={() => {
          setOpened(null);
          if (linkedCardId) {
            updateParams({ carte: null });
          }
        }}
      />
    </Stack>
  );
}
