import {
  Alert,
  Badge,
  Button,
  Center,
  Group,
  Loader,
  Modal,
  ScrollArea,
  Stack,
  Switch,
  Text,
  TextInput,
} from '@mantine/core';
import { useDebouncedValue } from '@mantine/hooks';
import { useState } from 'react';

import { errorMessage } from '../api/errors';
import type { Deck } from '../api/types';
import { AddCardModal } from '../cards/AddCardModal';
import { useCards } from '../cards/api';
import { hasMissingDetails } from '../cards/grouping';
import { MissingDetailsAlert } from '../cards/MissingDetailsAlert';
import { colorCode } from '../scryfall/classify';
import { useScryfallCard } from '../scryfall/hooks';
import { useAllStorages } from '../storages/api';
import { isCommanderFormat, useAddCardToDeck } from './api';
import { ScryfallFallback } from './ScryfallFallback';

interface AddToDeckModalProps {
  deck: Deck;
  deckCardIds: Set<number>;
  opened: boolean;
  onClose: () => void;
}

export function AddToDeckModal({ deck, deckCardIds, opened, onClose }: AddToDeckModalProps) {
  return (
    <Modal opened={opened} onClose={onClose} title="Ajouter des cartes de ta collection" size="lg">
      {opened && <AddToDeckList deck={deck} deckCardIds={deckCardIds} />}
    </Modal>
  );
}

const colorNames: Record<string, string> = { W: 'blanc', U: 'bleu', B: 'noir', R: 'rouge', G: 'vert' };

function identityLabel(identity: string) {
  return identity === ''
    ? 'incolore'
    : identity
        .split('')
        .map((color) => colorNames[color])
        .join(', ');
}

function AddToDeckList({ deck, deckCardIds }: { deck: Deck; deckCardIds: Set<number> }) {
  const deckId = deck.id;
  const commander = useScryfallCard(isCommanderFormat(deck.format) ? deck.commander_scryfall_id : null);
  const commanderIdentity = commander.data?.color_identity ? colorCode(commander.data.color_identity) : null;
  const [restrictToIdentity, setRestrictToIdentity] = useState(true);
  const identityFilter = commanderIdentity !== null && restrictToIdentity ? commanderIdentity : undefined;
  const [search, setSearch] = useState('');
  const [debouncedSearch] = useDebouncedValue(search.trim(), 300);
  const cards = useCards({
    page: 1,
    limit: 30,
    sort: 'name',
    name: debouncedSearch,
    storageId: undefined,
    colorIdentity: identityFilter,
  });
  const unfiltered = useCards({ page: 1, limit: 30, sort: 'name', name: debouncedSearch, storageId: undefined });
  const someIdentitiesUnknown = identityFilter !== undefined && hasMissingDetails(unfiltered.data?.data ?? []);
  const storages = useAllStorages();
  const storageNames = new Map<number, string>((storages.data ?? []).map((storage) => [storage.id, storage.name]));
  const add = useAddCardToDeck();
  const [pendingCardId, setPendingCardId] = useState<number | null>(null);
  const [scryfallPick, setScryfallPick] = useState<string | null>(null);

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
      {commanderIdentity !== null && (
        <Switch
          label={`Seulement l'identité de couleur du commandant (${identityLabel(commanderIdentity)})`}
          checked={restrictToIdentity}
          onChange={(event) => setRestrictToIdentity(event.currentTarget.checked)}
        />
      )}
      {someIdentitiesUnknown && <MissingDetailsAlert />}
      {add.error && <Alert color="red">{errorMessage(add.error)}</Alert>}
      {cards.error && <Alert color="red">{errorMessage(cards.error)}</Alert>}

      {cards.isLoading ? (
        <Center p="lg">
          <Loader />
        </Center>
      ) : results.length === 0 ? (
        <Stack gap="md">
          <Text c="dimmed" ta="center" pt="md">
            {identityFilter !== undefined
              ? "Aucune carte de ta collection dans l'identité de couleur du commandant ne correspond."
              : debouncedSearch
                ? 'Aucune carte de ta collection ne correspond.'
                : 'Ta collection est vide : cherche une carte pour la trouver sur Scryfall.'}
          </Text>
          {debouncedSearch.length >= 2 && (
            <ScryfallFallback search={debouncedSearch} identity={identityFilter} onPick={setScryfallPick} />
          )}
        </Stack>
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
      <AddCardModal
        card={scryfallPick ? { name: scryfallPick } : null}
        onClose={() => setScryfallPick(null)}
        defaultStorageId={undefined}
        target={{ kind: 'pending', deckId }}
      />
    </Stack>
  );
}
