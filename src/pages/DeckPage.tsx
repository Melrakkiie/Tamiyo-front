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
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useQueryClient } from '@tanstack/react-query';
import { type RefObject, useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate, useParams, useSearchParams } from 'react-router';

import { ApiError, errorMessage } from '../api/errors';
import type { Deck, DeckBoard, DeckCardSort } from '../api/types';
import { useShowCollectionInDecks } from '../auth/preferences';
import { useSession } from '../auth/useSession';
import { useCard } from '../cards/api';
import { CardImage } from '../cards/CardImage';
import {
  cardDisplay,
  CardDisplayControls,
  type DisplaySettings,
  displayFromStored,
  displayToStored,
} from '../cards/CardDisplay';
import { useCardContextMenu } from '../cards/CardContextMenu';
import { useCardVisuals } from '../cards/useCardVisuals';
import { PendingBadge } from '../cards/PendingBadge';
import { type CardGroup, hasMissingDetails } from '../cards/grouping';
import { MissingDetailsAlert } from '../cards/MissingDetailsAlert';
import { AddCardModal, type CardToAdd } from '../cards/AddCardModal';
import { AddToDeckModal } from '../decks/AddToDeckModal';
import { DropOverlay } from '../scryfall/DropOverlay';
import { useScryfallDrop } from '../scryfall/useScryfallDrop';
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
import { clearSlotChanges, type CommanderSlot, commanderTargets, hasCommander, hasPartner } from '../decks/commanders';
import { type DeckEntry, deckEntries, type Taggable } from '../decks/deckEntries';
import { type CollapsibleBoard, COLLAPSIBLE_BOARDS, DEFAULT_COLLAPSED_BOARDS } from '../decks/boards';
import { DeckBoards, type TileContext, type TileExtras, useDeckBoards } from '../decks/DeckBoards';
import type { GroupDrop } from '../decks/DeckCardGroups';
import { DeckDropBar } from '../decks/DeckDropBar';
import { DeckDragProvider, DraggableCard } from '../decks/dragDrop';
import { heldSlot } from '../decks/entryMutations/slots';
import { useDeckCardActions } from '../decks/useDeckCardActions';
import { useDeckCardMenu } from '../decks/useDeckCardMenu';
import { useOpenedEntry } from '../decks/useOpenedEntry';
import { CollectionToggle } from '../decks/CollectionToggle';
import { CompareDeckModal } from '../decks/CompareDeckModal';
import { DeckEntryModal } from '../decks/DeckEntryModal';
import { useDeckCopyActions } from '../decks/DeckCopyActions';
import { DeckFormModal } from '../decks/DeckFormModal';
import { DeckTagsModal } from '../decks/DeckTagsModal';
import { DeckLegalityWarning } from '../decks/DeckLegalityWarning';
import { usePriceCurrency } from '../cards/price';
import { DeckValue } from '../decks/DeckValue';
import { BulkEditModal } from '../decks/BulkEditModal';
import { MoveDeckToFolderModal } from '../decks/FolderModals';
import { useSetFavorite } from '../decks/folders';
import { DeckBanner } from '../decks/DeckBanner';
import { LikeButton } from '../decks/LikeButton';
import { DeckStatsPanel } from '../decks/DeckStatsPanel';
import { ExportDeckModal } from '../decks/ExportDeckModal';
import { ImportListModal } from '../decks/ImportListModal';
import { pendingStatus } from '../decks/pendingCards';
import { PendingCardsSection } from '../decks/PendingCardsSection';
import { ShareDeckModal } from '../decks/ShareDeckModal';
import { type DeckCardGrouping, deckGroupingOptions, parseDeckGrouping } from '../decks/storageGrouping';
import { tagsByName, tagsOf, useDeckTags } from '../decks/tags';
import { useDeckView, useSaveDeckView } from '../decks/view';
import { setDefaultCardPreview, showCardPreview } from '../layout/cardPreview';
import { SettingsMenu } from '../layout/SettingsMenu';
import { useCardImages } from '../scryfall/hooks';
import { useStorageDirectory } from '../storages/useStorageDirectory';
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

