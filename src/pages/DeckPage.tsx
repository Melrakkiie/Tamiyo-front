import {
  Alert,
  Anchor,
  Badge,
  Box,
  Button,
  Center,
  Group,
  Loader,
  Menu,
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
import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate, useParams, useSearchParams } from 'react-router';

import { ApiError, errorMessage } from '../api/errors';
import type { Card, Deck, DeckCardSort } from '../api/types';
import { useSession } from '../auth/useSession';
import { useCard } from '../cards/api';
import { CardImage } from '../cards/CardImage';
import { CardSizeControl, useCardSize } from '../cards/CardSizeControl';
import { CardTile } from '../cards/CardTile';
import { hasMissingDetails } from '../cards/grouping';
import { MissingDetailsAlert } from '../cards/MissingDetailsAlert';
import { AddToDeckModal } from '../decks/AddToDeckModal';
import { artBackground, artCredit, deckArtId } from '../decks/art';
import { ArtPickerModal } from '../decks/ArtPickerModal';
import { isCommanderFormat, useDeck, useDeckCards, useDeleteDeck, usePendingCards, useUpdateDeck } from '../decks/api';
import { DeckCardGroups, useDeckCardGroups } from '../decks/DeckCardGroups';
import { DeckCardModal } from '../decks/DeckCardModal';
import { DeckFormModal } from '../decks/DeckFormModal';
import { DeckLegalityWarning } from '../decks/DeckLegalityWarning';
import { DeckStatsPanel } from '../decks/DeckStatsPanel';
import { ExportDeckModal } from '../decks/ExportDeckModal';
import { ImportListModal } from '../decks/ImportListModal';
import { PendingCardModal } from '../decks/PendingCardModal';
import { isPendingCard, pendingIdOf, pendingToCards, sortDeckCards, stackCards } from '../decks/pendingCards';
import { PendingCardsSection } from '../decks/PendingCardsSection';
import { ShareDeckModal } from '../decks/ShareDeckModal';
import { type DeckCardGrouping, deckGroupingOptions, parseDeckGrouping } from '../decks/storageGrouping';
import { visibilityOption } from '../decks/visibility';
import { setDefaultCardPreview, showCardPreview } from '../layout/cardPreview';
import { SettingsMenu } from '../layout/SettingsMenu';
import { useCardArts, useCardBackImages, useCardImages, useManaCosts } from '../scryfall/hooks';
import { useAllStorages } from '../storages/api';
import { SharedDeckView } from './SharedDeckPage';

const sortOptions: { value: DeckCardSort; label: string }[] = [
  { value: 'mana_value', label: 'Coût de mana croissant' },
  { value: 'name', label: 'Nom (A → Z)' },
  { value: '-mana_value', label: 'Coût de mana décroissant' },
  { value: '-added', label: 'Ajoutées récemment' },
];

export function DeckPage() {
  const id = useParams().id ?? '';
  return <DeckRoute key={id} id={id} />;
}

function DeckRoute({ id }: { id: string }) {
  const { status } = useSession();
  const [searchParams] = useSearchParams();

  if (status !== 'authenticated' || searchParams.get('vue') === 'visiteur') {
    return <SharedDeckView deckId={id} />;
  }
  return <OwnDeckRoute id={id} />;
}

function OwnDeckRoute({ id }: { id: string }) {
  const deck = useDeck(id);

  if (deck.isLoading) {
    return (
      <Center p="xl">
        <Loader />
      </Center>
    );
  }
  if (!deck.data && deck.error instanceof ApiError && (deck.error.status === 404 || deck.error.status === 400)) {
    return <SharedDeckView deckId={id} />;
  }
  return <DeckView id={id} />;
}

