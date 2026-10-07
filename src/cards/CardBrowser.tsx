import {
  Alert,
  Center,
  Divider,
  Group,
  Loader,
  Pagination,
  Select,
  SimpleGrid,
  Stack,
  Text,
  TextInput,
  Title,
} from '@mantine/core';
import { useDebouncedValue } from '@mantine/hooks';
import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router';

import { errorMessage } from '../api/errors';
import type { Card, CardSort } from '../api/types';
import { useCardImages } from '../scryfall/hooks';
import { DropOverlay } from '../scryfall/DropOverlay';
import { ScryfallCardSearch } from '../scryfall/ScryfallCardSearch';
import { useScryfallDrop } from '../scryfall/useScryfallDrop';
import { useAllStorages, useStorageOptions } from '../storages/api';
import { AddCardModal, type CardToAdd } from './AddCardModal';
import { copyCount, useCards } from './api';
import { CardDetailModal } from './CardDetailModal';
import { CardSizeControl, useCardSize } from './CardSizeControl';
import { CardTile } from './CardTile';
import { MissingDetailsAlert } from './MissingDetailsAlert';
import { groupCards, groupingOptions, hasMissingDetails, parseGrouping, sortForGrouping } from './grouping';

const PAGE_SIZE = 24;
const GROUPED_PAGE_SIZE = 48;

const sortOptions: { value: CardSort; label: string }[] = [
  { value: '-updated', label: 'Modifiées récemment' },
  { value: '-added', label: 'Ajoutées récemment' },
  { value: 'name', label: 'Nom (A → Z)' },
  { value: '-name', label: 'Nom (Z → A)' },
  { value: 'mana_value', label: 'Coût de mana croissant' },
  { value: '-mana_value', label: 'Coût de mana décroissant' },
  { value: 'color', label: 'Couleur (blanc → vert)' },
  { value: '-color', label: 'Couleur (vert → blanc)' },
  { value: 'type', label: 'Type' },
];

const sortsNeedingDetails: CardSort[] = ['color', '-color', 'type', '-type'];

function parseSort(raw: string | null): CardSort {
  return sortOptions.find((option) => option.value === raw)?.value ?? '-updated';
}

interface CardBrowserProps {
  storageId?: number;
  pageSize?: number;
}

export function CardBrowser({ storageId: fixedStorageId, pageSize: fixedPageSize }: CardBrowserProps) {
  const [params, setParams] = useSearchParams();
  const page = Math.max(1, Number(params.get('page')) || 1);
  const chosenSort = parseSort(params.get('sort'));
  const grouping = parseGrouping(params.get('group'));
  const sort = grouping ? sortForGrouping[grouping] : chosenSort;
  const pageSize = fixedPageSize ?? (grouping ? GROUPED_PAGE_SIZE : PAGE_SIZE);
  const name = params.get('q') ?? '';
  const storageId = fixedStorageId ?? (Number(params.get('storage')) || undefined);

  const [search, setSearch] = useState(name);
  const [debouncedSearch] = useDebouncedValue(search.trim(), 300);
  const [cardToAdd, setCardToAdd] = useState<CardToAdd | null>(null);
  const drop = useScryfallDrop((printing) => setCardToAdd({ name: printing.name, printing }));
  const [searchKey, setSearchKey] = useState(0);
  const [openedCard, setOpenedCard] = useState<Card | null>(null);

  const storageOptions = useStorageOptions();
  const storages = useAllStorages();
  const storageNames = new Map<number, string>((storages.data ?? []).map((storage) => [storage.id, storage.name]));
  const showStorage = !storageId;
  const cards = useCards({ page, limit: pageSize, sort, name, storageId, stack: true });
  const copies = useCards({ page: 1, limit: 1, sort: '-updated', name, storageId });
  const copiesTotal = copies.data?.total;
  const pageCards = cards.data?.data ?? [];
  const images = useCardImages(pageCards.map((card) => card.scryfall_id));
  const showMissingDetails =
    (grouping === 'type' || grouping === 'color' || sortsNeedingDetails.includes(sort)) && hasMissingDetails(pageCards);

  function renderTile(card: Card) {
    return (
      <CardTile
        key={card.id}
        card={card}
        imageUrl={images.data?.[card.scryfall_id]}
        imageLoading={images.isLoading}
        storageName={
          showStorage ? (card.storage_id ? (storageNames.get(card.storage_id) ?? null) : null) : undefined
        }
        onOpen={setOpenedCard}
      />
    );
  }

  const { size, setSize, gridCols } = useCardSize();

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
      updateParams({ storage: null, page: null });
    }
  }, [filteredStorageMissing]);

  const totalPages = cards.data?.total_pages ?? 0;
  useEffect(() => {
    if (!cards.isPlaceholderData && totalPages > 0 && page > totalPages) {
      updateParams({ page: String(totalPages) });
    }
  }, [page, totalPages, cards.isPlaceholderData]);

  const filtered = !!name || (!!storageId && !fixedStorageId);

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
        <CardSizeControl value={size} onChange={setSize} />
      </Group>

      <Group grow align="flex-end">
        <TextInput
          label="Filtrer par nom"
          placeholder="Nom d'une carte de ta collection"
          value={search}
          onChange={(event) => setSearch(event.currentTarget.value)}
        />
        {!fixedStorageId && (
          <Select
            label="Rangement"
            placeholder="Tous les rangements"
            data={storageOptions}
            value={storageId ? String(storageId) : null}
            onChange={(value) => updateParams({ storage: value, page: null })}
            clearable
            searchable
          />
        )}
        <Select
          label="Grouper par"
          placeholder="Aucun regroupement"
          data={groupingOptions}
          value={grouping}
          onChange={(value) => updateParams({ group: value, page: null })}
          clearable
        />
        <Select
          label="Tri"
          data={sortOptions}
          value={grouping ? null : sort}
          placeholder={grouping ? 'Selon le regroupement' : undefined}
          onChange={(value) => updateParams({ sort: value === '-updated' ? null : value, page: null })}
          allowDeselect={false}
          disabled={!!grouping}
        />
      </Group>

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
              <SimpleGrid cols={gridCols} spacing="md" verticalSpacing="lg">
                {group.cards.map(renderTile)}
              </SimpleGrid>
            </Stack>
          ))}
        </Stack>
      ) : (
        <SimpleGrid cols={gridCols} spacing="md" verticalSpacing="lg">
          {pageCards.map(renderTile)}
        </SimpleGrid>
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
