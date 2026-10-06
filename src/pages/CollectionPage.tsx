import {
  Alert,
  Anchor,
  Button,
  Center,
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
import { AddCardModal } from '../cards/AddCardModal';
import { useCards } from '../cards/api';
import { CardDetailModal } from '../cards/CardDetailModal';
import { CardTile } from '../cards/CardTile';
import { useCardImages } from '../scryfall/hooks';
import { useStorageOptions } from '../storages/api';

const PAGE_SIZE = 24;

const sortOptions: { value: CardSort; label: string }[] = [
  { value: '-updated', label: 'Modifiées récemment' },
  { value: '-added', label: 'Ajoutées récemment' },
  { value: 'name', label: 'Nom (A → Z)' },
  { value: '-name', label: 'Nom (Z → A)' },
  { value: 'mana_value', label: 'Coût de mana croissant' },
  { value: '-mana_value', label: 'Coût de mana décroissant' },
];

function parseSort(raw: string | null): CardSort {
  return sortOptions.find((option) => option.value === raw)?.value ?? '-updated';
}

export function CollectionPage() {
  const [params, setParams] = useSearchParams();
  const page = Math.max(1, Number(params.get('page')) || 1);
  const sort = parseSort(params.get('sort'));
  const name = params.get('q') ?? '';
  const storageId = Number(params.get('storage')) || undefined;

  const [search, setSearch] = useState(name);
  const [debouncedSearch] = useDebouncedValue(search.trim(), 300);
  const [addOpened, setAddOpened] = useState(false);
  const [openedCard, setOpenedCard] = useState<Card | null>(null);

  const storageOptions = useStorageOptions();
  const cards = useCards({ page, limit: PAGE_SIZE, sort, name, storageId });
  const pageCards = cards.data?.data ?? [];
  const images = useCardImages(pageCards.map((card) => card.scryfall_id));

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

  const totalPages = cards.data?.total_pages ?? 0;
  useEffect(() => {
    if (!cards.isPlaceholderData && totalPages > 0 && page > totalPages) {
      updateParams({ page: String(totalPages) });
    }
  }, [page, totalPages, cards.isPlaceholderData]);

  const filtered = !!name || !!storageId;

  return (
    <Stack>
      <Group justify="space-between">
        <div>
          <Title order={2}>Collection</Title>
          {cards.data && (
            <Text size="sm" c="dimmed">
              {cards.data.total} carte{cards.data.total > 1 ? 's' : ''}
              {filtered ? ' correspondant aux filtres' : ''}
            </Text>
          )}
        </div>
        <Button onClick={() => setAddOpened(true)}>Ajouter une carte</Button>
      </Group>

      <Group grow align="flex-end">
        <TextInput
          label="Nom"
          placeholder="Rechercher une carte"
          value={search}
          onChange={(event) => setSearch(event.currentTarget.value)}
        />
        <Select
          label="Rangement"
          placeholder="Tous les rangements"
          data={storageOptions}
          value={storageId ? String(storageId) : null}
          onChange={(value) => updateParams({ storage: value, page: null })}
          clearable
          searchable
        />
        <Select
          label="Tri"
          data={sortOptions}
          value={sort}
          onChange={(value) => updateParams({ sort: value === '-updated' ? null : value, page: null })}
          allowDeselect={false}
        />
      </Group>

      {cards.error && <Alert color="red">{errorMessage(cards.error)}</Alert>}

      {cards.isLoading ? (
        <Center p="xl">
          <Loader />
        </Center>
      ) : pageCards.length === 0 && !cards.error ? (
        <Center p="xl">
          <Stack align="center" gap="xs">
            <Text c="dimmed">
              {filtered ? 'Aucune carte ne correspond à ces filtres.' : 'Ta collection est vide pour le moment.'}
            </Text>
            {!filtered && (
              <Anchor component="button" onClick={() => setAddOpened(true)}>
                Ajouter ta première carte
              </Anchor>
            )}
          </Stack>
        </Center>
      ) : (
        <SimpleGrid cols={{ base: 2, xs: 3, sm: 4, lg: 6 }} spacing="md" verticalSpacing="lg">
          {pageCards.map((card) => (
            <CardTile
              key={card.id}
              card={card}
              imageUrl={images.data?.[card.scryfall_id]}
              imageLoading={images.isLoading}
              onOpen={setOpenedCard}
            />
          ))}
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

      <AddCardModal opened={addOpened} onClose={() => setAddOpened(false)} defaultStorageId={storageId} />
      <CardDetailModal
        card={openedCard}
        imageUrl={openedCard ? images.data?.[openedCard.scryfall_id] : undefined}
        onClose={() => setOpenedCard(null)}
      />
    </Stack>
  );
}