function DeckView({ id }: { id: string }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const deck = useDeck(id);
  const update = useUpdateDeck();
  const remove = useDeleteDeck();
  const [editOpened, setEditOpened] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [tab, setTab] = useState<string | null>('cards');
  const [artPickerOpened, setArtPickerOpened] = useState(false);
  const [exportOpened, setExportOpened] = useState(false);
  const [shareOpened, setShareOpened] = useState(false);
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
        pos="relative"
        style={art ? { ...artBackground(art.url, 'light'), display: 'flex', flexDirection: 'column' } : undefined}
      >
        <Box pos="absolute" top={art ? 'var(--mantine-spacing-lg)' : 0} right={art ? 'var(--mantine-spacing-lg)' : 0}>
          <SettingsMenu label="Actions sur le deck" onImage={art !== null}>
            <Menu.Item onClick={() => setShareOpened(true)}>Partager</Menu.Item>
            <Menu.Item onClick={() => setArtPickerOpened(true)}>Illustration</Menu.Item>
            <Menu.Item onClick={() => setExportOpened(true)}>Exporter</Menu.Item>
            <Menu.Item onClick={() => setEditOpened(true)}>Modifier</Menu.Item>
            <Menu.Divider />
            <Menu.Item color="red" onClick={() => setConfirmingDelete(true)}>
              Supprimer
            </Menu.Item>
          </SettingsMenu>
        </Box>
        <Stack gap={6} pr={48} style={art ? { marginTop: 'auto' } : undefined}>
          <Title order={2} c={art ? 'white' : undefined}>
            {current.name}
          </Title>
          <Group gap="xs">
            <Badge variant={art ? 'white' : 'light'}>{current.format}</Badge>
            <Badge
              variant={art ? 'white' : 'light'}
              color={visibilityOption(current.visibility).color}
              title={visibilityOption(current.visibility).description}
            >
              {visibilityOption(current.visibility).label}
            </Badge>
          </Group>
        </Stack>
        {art && (
          <Text size="xs" c="gray.4" ta="right" mt="xs">
            {artCredit(art.artist)}
          </Text>
        )}
      </Paper>

      <DeckLegalityWarning deck={current} />

      {confirmingDelete && (
        <Alert color="orange" title="Supprimer ce deck ?">
          <Stack gap="sm">
            <Text size="sm">Ses cartes ne sont pas supprimées : elles restent dans ta collection.</Text>
            <Group gap="xs">
              <Button color="red" onClick={deleteDeck} loading={remove.isPending}>
                Confirmer la suppression
              </Button>
              <Button variant="default" onClick={() => setConfirmingDelete(false)}>
                Annuler
              </Button>
            </Group>
          </Stack>
        </Alert>
      )}
      {remove.error && <Alert color="red">{errorMessage(remove.error)}</Alert>}

      <CommanderSection deck={current} />

      <Tabs value={tab} onChange={setTab}>
        <Tabs.List>
          <Tabs.Tab value="cards">Cartes ({current.card_count + (current.pending_count ?? 0)})</Tabs.Tab>
          <Tabs.Tab value="stats">Statistiques</Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="cards" pt="md">
          <DeckCards deck={current} />
        </Tabs.Panel>
        <Tabs.Panel value="stats" pt="md">
          {tab === 'stats' && <DeckStatsPanel deckId={current.id} />}
        </Tabs.Panel>
      </Tabs>

      <ShareDeckModal deck={current} opened={shareOpened} onClose={() => setShareOpened(false)} />
      <ArtPickerModal deck={current} opened={artPickerOpened} onClose={() => setArtPickerOpened(false)} />
      <ExportDeckModal
        deckId={current.id}
        deckName={current.name}
        opened={exportOpened}
        onClose={() => setExportOpened(false)}
      />
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
  const pending = usePendingCards(deck.id);
  const pendingCommander = deck.commander_pending_id
    ? pending.data?.find((item) => item.id === deck.commander_pending_id)
    : undefined;
  const commanderName = commander.data?.name ?? pendingCommander?.name;
  const commanderScryfallId = commander.data?.scryfall_id ?? pendingCommander?.scryfall_id;
  const image = useCardImages(commanderScryfallId ? [commanderScryfallId] : [], 'small');
  const update = useUpdateDeck();

  if (!deck.commander_id && !deck.commander_pending_id) {
    return isCommanderFormat(deck.format) ? (
      <Text size="sm" c="dimmed">
        Pas encore de commandant : ouvre une carte du deck, même entourée en orange, pour la définir comme commandant.
      </Text>
    ) : null;
  }

  function previewCommander() {
    if (commanderScryfallId) {
      showCardPreview(null);
    }
  }

  return (
    <Paper withBorder p="sm" maw={420} onMouseEnter={previewCommander}>
      <Group wrap="nowrap" align="center">
        <Box
          w={72}
          style={{
            flexShrink: 0,
            ...(pendingCommander
              ? {
                  outline: '3px solid var(--mantine-color-orange-6)',
                  outlineOffset: 2,
                  borderRadius: 'var(--mantine-radius-md)',
                }
              : {}),
          }}
        >
          <CardImage
            name={commanderName ?? ''}
            url={commanderScryfallId ? image.data?.[commanderScryfallId] : undefined}
            loading={commander.isLoading || pending.isLoading || image.isLoading}
          />
        </Box>
        <Stack gap={4} style={{ minWidth: 0 }}>
          <Text size="xs" c="dimmed">
            Commandant
          </Text>
          <Text fw={600} lineClamp={1}>
            {commanderName ?? '…'}
          </Text>
          {pendingCommander && (
            <Text size="xs" c="orange">
              Pas encore dans ta collection
            </Text>
          )}
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
  const { pathname } = useLocation();
  const [sort, setSort] = useState<DeckCardSort>('mana_value');
  const [grouping, setGrouping] = useState<DeckCardGrouping | null>('type');
  const { size, setSize, textOnly, gridProps } = useCardSize();
  const cards = useDeckCards(deck.id, sort);
  const deckCards = cards.data ?? [];
  const pending = usePendingCards(deck.id);
  const pendingItems = pending.data ?? [];
  const allCards = sortDeckCards([...deckCards, ...pendingToCards(pendingItems)], sort);
  const showMissingDetails = (grouping === 'type' || grouping === 'color') && hasMissingDetails(deckCards);
  const images = useCardImages(allCards.map((card) => card.scryfall_id));
  const backImages = useCardBackImages(allCards.map((card) => card.scryfall_id));
  const manaCosts = useManaCosts(allCards.map((card) => card.scryfall_id));
  const storages = useAllStorages();
  const storageNames = new Map<number, string>((storages.data ?? []).map((storage) => [storage.id, storage.name]));
  const stacks = stackCards(allCards, deck.commander_id);
  const grouped = useDeckCardGroups(stacks, grouping, storageNames);
  const [addOpened, setAddOpened] = useState(false);
  const [importOpened, setImportOpened] = useState(false);
  const [openedCard, setOpenedCard] = useState<Card | null>(null);
  const [openedPending, setOpenedPending] = useState<Card | null>(null);

  const commanderScryfallId = isCommanderFormat(deck.format) ? deck.commander_scryfall_id : null;
  const commanderName = commanderScryfallId
    ? allCards.find((card) => card.scryfall_id === commanderScryfallId)?.name
    : undefined;
  const commanderImage = commanderScryfallId ? images.data?.[commanderScryfallId] : undefined;
  const commanderCard = allCards.find((card) =>
    deck.commander_id
      ? card.id === deck.commander_id
      : isPendingCard(card) && pendingIdOf(card) === deck.commander_pending_id,
  );
  useEffect(() => {
    setDefaultCardPreview(
      commanderScryfallId
        ? {
            name: commanderName ?? 'Commandant',
            scryfallId: commanderScryfallId,
            imageUrl: commanderImage,
            open: commanderCard
              ? () => (isPendingCard(commanderCard) ? setOpenedPending : setOpenedCard)(commanderCard)
              : undefined,
          }
        : null,
      pathname,
    );
  });
  useEffect(() => () => setDefaultCardPreview(null), []);

  function renderTile(card: Card) {
    const notOwned = isPendingCard(card);
    return (
      <CardTile
        key={card.id}
        card={card}
        imageUrl={images.data?.[card.scryfall_id]}
        backImageUrl={backImages.data?.[card.scryfall_id]}
        imageLoading={images.isLoading}
        textOnly={textOnly}
        manaCost={manaCosts.isLoading ? undefined : (manaCosts.data?.[card.scryfall_id] ?? null)}
        storageName={card.storage_id ? (storageNames.get(card.storage_id) ?? null) : null}
        notOwned={notOwned}
        onOpen={notOwned ? setOpenedPending : setOpenedCard}
      />
    );
  }

  return (
    <Stack>
      <Group justify="space-between" align="flex-end">
        <Text size="sm" c="dimmed">
          {cards.data ? `${allCards.length} carte${allCards.length > 1 ? 's' : ''}` : ' '}
        </Text>
        <CardSizeControl value={size} onChange={setSize} />
      </Group>

      <Group justify="space-between" align="flex-end">
        <Group align="flex-end">
          <Select
            label="Grouper par"
            placeholder="Aucun regroupement"
            data={deckGroupingOptions}
            value={grouping}
            onChange={(value) => setGrouping(parseDeckGrouping(value))}
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
        <Group gap="xs">
          <Button variant="default" onClick={() => setImportOpened(true)}>
            Importer une liste
          </Button>
          <Button onClick={() => setAddOpened(true)}>Ajouter des cartes</Button>
        </Group>
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
        <DeckCardGroups {...grouped} gridProps={gridProps} renderTile={renderTile} />
      ) : (
        <SimpleGrid {...gridProps}>{stacks.map(renderTile)}</SimpleGrid>
      )}

      <ImportListModal deck={deck} opened={importOpened} onClose={() => setImportOpened(false)} />
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
        deckFormat={deck.format}
        commanderPendingId={deck.commander_pending_id}
        deckCardIds={new Set(deckCards.map((card) => card.id))}
        card={openedPending}
        item={openedPending ? pendingItems.find((item) => item.id === pendingIdOf(openedPending)) : undefined}
        imageUrl={openedPending ? images.data?.[openedPending.scryfall_id] : undefined}
        onClose={() => setOpenedPending(null)}
      />
    </Stack>
  );
}