const collectionToggleDescription = 'Les cartes en attente et le rangement de chaque exemplaire';

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
  const openPartner = useRef<(() => void) | null>(null);
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
  const copyActions = useDeckCopyActions(
    { id, name: deck.data?.name ?? '', folderId: deck.data?.folder_id ?? null },
    true,
  );
  const currency = usePriceCurrency();
  const stats = useDeckStats(id, currency !== null);

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

      <DeckBanner
        deck={current}
        menu={(onImage) => (
          <SettingsMenu label="Actions sur le deck" onImage={onImage}>
            <Menu.Item onClick={() => setEditOpened(true)}>Modifier</Menu.Item>
            <Menu.Item onClick={() => setArtPickerOpened(true)}>Illustration</Menu.Item>
            <Menu.Item onClick={() => setTagsOpened(true)}>Gérer les tags</Menu.Item>
            <Menu.Divider />
            <Menu.Item onClick={() => setBulkEditOpened(true)}>Édition en masse</Menu.Item>
            <Menu.Item onClick={() => setCompareOpened(true)}>Comparer avec un autre deck</Menu.Item>
            <Menu.Item disabled={current.card_count === 0} onClick={() => navigate(`/decks/${current.id}/playtest`)}>
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
        )}
        like={(onImage) => <LikeButton deckId={current.id} canLike={false} onImage={onImage} />}
        value={(onImage) =>
          currency &&
          stats.data && (
            <DeckValue
              value={stats.data.value}
              currency={currency}
              onImage={onImage}
              breakdown={{ owned: stats.data.owned_value, pending: stats.data.pending_value }}
            />
          )
        }
      />

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

      <CommanderSection deck={current} openPartner={openPartner} />

      <Tabs value={tab} onChange={setTab}>
        <Tabs.List>
          <Tabs.Tab value="cards">Cartes ({current.card_count})</Tabs.Tab>
          <Tabs.Tab value="stats">Statistiques</Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="cards" pt="md">
          <DeckCardsWithView deck={current} openPartner={openPartner} />
        </Tabs.Panel>
        <Tabs.Panel value="stats" pt="md">
          {tab === 'stats' && <DeckStatsPanel deck={current} />}
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

type PartnerOpener = RefObject<(() => void) | null>;

function CommanderSection({ deck, openPartner }: { deck: Deck; openPartner: PartnerOpener }) {
  if (!hasCommander(deck)) {
    return isCommanderFormat(deck.format) ? (
      <Text size="sm" c="dimmed">
        Pas encore de commandant : ouvre une carte du deck, même entourée en orange, pour la définir comme commandant.
      </Text>
    ) : null;
  }

  return (
    <Group align="stretch" gap="sm">
      <CommanderPanel deck={deck} slot="commander" cardId={deck.commander_id} pendingId={deck.commander_pending_id} />
      {hasPartner(deck) && (
        <CommanderPanel
          deck={deck}
          slot="partner"
          cardId={deck.partner_id}
          pendingId={deck.partner_pending_id}
          openPartner={openPartner}
        />
      )}
    </Group>
  );
}

interface CommanderPanelProps {
  deck: Deck;
  slot: CommanderSlot;
  cardId: number | null | undefined;
  pendingId: number | null | undefined;
  openPartner?: PartnerOpener;
}

function CommanderPanel({ deck, slot, cardId, pendingId, openPartner }: CommanderPanelProps) {
  const showCollection = useShowCollectionInDecks();
  const commander = useCard(cardId);
  const pending = usePendingCards(deck.id);
  const pendingCommander = pendingId ? pending.data?.find((item) => item.id === pendingId) : undefined;
  const commanderName = commander.data?.name ?? pendingCommander?.name;
  const commanderScryfallId = commander.data?.scryfall_id ?? pendingCommander?.scryfall_id;
  const image = useCardImages(commanderScryfallId ? [commanderScryfallId] : [], 'small');
  const update = useUpdateDeck();

  function previewCommander() {
    if (slot === 'commander') {
      showCardPreview(null);
    } else if (commanderScryfallId) {
      showCardPreview({
        name: commanderName ?? 'Second commandant',
        scryfallId: commanderScryfallId,
        foil: commander.data?.foil,
        imageUrl: undefined,
        open: openPartner?.current ?? undefined,
      });
    }
  }

  return (
    <Paper withBorder p="sm" maw={420} onMouseEnter={previewCommander}>
      <Group wrap="nowrap" align="center">
        <Box w={72} style={{ flexShrink: 0 }}>
          <CardImage
            name={commanderName ?? ''}
            frontUrl={commanderScryfallId ? image.data?.[commanderScryfallId] : undefined}
            loading={commander.isLoading || pending.isLoading || image.isLoading}
          />
        </Box>
        <Stack gap={4} style={{ minWidth: 0 }}>
          <Text size="xs" c="dimmed">
            {slot === 'commander' ? 'Commandant' : 'Second commandant'}
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
            onClick={() => update.mutate({ id: deck.id, changes: clearSlotChanges(slot) })}
          >
            {slot === 'commander' ? 'Retirer le commandant' : 'Retirer le second commandant'}
          </Anchor>
        </Stack>
      </Group>
    </Paper>
  );
}

