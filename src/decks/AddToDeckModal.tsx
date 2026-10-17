import {
  Alert,
  Badge,
  Button,
  Center,
  Divider,
  Group,
  Loader,
  Modal,
  Paper,
  ScrollArea,
  Stack,
  Switch,
  Text,
} from '@mantine/core';
import { useState } from 'react';

import { errorMessage } from '../api/errors';
import type { Card, Deck, DeckBoard } from '../api/types';
import { AddCardModal } from '../cards/AddCardModal';
import { useCards } from '../cards/api';
import { CollectionSearchInput } from '../cards/CollectionSearchInput';
import { hasMissingDetails } from '../cards/grouping';
import { MissingDetailsAlert } from '../cards/MissingDetailsAlert';
import { isScryfallOnlySearch, SearchSyntaxHelp, searchSyntaxError } from '../cards/SearchSyntaxHelp';
import { colorCode } from '../scryfall/classify';
import { useScryfallCard } from '../scryfall/hooks';
import { isOpenTo, useAllStorages } from '../storages/api';
import { StorageLabel } from '../storages/StorageLabel';
import { FoilSticker } from '../theme/Sticker';
import { isCommanderFormat, useAddCardToDeck } from './api';
import { BoardPicker } from './BoardSection';
import { CardHoverPreview } from './CardHoverPreview';
import { ADDED_TAGS_DESCRIPTION, TagsField } from './CardTagsInput';
import { hiddenCardsHint, ScryfallFallback } from './ScryfallFallback';
import { useAddTagsToCard } from './tags';

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

const FEW_MATCHES = 5;

