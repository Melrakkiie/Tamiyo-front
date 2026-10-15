import {
  Alert,
  Anchor,
  Box,
  Button,
  Center,
  Group,
  Loader,
  Menu,
  Paper,
  Select,
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
import type { Card, Deck, DeckBoard, DeckCard, DeckCardSort } from '../api/types';
import { useShowCollectionInDecks } from '../auth/preferences';
import { useSession } from '../auth/useSession';
import { copyIds, useCard } from '../cards/api';
import { CardImage } from '../cards/CardImage';
import {
  cardDisplay,
  CardDisplayControls,
  type DisplaySettings,
  displayFromStored,
  displayToStored,
  placement,
} from '../cards/CardDisplay';
import { CardGrid } from '../cards/CardLayout';
import { useCardContextMenu } from '../cards/CardContextMenu';
import { CardTile } from '../cards/CardTile';
import { PendingBadge, type PendingStatus } from '../cards/PendingBadge';
import { type CardGroup, hasMissingDetails } from '../cards/grouping';
import { MissingDetailsAlert } from '../cards/MissingDetailsAlert';
import { AddCardModal, type CardToAdd } from '../cards/AddCardModal';
import { AddToDeckModal } from '../decks/AddToDeckModal';
import { DropOverlay } from '../scryfall/DropOverlay';
import { useScryfallDrop } from '../scryfall/useScryfallDrop';
import { artBackground, artCredit, deckArtId } from '../decks/art';
import { ArtPickerModal } from '../decks/ArtPickerModal';
import {
  isCommanderFormat,
  useDeck,
  useDeckCards,
  useDeckStats,
  useDeleteDeck,
  usePendingCards,
  useUpdateDeck,
} from '../decks/api';
import { type CollapsibleBoard, COLLAPSIBLE_BOARDS, DEFAULT_COLLAPSED_BOARDS, inBoard } from '../decks/boards';
import { BoardSection } from '../decks/BoardSection';
import { type DeckCardGrouped, DeckCardGroups, type GroupDrop, useDeckCardGroups } from '../decks/DeckCardGroups';
import { DeckDropBar } from '../decks/DeckDropBar';
import { DeckDragProvider, DraggableCard } from '../decks/dragDrop';
import { useDeckCardActions } from '../decks/useDeckCardActions';
import { useDeckCardMenu } from '../decks/useDeckCardMenu';
import { CollectionToggle } from '../decks/CollectionToggle';
import { CompareDeckModal } from '../decks/CompareDeckModal';
import { DeckCardModal } from '../decks/DeckCardModal';
import type { EditionSource } from '../decks/EditionSwitcher';
import { useDeckCopyActions } from '../decks/DeckCopyActions';
import { DeckFormModal } from '../decks/DeckFormModal';
import { DeckTagsModal } from '../decks/DeckTagsModal';
import { DeckLegalityWarning } from '../decks/DeckLegalityWarning';
import { usePriceCurrency } from '../cards/price';
import { BracketSticker } from '../decks/bracket';
import { FormatSticker } from '../decks/FormatSticker';
import { DeckValue } from '../decks/DeckValue';
import { BulkEditModal } from '../decks/BulkEditModal';
import { MoveDeckToFolderModal } from '../decks/FolderModals';
import { useSetFavorite } from '../decks/folders';
import { LikeButton } from '../decks/LikeButton';
import { DeckStatsPanel } from '../decks/DeckStatsPanel';
import { ExportDeckModal } from '../decks/ExportDeckModal';
import { ImportListModal } from '../decks/ImportListModal';
import { PendingCardModal } from '../decks/PendingCardModal';
import {
  isPendingCard,
  pendingIdOf,
  pendingStatus,
  pendingToCards,
  sortDeckCards,
  stackCards,
} from '../decks/pendingCards';
import { PendingCardsSection } from '../decks/PendingCardsSection';
import { ShareDeckModal } from '../decks/ShareDeckModal';
import { type DeckCardGrouping, deckGroupingOptions, parseDeckGrouping } from '../decks/storageGrouping';
import { tagsByName, tagsOf, useDeckTags } from '../decks/tags';
import { useDeckView, useSaveDeckView } from '../decks/view';
import { VisibilitySticker } from '../decks/visibility';
import { setDefaultCardPreview, showCardPreview } from '../layout/cardPreview';
import { SettingsMenu } from '../layout/SettingsMenu';
import { useCardArts, useCardBackImages, useCardImages, useManaCosts } from '../scryfall/hooks';
import { useAllStorages } from '../storages/api';
import { EmptyNote } from '../theme/EmptyNote';
import { usePageTitle } from '../layout/usePageTitle';
import { SharedDeckView } from './SharedDeckPage';

const sortOptions: { value: DeckCardSort; label: string }[] = [
  { value: 'mana_value', label: 'Coût de mana croissant' },
  { value: 'name', label: 'Nom (A → Z)' },
  { value: '-mana_value', label: 'Coût de mana décroissant' },
  { value: '-added', label: 'Ajoutées récemment' },
];

const priceSortOptions: { value: DeckCardSort; label: string }[] = [
  { value: '-price', label: 'Prix décroissant' },
  { value: 'price', label: 'Prix croissant' },
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
  usePageTitle(deck.data?.name ?? 'Deck');
  const update = useUpdateDeck();
  const remove = useDeleteDeck();
  const [editOpened, setEditOpened] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [tab, setTab] = useState<string | null>('cards');
  const [artPickerOpened, setArtPickerOpened] = useState(false);
  const [exportOpened, setExportOpened] = useState(false);
  const [bulkEditOpened, setBulkEditOpened] = useState(false);
  const [shareOpened, setShareOpened] = useState(false);
  const [compareOpened, setCompareOpened] = useState(false);
  const [tagsOpened, setTagsOpened] = useState(false);
  const [folderOpened, setFolderOpened] = useState(false);
  const setFavorite = useSetFavorite();
  const copyActions = useDeckCopyActions(id, true);
  const currency = usePriceCurrency();
  const stats = useDeckStats(id, currency !== null);
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
        mih={art ? { base: 240, sm: 320 } : undefined}
        pos="relative"
        className={art ? 'tamiyo-banner-taped' : undefined}
        style={art ? { ...artBackground(art.url, 'light'), display: 'flex', flexDirection: 'column' } : undefined}
      >
        <Box pos="absolute" top={art ? 'var(--mantine-spacing-lg)' : 0} right={art ? 'var(--mantine-spacing-lg)' : 0}>
          <SettingsMenu label="Actions sur le deck" onImage={art !== null}>
            <Menu.Item onClick={() => setEditOpened(true)}>Modifier</Menu.Item>
            <Menu.Item onClick={() => setArtPickerOpened(true)}>Illustration</Menu.Item>
            <Menu.Item onClick={() => setTagsOpened(true)}>Gérer les tags</Menu.Item>
            <Menu.Divider />
            <Menu.Item onClick={() => setBulkEditOpened(true)}>Édition en masse</Menu.Item>
            <Menu.Item onClick={() => setCompareOpened(true)}>Comparer avec un autre deck</Menu.Item>
            <Menu.Item
              disabled={current.card_count + (current.pending_count ?? 0) === 0}
              onClick={() => navigate(`/decks/${current.id}/playtest`)}
            >
              Tester le deck
            </Menu.Item>
            <Menu.Divider />
            <Menu.Item onClick={() => setFavorite.mutate({ deckId: current.id, favorite: !current.favorite })}>
              {current.favorite ? 'Retirer des favoris' : 'Ajouter aux favoris'}
            </Menu.Item>
            <Menu.Item onClick={() => setFolderOpened(true)}>Ranger dans un dossier</Menu.Item>
            <Menu.Divider />
            <Menu.Item onClick={() => setShareOpened(true)}>Partager</Menu.Item>
            <Menu.Item onClick={() => setExportOpened(true)}>Exporter</Menu.Item>
            <Menu.Divider />
            {copyActions.menuItems}
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
            <FormatSticker format={current.format} size="md" />
            <VisibilitySticker visibility={current.visibility} size="md" />
            {isCommanderFormat(current.format) && <BracketSticker bracket={current.bracket} size="md" />}
            <LikeButton deckId={current.id} canLike={false} onImage={art !== null} />
            {currency && stats.data && (
              <DeckValue value={stats.data.value} currency={currency} onImage={art !== null} />
            )}
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
          <DeckCardsWithView deck={current} />
        </Tabs.Panel>
        <Tabs.Panel value="stats" pt="md">
          {tab === 'stats' && <DeckStatsPanel deckId={current.id} />}
        </Tabs.Panel>
      </Tabs>

      {copyActions.modal}
      <ShareDeckModal deck={current} opened={shareOpened} onClose={() => setShareOpened(false)} />
      <CompareDeckModal
        deckId={current.id}
        deckName={current.name}
        opened={compareOpened}
        onClose={() => setCompareOpened(false)}
      />
      <DeckTagsModal deckId={current.id} opened={tagsOpened} onClose={() => setTagsOpened(false)} />
      <MoveDeckToFolderModal deck={current} opened={folderOpened} onClose={() => setFolderOpened(false)} />
      <ArtPickerModal deck={current} opened={artPickerOpened} onClose={() => setArtPickerOpened(false)} />
      <BulkEditModal
        deckId={current.id}
        deckName={current.name}
        opened={bulkEditOpened}
        onClose={() => setBulkEditOpened(false)}
      />
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
            { id: current.id, changes: { ...values, clear_bracket: values.bracket === undefined } },
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
  const showCollection = useShowCollectionInDecks();
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
        <Box w={72} style={{ flexShrink: 0 }}>
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
          {showCollection && pendingCommander && (
            <Group>
              <PendingBadge status={pendingStatus(pendingCommander)} size="xs" />
            </Group>
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

function DeckCardsWithView({ deck }: { deck: Deck }) {
  const view = useDeckView(deck.id);

  if (view.isLoading) {
    return (
      <Center p="xl">
        <Loader />
      </Center>
    );
  }

  const saved = view.data;
  const initialSort =
    saved && [...sortOptions, ...priceSortOptions].some((option) => option.value === saved.sort)
      ? saved.sort
      : 'mana_value';
  const initialGrouping = saved ? parseDeckGrouping(saved.grouping) : 'type';
  const initialCollapsed = saved?.collapsed_boards ?? DEFAULT_COLLAPSED_BOARDS;
  return (
    <DeckCards
      deck={deck}
      initialSort={initialSort}
      initialGrouping={initialGrouping}
      initialCollapsed={initialCollapsed}
      initialDisplay={displayFromStored(saved)}
    />
  );
}

interface DeckCardsProps {
  deck: Deck;
  initialSort: DeckCardSort;
  initialGrouping: DeckCardGrouping | null;
  initialCollapsed: CollapsibleBoard[];
  initialDisplay: DisplaySettings;
}

interface DeckViewChange {
  grouping?: DeckCardGrouping | null;
  sort?: DeckCardSort;
  collapsed?: CollapsibleBoard[];
  display?: Partial<DisplaySettings>;
}

interface OpenedCard {
  card: Card;
  board: DeckBoard;
  ids: number[];
}

const emptyBoardMessages: Record<CollapsibleBoard, string> = {
  sideboard:
    "Aucune carte dans le sideboard : ouvre une carte du deck pour l'y déplacer, ou choisis cette section en ajoutant des cartes.",
  considering:
    "Aucune carte envisagée pour ce deck : ouvre une carte pour l'y déplacer, ou choisis cette section en ajoutant des cartes.",
};

function DeckCards({ deck, initialSort, initialGrouping, initialCollapsed, initialDisplay }: DeckCardsProps) {
  const { pathname } = useLocation();
  const [sort, setSort] = useState<DeckCardSort>(initialSort);
  const showPrices = usePriceCurrency() !== null;
  const sortChoices = showPrices ? [...sortOptions, ...priceSortOptions] : sortOptions;
  const shownSort = sortChoices.some((option) => option.value === sort) ? sort : 'mana_value';
  const [grouping, setGrouping] = useState<DeckCardGrouping | null>(initialGrouping);
  const [collapsed, setCollapsed] = useState<CollapsibleBoard[]>(initialCollapsed);
  const [displaySettings, setDisplaySettings] = useState<DisplaySettings>(initialDisplay);
  const saveView = useSaveDeckView();

  function changeView(change: DeckViewChange) {
    const next = {
      grouping: change.grouping !== undefined ? change.grouping : grouping,
      sort: change.sort ?? sort,
      collapsed: change.collapsed ?? collapsed,
      display: { ...displaySettings, ...change.display },
    };
    setGrouping(next.grouping);
    setSort(next.sort);
    setCollapsed(next.collapsed);
    setDisplaySettings(next.display);
    saveView.mutate({
      deckId: deck.id,
      view: {
        grouping: next.grouping,
        sort: next.sort,
        collapsed_boards: next.collapsed,
        ...displayToStored(next.display),
      },
    });
  }

  function toggleBoard(board: CollapsibleBoard) {
    const folded = collapsed.includes(board) ? collapsed.filter((other) => other !== board) : [...collapsed, board];
    changeView({ collapsed: COLLAPSIBLE_BOARDS.filter((candidate) => folded.includes(candidate)) });
  }

  const display = cardDisplay(displaySettings, (next) => changeView({ display: next }));
  const { textOnly } = display;
  const showCollection = useShowCollectionInDecks();
  const cards = useDeckCards(deck.id, shownSort);
  const deckCards = cards.data ?? [];
  const pending = usePendingCards(deck.id);
  const pendingItems = pending.data ?? [];
  const allCards = sortDeckCards<DeckCard>([...deckCards, ...pendingToCards(pendingItems)], shownSort);
  const mainCards = inBoard(allCards, 'main');
  const sideboardCards = inBoard(allCards, 'sideboard');
  const consideringCards = inBoard(allCards, 'considering');
  const showMissingDetails = (grouping === 'type' || grouping === 'color') && hasMissingDetails(deckCards);
  const images = useCardImages(allCards.map((card) => card.scryfall_id));
  const backImages = useCardBackImages(allCards.map((card) => card.scryfall_id));
  const manaCosts = useManaCosts(allCards.map((card) => card.scryfall_id));
  const storages = useAllStorages();
  const storageNames = new Map<number, string>((storages.data ?? []).map((storage) => [storage.id, storage.name]));
  const mainStacks = stackCards(mainCards, deck.commander_id, !showCollection);
  const sideboardStacks = stackCards(sideboardCards, deck.commander_id, !showCollection);
  const consideringStacks = stackCards(consideringCards, deck.commander_id, !showCollection);
  const deckTags = useDeckTags(deck.id);
  const cardTags = tagsByName(deckTags.data?.cards ?? []);
  const cardTagsOf = (card: Card) => tagsOf(cardTags, card.name);
  const groupedMain = useDeckCardGroups(mainStacks, grouping, storageNames, cardTagsOf);
  const groupedSideboard = useDeckCardGroups(sideboardStacks, grouping, storageNames, cardTagsOf);
  const groupedConsidering = useDeckCardGroups(consideringStacks, grouping, storageNames, cardTagsOf);
  const actions = useDeckCardActions(deck, cardTagsOf);
  const contextMenu = useCardContextMenu();
  const cardMenu = useDeckCardMenu(deck, pendingItems, actions);
  const [addOpened, setAddOpened] = useState(false);
  const [droppedCard, setDroppedCard] = useState<CardToAdd | null>(null);
  const scryfallDrop = useScryfallDrop((printing) => setDroppedCard({ name: printing.name, printing }));
  const [importOpened, setImportOpened] = useState(false);
  const [opened, setOpened] = useState<OpenedCard | null>(null);
  const [openedPending, setOpenedPending] = useState<Card | null>(null);
  const openedCard = opened ? liveOpenedCard(opened) : null;
  const openedPendingId = openedPending ? pendingIdOf(openedPending) : null;
  const pendingCard = openedPending
    ? ([...mainStacks, ...sideboardStacks, ...consideringStacks].find(
        (stack) => isPendingCard(stack) && pendingIdOf(stack) === openedPendingId,
      ) ?? openedPending)
    : null;

  function liveOpenedCard(current: OpenedCard): OpenedCard {
    const boards: [DeckBoard, Card[]][] = [
      ['main', mainStacks],
      ['sideboard', sideboardStacks],
      ['considering', consideringStacks],
    ];
    for (const [board, stacks] of boards) {
      const card = stacks.find((stack) => copyIds(stack).includes(current.ids[0]));
      if (card) {
        return { card, board, ids: current.ids };
      }
    }
    return current;
  }

  function openCard(card: Card, board: DeckBoard) {
    setOpenedPending(null);
    setOpened({ card, board, ids: copyIds(card) });
  }

  function openPending(card: Card) {
    setOpened(null);
    setOpenedPending(card);
  }

  function showSwapped(next: EditionSource) {
    if (next.kind === 'card') {
      openCard(next.card, next.board);
    } else {
      openPending(pendingToCards([next.item])[0]);
    }
  }

  const commanderScryfallId = isCommanderFormat(deck.format) ? deck.commander_scryfall_id : null;
  const commanderName = commanderScryfallId
    ? mainCards.find((card) => card.scryfall_id === commanderScryfallId)?.name
    : undefined;
  const commanderImage = commanderScryfallId ? images.data?.[commanderScryfallId] : undefined;
  const commanderCard = mainCards.find((card) =>
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
            foil: commanderCard?.foil,
            imageUrl: commanderImage,
            open: commanderCard
              ? () => (isPendingCard(commanderCard) ? openPending(commanderCard) : openCard(commanderCard, 'main'))
              : undefined,
          }
        : null,
      pathname,
    );
  });
  useEffect(() => () => setDefaultCardPreview(null), []);

  const pendingStatuses = new Map<number, PendingStatus>(pendingItems.map((item) => [item.id, pendingStatus(item)]));

  const renderTile = (board: DeckBoard) => (card: Card, group?: CardGroup) => {
    const notOwned = isPendingCard(card);
    const item = { card, board, tag: group?.tag ?? null, imageUrl: images.data?.[card.scryfall_id] };
    return (
      <DraggableCard key={card.id} item={item}>
        <CardTile
          card={card}
          imageUrl={images.data?.[card.scryfall_id]}
          backImageUrl={backImages.data?.[card.scryfall_id]}
          imageLoading={images.isLoading}
          textOnly={textOnly}
          commander={
            board === 'main' &&
            (notOwned ? pendingIdOf(card) === deck.commander_pending_id : card.id === deck.commander_id)
          }
          manaCost={
            !display.showManaCost || manaCosts.isLoading ? undefined : (manaCosts.data?.[card.scryfall_id] ?? null)
          }
          storageName={
            showCollection ? (card.storage_id ? (storageNames.get(card.storage_id) ?? null) : null) : undefined
          }
          pendingStatus={
            showCollection && notOwned ? (pendingStatuses.get(pendingIdOf(card)) ?? { kind: 'missing' }) : undefined
          }
          compact={display.compact}
          stacked={display.stacked}
          overlapped={display.overlapped}
          hideDetails={!display.showDetails}
          onOpen={notOwned ? openPending : (clicked) => openCard(clicked, board)}
          onContextMenu={(event, clicked) =>
            contextMenu.open(event, cardMenu.menuFor(clicked, board, images.data?.[clicked.scryfall_id]))
          }
        />
      </DraggableCard>
    );
  };

  function tagDrop(board: DeckBoard): GroupDrop | undefined {
    if (grouping !== 'tag') {
      return undefined;
    }
    const changesTags = (group: CardGroup, card: Card) => {
      const tags = cardTagsOf(card);
      return group.tag === null ? tags.length > 0 : group.tag !== undefined && !tags.includes(group.tag);
    };
    return {
      id: (group) =>
        group.tag === undefined
          ? null
          : group.tag === null
            ? `group:${board}:untagged`
            : `group:${board}:tag:${group.tag}`,
      accepts: (group, item) => changesTags(group, item.card) || actions.canMoveTo(item, board),
      onDrop: (group, item) => {
        if (changesTags(group, item.card)) {
          if (group.tag === null) {
            actions.removeAllTags(item);
          } else if (group.tag !== undefined) {
            actions.addTag(item, group.tag);
          }
        }
        if (actions.canMoveTo(item, board)) {
          actions.moveToBoard(item, board);
        }
      },
    };
  }

  function renderBoard(board: DeckBoard, stacks: Card[], grouped: DeckCardGrouped) {
    const tile = renderTile(board);
    return grouping ? (
      <DeckCardGroups {...grouped} display={display} renderTile={tile} drop={tagDrop(board)} />
    ) : (
      <CardGrid display={display} cards={stacks} renderTile={(card) => tile(card)} />
    );
  }

  return (
    <DeckDragProvider>
      <Stack>
        <DeckDropBar
          actions={actions}
          tagMode={grouping === 'tag'}
          tagsOf={cardTagsOf}
          deckTags={deckTags.data?.tags ?? []}
        />
        <Group align="flex-start" wrap="wrap-reverse">
          <Group gap="lg" align="stretch">
            <CardDisplayControls
              display={display}
              options={(inside) => (
                <>
                  <Select
                    label="Grouper par"
                    placeholder="Aucun regroupement"
                    data={deckGroupingOptions}
                    value={grouping}
                    onChange={(value) => changeView({ grouping: parseDeckGrouping(value) })}
                    clearable
                    {...placement(inside, 200)}
                  />
                  <Select
                    label={grouping ? 'Tri dans chaque groupe' : 'Tri'}
                    data={sortChoices}
                    value={shownSort}
                    onChange={(value) => value && changeView({ sort: value as DeckCardSort })}
                    allowDeselect={false}
                    {...placement(inside, 240)}
                  />
                </>
              )}
            />
            <CollectionToggle description="Les cartes en attente et le rangement de chaque exemplaire" />
          </Group>
          <Group gap="xs" ml="auto">
            <Button variant="default" onClick={() => setImportOpened(true)}>
              Importer une liste
            </Button>
            <Button onClick={() => setAddOpened(true)}>Ajouter des cartes</Button>
          </Group>
        </Group>

        {cards.error && <Alert color="red">{errorMessage(cards.error)}</Alert>}

        {showCollection && <PendingCardsSection deckId={deck.id} pending={pendingItems} />}

        {showMissingDetails && <MissingDetailsAlert />}

        {cards.isLoading ? (
          <Center p="xl">
            <Loader />
          </Center>
        ) : (
          <>
            {allCards.length === 0 ? (
              <EmptyNote
                title="Ce deck est vide"
                note="ajoute des cartes de ta collection, juste là-haut"
                arrow="up-right"
              />
            ) : mainCards.length === 0 ? (
              <Text size="sm" c="dimmed">
                Aucune carte dans le deck principal.
              </Text>
            ) : (
              renderBoard('main', mainStacks, groupedMain)
            )}
            <BoardSection
              board="sideboard"
              count={sideboardCards.length}
              collapsed={collapsed.includes('sideboard')}
              onToggle={() => toggleBoard('sideboard')}
              emptyMessage={emptyBoardMessages.sideboard}
            >
              {renderBoard('sideboard', sideboardStacks, groupedSideboard)}
            </BoardSection>
            <BoardSection
              board="considering"
              count={consideringCards.length}
              collapsed={collapsed.includes('considering')}
              onToggle={() => toggleBoard('considering')}
              emptyMessage={emptyBoardMessages.considering}
            >
              {renderBoard('considering', consideringStacks, groupedConsidering)}
            </BoardSection>
          </>
        )}

        {contextMenu.element}
        {cardMenu.modals}
        <ImportListModal deck={deck} opened={importOpened} onClose={() => setImportOpened(false)} />
        <DropOverlay
          dragging={scryfallDrop.dragging}
          resolving={scryfallDrop.resolving}
          hint="Elle sera proposée à l'ajout dans ce deck, dans cette édition."
        />
        <AddCardModal
          card={droppedCard}
          onClose={() => setDroppedCard(null)}
          defaultStorageId={undefined}
          target={{ kind: 'deck', deckId: deck.id, deckName: deck.name }}
        />
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
          card={openedCard?.card ?? null}
          board={openedCard?.board ?? 'main'}
          imageUrl={openedCard ? images.data?.[openedCard.card.scryfall_id] : undefined}
          onClose={() => setOpened(null)}
          onSwapped={showSwapped}
        />
        <PendingCardModal
          deckId={deck.id}
          deckFormat={deck.format}
          commanderPendingId={deck.commander_pending_id}
          deckCardIds={new Set(deckCards.map((card) => card.id))}
          card={pendingCard}
          item={pendingItems.find((item) => item.id === openedPendingId)}
          imageUrl={pendingCard ? images.data?.[pendingCard.scryfall_id] : undefined}
          onClose={() => setOpenedPending(null)}
          onSwapped={showSwapped}
        />
      </Stack>
    </DeckDragProvider>
  );
}