function DeckCardsWithView({ deck, openPartner }: { deck: Deck; openPartner: PartnerOpener }) {
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
      openPartner={openPartner}
    />
  );
}

interface DeckCardsProps {
  deck: Deck;
  initialSort: DeckCardSort;
  initialGrouping: DeckCardGrouping | null;
  initialCollapsed: CollapsibleBoard[];
  initialDisplay: DisplaySettings;
  openPartner: PartnerOpener;
}

interface DeckViewChange {
  grouping?: DeckCardGrouping | null;
  sort?: DeckCardSort;
  collapsed?: CollapsibleBoard[];
  display?: Partial<DisplaySettings>;
}

const emptyBoardMessages: Record<CollapsibleBoard, string> = {
  sideboard:
    "Aucune carte dans le sideboard : ouvre une carte du deck pour l'y déplacer, ou choisis cette section en ajoutant des cartes.",
  considering:
    "Aucune carte envisagée pour ce deck : ouvre une carte pour l'y déplacer, ou choisis cette section en ajoutant des cartes.",
};

function DeckCards({
  deck,
  initialSort,
  initialGrouping,
  initialCollapsed,
  initialDisplay,
  openPartner,
}: DeckCardsProps) {
  const { pathname } = useLocation();
  const [sort, setSort] = useState<DeckCardSort>(initialSort);
  const currency = usePriceCurrency();
  const showPrices = currency !== null;
  const stats = useDeckStats(deck.id, showPrices);
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
    const toggled = collapsed.includes(board) ? collapsed.filter((other) => other !== board) : [...collapsed, board];
    changeView({ collapsed: COLLAPSIBLE_BOARDS.filter((candidate) => toggled.includes(candidate)) });
  }

  const display = cardDisplay(displaySettings, (next) => changeView({ display: next }));
  const showCollection = useShowCollectionInDecks();
  const cards = useDeckCards(deck.id, shownSort);
  const deckCards = cards.data ?? [];
  const pending = usePendingCards(deck.id);
  const pendingItems = pending.data ?? [];
  const entries = deckEntries(deckCards, pendingItems);
  const showMissingDetails = (grouping === 'type' || grouping === 'color') && hasMissingDetails(deckCards);
  const visuals = useCardVisuals(entries, display);
  const storages = useStorageDirectory();
  const deckTags = useDeckTags(deck.id);
  const cardTags = tagsByName(deckTags.data?.cards ?? []);
  const cardTagsOf = (entry: Taggable) => tagsOf(cardTags, entry.name);
  const boards = useDeckBoards({
    entries,
    sort: shownSort,
    grouping,
    commanders: commanderTargets(deck),
    separateByStorage: showCollection,
    storageNames: storages.names,
    tagsOf: cardTagsOf,
  });
  const actions = useDeckCardActions(deck, cardTagsOf);
  const contextMenu = useCardContextMenu();
  const cardMenu = useDeckCardMenu(deck, actions);
  const [addOpened, setAddOpened] = useState(false);
  const [droppedCard, setDroppedCard] = useState<CardToAdd | null>(null);
  const scryfallDrop = useScryfallDrop((printing) => setDroppedCard({ name: printing.name, printing }));
  const [importOpened, setImportOpened] = useState(false);
  const opened = useOpenedEntry(boards, {
    refreshing: cards.isFetching || pending.isFetching,
    imageUrl: visuals.imageUrl,
    imagesFetching: visuals.imagesFetching,
  });

  const commanderScryfallId = isCommanderFormat(deck.format) ? deck.commander_scryfall_id : null;
  const commanderCard = boards.main.stacks.find((entry) => boards.main.commanders.has(entry.key));
  const commanderName = commanderScryfallId
    ? boards.main.stacks.find((card) => card.scryfall_id === commanderScryfallId)?.name
    : undefined;
  const commanderImage = commanderScryfallId ? visuals.imageUrl({ scryfall_id: commanderScryfallId }) : undefined;
  useEffect(() => {
    setDefaultCardPreview(
      commanderScryfallId
        ? {
            name: commanderName ?? 'Commandant',
            scryfallId: commanderScryfallId,
            foil: commanderCard?.foil,
            imageUrl: commanderImage,
            open: commanderCard ? () => opened.open(commanderCard) : undefined,
          }
        : null,
      pathname,
    );
  });
  useEffect(() => () => setDefaultCardPreview(null), []);
  const partnerCard = boards.main.stacks.find(
    (entry) => boards.main.commanders.has(entry.key) && heldSlot(deck, entry)?.slot === 'partner',
  );
  useEffect(() => {
    openPartner.current = partnerCard ? () => opened.open(partnerCard) : null;
  });
  useEffect(
    () => () => {
      openPartner.current = null;
    },
    [openPartner],
  );

  function tileExtras(entry: DeckEntry, { board, group, imageUrl }: TileContext): TileExtras {
    return {
      props: {
        storageName: showCollection
          ? entry.kind === 'owned'
            ? storages.nameOf(entry.storage_id)
            : ({ kind: 'none' } as const)
          : undefined,
        pendingStatus: showCollection && entry.kind === 'pending' ? pendingStatus(entry.pending) : undefined,
        onContextMenu: (event, clicked, shown) => contextMenu.open(event, cardMenu.menuFor(clicked, board, shown)),
      },
      wrap: (tile) => <DraggableCard item={{ entry, board, tag: group?.tag ?? null, imageUrl }}>{tile}</DraggableCard>,
    };
  }

  function tagDrop(board: DeckBoard): GroupDrop | undefined {
    if (grouping !== 'tag') {
      return undefined;
    }
    const changesTags = (group: CardGroup<DeckEntry>, card: DeckEntry) => {
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
      accepts: (group, item) => changesTags(group, item.entry) || actions.canMoveTo(item, board),
      onDrop: (group, item) => {
        if (changesTags(group, item.entry)) {
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
          <Group justify="flex-end" align="stretch" gap="md" miw={0} style={{ flexGrow: 1 }}>
            <Select
              label="Grouper par"
              placeholder="Aucun regroupement"
              data={deckGroupingOptions}
              value={grouping}
              onChange={(value) => changeView({ grouping: parseDeckGrouping(value) })}
              clearable
              w={200}
            />
            {/* On a phone, beside "Grouper par" rather than on a line of its own. */}
            <CollectionToggle hiddenFrom="sm" description={collectionToggleDescription} />
            <CardDisplayControls
              display={display}
              wrap="nowrap"
              options={
                <Select
                  label={grouping ? 'Tri dans chaque groupe' : 'Tri'}
                  data={sortChoices}
                  value={shownSort}
                  onChange={(value) => value && changeView({ sort: value as DeckCardSort })}
                  allowDeselect={false}
                  w={240}
                  miw={0}
                />
              }
            />
            <CollectionToggle visibleFrom="sm" description={collectionToggleDescription} />
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
          <DeckBoards
            boards={boards}
            display={display}
            collapsed={collapsed}
            onToggleBoard={toggleBoard}
            boardValues={stats.data?.board_values}
            emptyDeck={
              <EmptyNote
                title="Ce deck est vide"
                note="ajoute des cartes de ta collection, juste là-haut"
                arrow="up-right"
              />
            }
            emptyBoardMessages={emptyBoardMessages}
            extras={{ tile: tileExtras, groupDrop: tagDrop }}
            showGameChangers={isCommanderFormat(deck.format)}
            onOpen={opened.open}
          />
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
        <DeckEntryModal
          deck={deck}
          deckCardIds={new Set(deckCards.map((card) => card.id))}
          entry={opened.entry}
          imageUrl={opened.imageUrl}
          loading={opened.loading}
          onClose={opened.close}
          onSwapped={opened.showSwapped}
        />
      </Stack>
    </DeckDragProvider>
  );
}