const colorNames: Record<string, string> = {
  W: 'blanc',
  U: 'bleu',
  B: 'noir',
  R: 'rouge',
  G: 'vert',
};

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
  const commanderFormat = isCommanderFormat(deck.format);
  const commander = useScryfallCard(commanderFormat ? deck.commander_scryfall_id : null);
  const partner = useScryfallCard(commanderFormat ? deck.partner_scryfall_id : null);
  const commanderIdentity = commander.data?.color_identity
    ? colorCode([...commander.data.color_identity, ...(partner.data?.color_identity ?? [])])
    : null;
  const [restrictToIdentity, setRestrictToIdentity] = useState(true);
  const identityFilter = commanderIdentity !== null && restrictToIdentity ? commanderIdentity : undefined;
  const [query, setQuery] = useState('');
  const storages = useAllStorages();
  const storageNames = new Map<number, string>((storages.data ?? []).map((storage) => [storage.id, storage.name]));
  const closedStorageIds = new Set(
    (storages.data ?? []).filter((storage) => !isOpenTo(storage, deckId)).map((storage) => storage.id),
  );
  const [showLocked, setShowLocked] = useState(false);
  const openToDeck = showLocked ? undefined : deckId;
  const cards = useCards({
    page: 1,
    limit: 30,
    sort: 'name',
    query,
    storageId: undefined,
    colorIdentity: identityFilter,
    openToDeck,
  });
  const unfiltered = useCards({
    page: 1,
    limit: 30,
    sort: 'name',
    query,
    storageId: undefined,
    openToDeck,
  });
  const someIdentitiesUnknown = identityFilter !== undefined && hasMissingDetails(unfiltered.data?.data ?? []);
  const add = useAddCardToDeck();
  const [board, setBoard] = useState<DeckBoard>('main');
  const [tags, setTags] = useState<string[]>([]);
  const cardTags = useAddTagsToCard(deckId);
  const [pendingCardId, setPendingCardId] = useState<number | null>(null);
  const [scryfallPick, setScryfallPick] = useState<string | null>(null);
  const [scryfallRequested, setScryfallRequested] = useState(false);

  function addCard(card: Card) {
    setPendingCardId(card.id);
    add.mutate(
      { deckId, cardId: card.id, board },
      {
        onSuccess: () => cardTags.addTags(card.name, tags),
        onSettled: () => setPendingCardId(null),
      },
    );
  }

  const results = cards.data?.data ?? [];
  const scryfallOnly = isScryfallOnlySearch(cards.error);
  const searchError = scryfallOnly ? null : searchSyntaxError(cards.error);
  const canSearchScryfall = query.length >= 2 && !searchError;
  const showScryfall =
    canSearchScryfall && (results.length === 0 || (cards.data?.total ?? 0) <= FEW_MATCHES || scryfallRequested);
  const ownedNames = new Set(results.map((card) => card.name));

  return (
    <Stack>
      <Paper withBorder p="sm">
        <Stack gap="sm">
          <BoardPicker label="Ajouter dans" value={board} onChange={setBoard} />
          <TagsField
            value={tags}
            onChange={setTags}
            suggestions={cardTags.suggestions}
            description={ADDED_TAGS_DESCRIPTION}
          />
        </Stack>
      </Paper>
      <Divider label="Choisir les cartes" labelPosition="left" />
      <CollectionSearchInput
        placeholder="Rechercher dans ta collection ou sur Scryfall (ex. t:creature c:g)"
        value={query}
        onSearch={setQuery}
        error={searchError}
        loading={cards.isFetching && cards.isPlaceholderData}
        rightSection={<SearchSyntaxHelp />}
        rightSectionPointerEvents="all"
        data-autofocus
      />
      {commanderIdentity !== null && (
        <Switch
          label={`Seulement l'identité de couleur du commandant (${identityLabel(commanderIdentity)})`}
          checked={restrictToIdentity}
          onChange={(event) => setRestrictToIdentity(event.currentTarget.checked)}
        />
      )}
      {closedStorageIds.size > 0 && (
        <Switch
          label="Montrer aussi les rangements verrouillés"
          checked={showLocked}
          onChange={(event) => setShowLocked(event.currentTarget.checked)}
        />
      )}
      {someIdentitiesUnknown && <MissingDetailsAlert />}
      {add.error && <Alert color="red">{errorMessage(add.error)}</Alert>}
      {cardTags.error && <Alert color="red">{errorMessage(cardTags.error)}</Alert>}
      {cards.error && !searchError && !scryfallOnly && <Alert color="red">{errorMessage(cards.error)}</Alert>}

      {cards.isLoading ? (
        <Center p="lg">
          <Loader />
        </Center>
      ) : searchError ? null : results.length === 0 ? (
        <Text c="dimmed" ta="center" pt="md">
          {scryfallOnly
            ? 'Cette recherche utilise une syntaxe que seul Scryfall comprend.'
            : identityFilter !== undefined
              ? "Aucune carte de ta collection dans l'identité de couleur du commandant ne correspond."
              : query
                ? 'Aucune carte de ta collection ne correspond.'
                : 'Ta collection est vide : cherche une carte pour la trouver sur Scryfall.'}
        </Text>
      ) : (
        <Paper withBorder p="sm">
          <Stack gap="xs">
            <Group gap="xs" align="baseline" wrap="wrap">
              <Text size="sm" fw={600}>
                Dans ta collection
              </Text>
              {cards.data && cards.data.total > results.length && (
                <Text size="xs" c="dimmed">
                  {hiddenCardsHint(cards.data.total - results.length)}
                </Text>
              )}
            </Group>
            <ScrollArea.Autosize mah={420} type="auto">
              <Stack gap="xs">
                {results.map((card) => {
                  const inDeck = deckCardIds.has(card.id);
                  const storageName = card.storage_id ? storageNames.get(card.storage_id) : undefined;
                  return (
                    <Group key={card.id} justify="space-between" wrap="nowrap">
                      <div style={{ minWidth: 0 }}>
                        <Group gap={6} wrap="nowrap">
                          <CardHoverPreview scryfallId={card.scryfall_id} name={card.name}>
                            <Text size="sm" fw={500} lineClamp={1}>
                              {card.name}
                            </Text>
                          </CardHoverPreview>
                          {card.foil && <FoilSticker />}
                        </Group>
                        <Group gap={8} wrap="nowrap">
                          <Text size="xs" c="dimmed" style={{ flexShrink: 0 }}>
                            {card.set_code.toUpperCase()} · #{card.collector_number}
                          </Text>
                          {storageName && (
                            <StorageLabel
                              name={storageName}
                              locked={card.storage_id != null && closedStorageIds.has(card.storage_id)}
                            />
                          )}
                        </Group>
                      </div>
                      {inDeck ? (
                        <Badge variant="light" color="gray">
                          Dans le deck
                        </Badge>
                      ) : (
                        <Button
                          size="xs"
                          variant="light"
                          onClick={() => addCard(card)}
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
          </Stack>
        </Paper>
      )}
      {!cards.isLoading &&
        (showScryfall ? (
          <ScryfallFallback
            search={query}
            identity={identityFilter}
            excludeNames={ownedNames}
            onPick={setScryfallPick}
          />
        ) : (
          canSearchScryfall && (
            <Group>
              <Button variant="subtle" size="xs" onClick={() => setScryfallRequested(true)}>
                Chercher aussi sur Scryfall
              </Button>
            </Group>
          )
        ))}
      <AddCardModal
        card={scryfallPick ? { name: scryfallPick } : null}
        onClose={() => setScryfallPick(null)}
        defaultStorageId={undefined}
        target={{ kind: 'pending', deckId, board, tags }}
      />
    </Stack>
  );
}
