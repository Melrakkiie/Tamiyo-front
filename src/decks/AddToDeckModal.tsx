import { Alert, Badge, Button, Center, Group, Loader, Modal, ScrollArea, Stack, Text, TextInput } from '@mantine/core';
import { useDebouncedValue } from '@mantine/hooks';
import { useState } from 'react';

import { errorMessage } from '../api/errors';
import { useCards } from '../cards/api';
import { useAllStorages } from '../storages/api';
import { useAddCardToDeck } from './api';

interface AddToDeckModalProps {
  deckId: number;
  deckCardIds: Set<number>;
  opened: boolean;
  onClose: () => void;
}

export function AddToDeckModal({ deckId, deckCardIds, opened, onClose }: AddToDeckModalProps) {
  return (
    <Modal opened={opened} onClose={onClose} title="Ajouter des cartes de ta collection" size="lg">
      {opened && <AddToDeckList deckId={deckId} deckCardIds={deckCardIds} />}
    </Modal>
  );
}

function AddToDeckList({ deckId, deckCardIds }: { deckId: number; deckCardIds: Set<number> }) {
  const [search, setSearch] = useState('');
  const [debouncedSearch] = useDebouncedValue(search.trim(), 300);
  const cards = useCards({ page: 1, limit: 30, sort: 'name', name: debouncedSearch, storageId: undefined });
  const storages = useAllStorages();
  const storageNames = new Map<number, string>((storages.data ?? []).map((storage) => [storage.id, storage.name]));
  const add = useAddCardToDeck();
  const [pendingCardId, setPendingCardId] = useState<number | null>(null);

  function addCard(cardId: number) {
    setPendingCardId(cardId);
    add.mutate({ deckId, cardId }, { onSettled: () => setPendingCardId(null) });
  }

  const results = cards.data?.data ?? [];

  return (
    <Stack>
      <TextInput
        placeholder="Rechercher dans ta collection"
        value={search}
        onChange={(event) => setSearch(event.currentTarget.value)}
        data-autofocus
      />
      {add.error && <Alert color="red">{errorMessage(add.error)}</Alert>}
      {cards.error && <Alert color="red">{errorMessage(cards.error)}</Alert>}

      {cards.isLoading ? (
        <Center p="lg">
          <Loader />
        </Center>
      ) : results.length === 0 ? (
        <Text c="dimmed" ta="center" p="lg">
          {debouncedSearch ? 'Aucune carte de ta collection ne correspond.' : 'Ta collection est vide.'}
        </Text>
      ) : (
        <ScrollArea.Autosize mah={420} type="auto">
          <Stack gap="xs">
            {results.map((card) => {
              const inDeck = deckCardIds.has(card.id);
              const storageName = card.storage_id ? storageNames.get(card.storage_id) : undefined;
              return (
                <Group key={card.id} justify="space-between" wrap="nowrap">
                  <div style={{ minWidth: 0 }}>
                    <Group gap={6} wrap="nowrap">
                      <Text size="sm" fw={500} lineClamp={1}>
                        {card.name}
                      </Text>
                      {card.foil && (
                        <Badge size="xs" variant="light">
                          Foil
                        </Badge>
                      )}
                    </Group>
                    <Text size="xs" c="dimmed" lineClamp={1}>
                      {card.set_code.toUpperCase()} · #{card.collector_number}
                      {storageName ? ` · ${storageName}` : ''}
                    </Text>
                  </div>
                  {inDeck ? (
                    <Badge variant="light" color="gray">
                      Dans le deck
                    </Badge>
                  ) : (
                    <Button
                      size="xs"
                      variant="light"
                      onClick={() => addCard(card.id)}
                      loading={pendingCardId === card.id}
                      disabled={pendingCardId !== null && pendingCardId !== card.id}
                    >
                      Ajouter
                    </Button>
                  )}
                </Group>
              );
            })}
          </Stack>
        </ScrollArea.Autosize>
      )}
      {cards.data && cards.data.total > results.length && (
        <Text size="xs" c="dimmed">
          {cards.data.total - results.length} autres cartes : affine la recherche pour les voir.
        </Text>
      )}
    </Stack>
  );
}
