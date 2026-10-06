import {
  Alert,
  Anchor,
  Badge,
  Box,
  Button,
  Center,
  Divider,
  Group,
  Loader,
  Paper,
  Select,
  SimpleGrid,
  Stack,
  Tabs,
  Text,
  Title,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router';

import { ApiError, errorMessage } from '../api/errors';
import type { Card, Deck, DeckCardSort } from '../api/types';
import { useExportDeck } from '../bulk/api';
import { useCard } from '../cards/api';
import { CardImage } from '../cards/CardImage';
import { CardTile } from '../cards/CardTile';
import {
  type CardGrouping,
  groupCards,
  groupingOptions,
  hasMissingDetails,
  parseGrouping,
  sortIntoGroups,
} from '../cards/grouping';
import { MissingDetailsAlert } from '../cards/MissingDetailsAlert';
import { AddToDeckModal } from '../decks/AddToDeckModal';
import { artBackground, artCredit, deckArtId } from '../decks/art';
import { ArtPickerModal } from '../decks/ArtPickerModal';
import { isCommanderFormat, useDeck, useDeckCards, useDeleteDeck, usePendingCards, useUpdateDeck } from '../decks/api';
import { DeckCardModal } from '../decks/DeckCardModal';
import { DeckFormModal } from '../decks/DeckFormModal';
import { DeckLegalityPanel } from '../decks/DeckLegalityPanel';
import { DeckStatsPanel } from '../decks/DeckStatsPanel';
import { PendingCardModal } from '../decks/PendingCardModal';
import { isPendingCard, pendingIdOf, pendingToCards, sortDeckCards } from '../decks/pendingCards';
import { PendingCardsSection } from '../decks/PendingCardsSection';
import { useCardArts, useCardImages } from '../scryfall/hooks';
import { useAllStorages } from '../storages/api';

const sortOptions: { value: DeckCardSort; label: string }[] = [
  { value: 'name', label: 'Nom (A → Z)' },
  { value: 'mana_value', label: 'Coût de mana croissant' },
  { value: '-mana_value', label: 'Coût de mana décroissant' },
  { value: '-added', label: 'Ajoutées récemment' },
];

const gridCols = { base: 2, xs: 3, sm: 4, lg: 6 };

export function DeckPage() {
  const id = Number(useParams().id);
  return <DeckView key={id} id={id} />;
}

function DeckView({ id }: { id: number }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const deck = useDeck(id);
  const update = useUpdateDeck();
  const remove = useDeleteDeck();
  const [editOpened, setEditOpened] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [tab, setTab] = useState<string | null>('cards');
  const [artPickerOpened, setArtPickerOpened] = useState(false);
  const exportDeck = useExportDeck();
  const artId = deck.data ? deckArtId(deck.data) : null;
  const arts = useCardArts([artId]);
  const art = artId ? (arts.data?.[artId] ?? null) : null;

  function closeEdit() {
    setEditOpened(false);
    update.reset();
  }

  function deleteDeck() {
    remove.mutate(id, {
      onSuccess: () => {
        notifications.show({
          color: 'green',
          message: `${deck.data?.name ?? 'Le deck'} a été supprimé. Ses cartes restent dans ta collection.`,
        });
        navigate('/decks', { replace: true });
        queryClient.removeQueries({ predicate: (query) => query.queryKey[0] === 'decks' && query.queryKey[2] === id });
      },
    });
  }

  if (deck.isLoading) {
    return (
      <Center p="xl">
        <Loader />
      </Center>
    );
  }

  if (!deck.data) {
    const notFound = deck.error instanceof ApiError && (deck.error.status === 404 || deck.error.status === 400);
    return (
      <Stack align="flex-start">
        <Alert color="red">{notFound ? "Ce deck n'existe pas ou a été supprimé." : errorMessage(deck.error)}</Alert>
        <Anchor component={Link} to="/decks">
          Retour aux decks
        </Anchor>
      </Stack>
    );
  }

  const current = deck.data;

  return (
    <Stack>
      <Anchor component={Link} to="/decks" size="sm">
        ← Decks
      </Anchor>

      {deck.error && <Alert color="orange">{errorMessage(deck.error)}</Alert>}

      <Paper
        radius="md"
        p={art ? 'lg' : 0}
        mih={art ? 200 : undefined}
        style={art ? { ...artBackground(art.url, 'light'), display: 'flex', flexDirection: 'column' } : undefined}
      >
        <Group justify="space-between" align="flex-start" style={art ? { marginTop: 'auto' } : undefined}>
          <Group gap="sm">
            <Title order={2} c={art ? 'white' : undefined}>
              {current.name}
            </Title>
            <Badge variant={art ? 'white' : 'light'}>{current.format}</Badge>
          </Group>
          <Group gap="xs">
            <Button variant="default" onClick={() => setArtPickerOpened(true)}>
              Illustration
            </Button>
            <Button
              variant="default"
              loading={exportDeck.isPending}
              onClick={() =>
                exportDeck.mutate(id, {
                  onError: (err) => notifications.show({ color: 'red', message: errorMessage(err) }),
                })
              }
            >
              Exporter
            </Button>
            <Button variant="default" onClick={() => setEditOpened(true)}>
              Modifier
            </Button>
            {confirmingDelete ? (
              <>
                <Button color="red" onClick={deleteDeck} loading={remove.isPending}>
                  Confirmer la suppression
                </Button>
                <Button variant="default" onClick={() => setConfirmingDelete(false)}>
                  Annuler
                </Button>
              </>
            ) : (
              <Button color="red" variant={art ? 'filled' : 'subtle'} onClick={() => setConfirmingDelete(true)}>
                Supprimer
              </Button>
            )}
          </Group>
        </Group>
        {art && (
          <Text size="xs" c="gray.4" ta="right" mt="xs">
            {artCredit(art.artist)}
          </Text>
        )}
      </Paper>

      {confirmingDelete && (
        <Alert color="orange">Supprimer ce deck ne supprime pas ses cartes : elles restent dans ta collection.</Alert>
      )}
      {remove.error && <Alert color="red">{errorMessage(remove.error)}</Alert>}

      <CommanderSection deck={current} />

      <Tabs value={tab} onChange={setTab}>
        <Tabs.List>
          <Tabs.Tab value="cards">Cartes ({current.card_count})</Tabs.Tab>
          <Tabs.Tab value="stats">Statistiques</Tabs.Tab>
          <Tabs.Tab value="legality">Légalité</Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="cards" pt="md">
          <DeckCards deck={current} />
        </Tabs.Panel>
        <Tabs.Panel value="stats" pt="md">
          {tab === 'stats' && <DeckStatsPanel deckId={current.id} />}
        </Tabs.Panel>
        <Tabs.Panel value="legality" pt="md">
          {tab === 'legality' && <DeckLegalityPanel deckId={current.id} />}
        </Tabs.Panel>
      </Tabs>

      <ArtPickerModal deck={current} opened={artPickerOpened} onClose={() => setArtPickerOpened(false)} />
      <DeckFormModal
        opened={editOpened}
        onClose={closeEdit}
        title="Modifier le deck"
        submitLabel="Enregistrer"
        initial={current}
        pending={update.isPending}
        error={update.error}
        onSubmit={(values) =>
          update.mutate(
            { id: current.id, changes: values },
            {
              onSuccess: () => {
                notifications.show({ color: 'green', message: 'Deck mis à jour.' });
                closeEdit();
              },
            },
          )
        }
      />
    </Stack>
  );
}

function CommanderSection({ deck }: { deck: Deck }) {
  const commander = useCard(deck.commander_id);
  const image = useCardImages(commander.data ? [commander.data.scryfall_id] : [], 'small');
  const update = useUpdateDeck();

  if (!deck.commander_id) {
    return isCommanderFormat(deck.format) ? (
      <Text size="sm" c="dimmed">
        Pas encore de commandant : ouvre une carte du deck pour la définir comme commandant.
      </Text>
    ) : null;
  }

  return (
    <Paper withBorder p="sm" maw={420}>
      <Group wrap="nowrap" align="center">
        <Box w={72} style={{ flexShrink: 0 }}>
          <CardImage
            name={commander.data?.name ?? ''}
            url={commander.data ? image.data?.[commander.data.scryfall_id] : undefined}
            loading={commander.isLoading || image.isLoading}
          />
        </Box>
        <Stack gap={4} style={{ minWidth: 0 }}>
          <Text size="xs" c="dimmed">
            Commandant
          </Text>
          <Text fw={600} lineClamp={1}>
            {commander.data?.name ?? '…'}
          </Text>
          {update.error && (
            <Text size="xs" c="red">
              {errorMessage(update.error)}
            </Text>
          )}
          <Anchor
            component="button"
            size="xs"
            ta="left"
            onClick={() => update.mutate({ id: deck.id, changes: { clear_commander_id: true } })}
          >
            Retirer le commandant
          </Anchor>
        </Stack>
      </Group>
    </Paper>
  );
}

function DeckCards({ deck }: { deck: Deck }) {
  const [sort, setSort] = useState<DeckCardSort>('name');
  const [grouping, setGrouping] = useState<CardGrouping | null>('type');
  const cards = useDeckCards(deck.id, sort);
  const deckCards = cards.data ?? [];
  const pending = usePendingCards(deck.id);
  const pendingItems = pending.data ?? [];
  const allCards =
    pendingItems.length > 0 ? sortDeckCards([...deckCards, ...pendingToCards(pendingItems)], sort) : deckCards;
  const groups = grouping ? groupCards(sortIntoGroups(allCards, grouping), grouping) : [];
  const showMissingDetails = (grouping === 'type' || grouping === 'color') && hasMissingDetails(deckCards);
  const images = useCardImages(allCards.map((card) => card.scryfall_id));
  const storages = useAllStorages();
  const storageNames = new Map<number, string>((storages.data ?? []).map((storage) => [storage.id, storage.name]));
  const [addOpened, setAddOpened] = useState(false);
  const [openedCard, setOpenedCard] = useState<Card | null>(null);
  const [openedPending, setOpenedPending] = useState<Card | null>(null);

  function renderTile(card: Card) {
    const notOwned = isPendingCard(card);
    return (
      <CardTile
        key={card.id}
        card={card}
        imageUrl={images.data?.[card.scryfall_id]}
        imageLoading={images.isLoading}
        storageName={card.storage_id ? (storageNames.get(card.storage_id) ?? null) : null}
        notOwned={notOwned}
        onOpen={notOwned ? setOpenedPending : setOpenedCard}
      />
    );
  }

  return (
    <Stack>
      <Group justify="space-between" align="flex-end">
        <Group align="flex-end">
          <Select
            label="Grouper par"
            placeholder="Aucun regroupement"
            data={groupingOptions}
            value={grouping}
            onChange={(value) => setGrouping(parseGrouping(value))}
            clearable
            w={200}
          />
          <Select
            label={grouping ? 'Tri dans chaque groupe' : 'Tri'}
            data={sortOptions}
            value={sort}
            onChange={(value) => value && setSort(value as DeckCardSort)}
            allowDeselect={false}
            w={240}
          />
        </Group>
        <Button onClick={() => setAddOpened(true)}>Ajouter des cartes</Button>
      </Group>

      {cards.error && <Alert color="red">{errorMessage(cards.error)}</Alert>}

      <PendingCardsSection deckId={deck.id} pending={pendingItems} />

      {showMissingDetails && <MissingDetailsAlert />}

      {cards.isLoading ? (
        <Center p="xl">
          <Loader />
        </Center>
      ) : allCards.length === 0 ? (
        <Center p="xl">
          <Text c="dimmed">Ce deck est vide : ajoute des cartes de ta collection.</Text>
        </Center>
      ) : grouping ? (
        <Stack gap="lg">
          {groups.map((group) => (
            <Stack key={group.label} gap="sm">
              <Divider
                labelPosition="left"
                label={
                  <Title order={4}>
                    {group.label}{' '}
                    <Text span size="sm" c="dimmed">
                      ({group.cards.length})
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
          {allCards.map(renderTile)}
        </SimpleGrid>
      )}

      <AddToDeckModal
        deck={deck}
        deckCardIds={new Set(deckCards.map((card) => card.id))}
        opened={addOpened}
        onClose={() => setAddOpened(false)}
      />
      <DeckCardModal
        deckId={deck.id}
        deckFormat={deck.format}
        commanderId={deck.commander_id}
        deckCardIds={new Set(deckCards.map((card) => card.id))}
        card={openedCard}
        imageUrl={openedCard ? images.data?.[openedCard.scryfall_id] : undefined}
        onClose={() => setOpenedCard(null)}
      />
      <PendingCardModal
        deckId={deck.id}
        card={openedPending}
        item={openedPending ? pendingItems.find((item) => item.id === pendingIdOf(openedPending)) : undefined}
        imageUrl={openedPending ? images.data?.[openedPending.scryfall_id] : undefined}
        onClose={() => setOpenedPending(null)}
      />
    </Stack>
  );
}
