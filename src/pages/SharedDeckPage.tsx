import { Alert, Anchor, Box, Center, Group, Loader, Menu, Paper, Select, Stack, Tabs, Text } from '@mantine/core';
import { type ReactNode, useEffect, useState } from 'react';
import { Link, Navigate, useLocation, useNavigate, useParams } from 'react-router';

import { ApiError, errorMessage } from '../api/errors';
import type { Card, SharedDeck } from '../api/types';
import { useAccount } from '../auth/account';
import { ProfileAvatar } from '../auth/UserAvatar';
import { useShowCollectionInDecks } from '../auth/preferences';
import { useSession } from '../auth/useSession';
import { useCardContextMenu } from '../cards/CardContextMenu';
import { CardImage } from '../cards/CardImage';
import { CardDisplayControls, useCardDisplay } from '../cards/CardDisplay';
import { useCardVisuals } from '../cards/useCardVisuals';
import { type CollapsibleBoard, DEFAULT_COLLAPSED_BOARDS } from '../decks/boards';
import { DeckBoards, type DeckBoardsExtras, useDeckBoards } from '../decks/DeckBoards';
import { type OwnedEntry, ownedEntry } from '../decks/deckEntries';
import { LegalityWarning } from '../decks/DeckLegalityWarning';
import { useAllDecks } from '../decks/api';
import { usePriceCurrency } from '../cards/price';
import { DeckValue } from '../decks/DeckValue';
import { DeckBanner } from '../decks/DeckBanner';
import { LikeButton, LikeCount } from '../decks/LikeButton';
import { CollectionToggle } from '../decks/CollectionToggle';
import { CompareDeckModal } from '../decks/CompareDeckModal';
import { useDeckCopyActions } from '../decks/DeckCopyActions';
import { comboDeckList, commanderSpellbookUrl } from '../decks/combos';
import { DeckStatsView } from '../decks/DeckStatsPanel';
import { ExportDeckModal } from '../decks/ExportDeckModal';
import {
  type SharedDeckSort,
  sharedCardsToCards,
  sharedDeckSortOptions,
  useDeckOwnership,
  useSharedDeck,
  useSharedDeckCombos,
  useSharedDeckLegality,
  useSharedDeckStats,
} from '../decks/shared';
import { SharedCardModal } from '../decks/SharedCardModal';
import { useSharedCardMenu } from '../decks/useSharedCardMenu';
import { parseSharedGrouping, type SharedCardGrouping, sharedGroupingOptions } from '../decks/storageGrouping';
import { cardNameKey, tagsByName, tagsOf } from '../decks/tags';
import { setDefaultCardPreview, showCardPreview } from '../layout/cardPreview';
import { SettingsMenu } from '../layout/SettingsMenu';
import { EmptyNote } from '../theme/EmptyNote';
import { usePageTitle } from '../layout/usePageTitle';

export function SharedDeckRedirect() {
  const { id = '' } = useParams();
  return <Navigate to={`/decks/${id}`} replace />;
}

export function SharedDeckView({ deckId }: { deckId: string }) {
  const shared = useSharedDeck(deckId);
  usePageTitle(shared.data?.deck.name ?? 'Deck');
  const legality = useSharedDeckLegality(deckId);
  const [tab, setTab] = useState<string | null>('cards');
  const currency = usePriceCurrency();
  const stats = useSharedDeckStats(deckId, tab === 'stats' || currency !== null);
  const combos = useSharedDeckCombos(deckId, tab === 'stats' && (stats.data?.card_count ?? 0) > 0);
  const { status } = useSession();
  const signedIn = status === 'authenticated';

  if (shared.isLoading) {
    return (
      <Center p="xl">
        <Loader />
      </Center>
    );
  }

  if (!shared.data) {
    const notFound = shared.error instanceof ApiError && shared.error.status === 404;
    return (
      <Stack align="flex-start">
        <Alert color="orange">
          {!notFound
            ? errorMessage(shared.error)
            : signedIn
              ? "Ce deck n'existe pas, ou son propriétaire ne le partage pas."
              : "Ce deck n'existe pas, ou son propriétaire ne le partage pas. S'il est à toi, connecte-toi pour le voir."}
        </Alert>
        {signedIn && (
          <Anchor component={Link} to="/decks">
            Retour à mes decks
          </Anchor>
        )}
      </Stack>
    );
  }

  const { deck, owner } = shared.data;
  const ownerName = owner.display_name || 'Sans pseudo';

  return (
    <Stack>
      <DeckBanner
        deck={deck}
        menu={(onImage) =>
          signedIn ? (
            <SignedInDeckMenu
              deckId={deck.id}
              deckName={deck.name}
              cardCount={deck.card_count}
              ownerId={owner.id}
              onImage={onImage}
            />
          ) : (
            <SharedDeckMenu deckId={deck.id} deckName={deck.name} cardCount={deck.card_count} onImage={onImage} />
          )
        }
        like={(onImage) =>
          signedIn ? (
            <SharedDeckLike deckId={deck.id} ownerId={owner.id} onImage={onImage} />
          ) : (
            <LikeCount count={deck.likes_count} onImage={onImage} />
          )
        }
        value={(onImage) =>
          currency && stats.data && <DeckValue value={stats.data.value} currency={currency} onImage={onImage} />
        }
        byline={(onImage) => (
          <Group gap="xs" wrap="nowrap">
            <ProfileAvatar scryfallId={owner.avatar_scryfall_id} name={ownerName} size={28} />
            <Text size="sm" c={onImage ? 'gray.3' : 'dimmed'}>
              par{' '}
              {signedIn ? (
                <Anchor component={Link} to={`/users/${owner.id}`} size="sm" c={onImage ? 'white' : undefined} fw={500}>
                  {ownerName}
                </Anchor>
              ) : (
                <Text span inherit fw={500} c={onImage ? 'white' : undefined}>
                  {ownerName}
                </Text>
              )}
            </Text>
          </Group>
        )}
      />

      {signedIn && <OwnDeckNotice ownerId={owner.id} deckId={deck.id} />}

      <LegalityWarning legality={legality} />

      <Tabs value={tab} onChange={setTab}>
        <Tabs.List>
          <Tabs.Tab value="cards">Cartes ({deck.card_count})</Tabs.Tab>
          <Tabs.Tab value="stats">Statistiques</Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="cards" pt="md">
          <SharedDeckCards shared={shared.data} signedIn={signedIn} />
        </Tabs.Panel>
        <Tabs.Panel value="stats" pt="md">
          {tab === 'stats' && (
            <DeckStatsView
              stats={stats}
              combos={{ query: combos, creditUrl: commanderSpellbookUrl(comboDeckList(shared.data.cards)) }}
              emptyMessage="Ce deck est vide."
            />
          )}
        </Tabs.Panel>
      </Tabs>
    </Stack>
  );
}

interface SharedDeckMenuProps {
  deckId: string;
  deckName: string;
  cardCount: number;
  onImage: boolean;
  extraItems?: ReactNode;
  extraModals?: ReactNode;
}

function SharedDeckMenu({ deckId, deckName, cardCount, onImage, extraItems, extraModals }: SharedDeckMenuProps) {
  const navigate = useNavigate();
  const [exportOpened, setExportOpened] = useState(false);
  const [compareOpened, setCompareOpened] = useState(false);

  return (
    <>
      <SettingsMenu label="Actions sur le deck" onImage={onImage}>
        <Menu.Item onClick={() => setCompareOpened(true)}>Comparer avec un autre deck</Menu.Item>
        <Menu.Item disabled={cardCount === 0} onClick={() => navigate(`/decks/${deckId}/playtest`)}>
          Tester le deck
        </Menu.Item>
        <Menu.Divider />
        <Menu.Item onClick={() => setExportOpened(true)}>Exporter</Menu.Item>
        {extraItems}
      </SettingsMenu>
      <ExportDeckModal
        deckId={deckId}
        deckName={deckName}
        opened={exportOpened}
        onClose={() => setExportOpened(false)}
        shared
      />
      <CompareDeckModal
        deckId={deckId}
        deckName={deckName}
        opened={compareOpened}
        onClose={() => setCompareOpened(false)}
      />
      {extraModals}
    </>
  );
}

function SignedInDeckMenu({ ownerId, ...props }: SharedDeckMenuProps & { ownerId: string }) {
  const account = useAccount();
  const mine = account.data?.id === ownerId;
  const ownDeck = useAllDecks(mine).data?.find((deck) => deck.id === props.deckId);
  const copyActions = useDeckCopyActions(
    { id: props.deckId, name: props.deckName, folderId: ownDeck?.folder_id ?? null },
    mine,
  );

  return (
    <SharedDeckMenu
      {...props}
      extraItems={
        <>
          <Menu.Divider />
          {copyActions.menuItems}
        </>
      }
      extraModals={copyActions.modal}
    />
  );
}

function SharedDeckLike({ deckId, ownerId, onImage }: { deckId: string; ownerId: string; onImage: boolean }) {
  const account = useAccount();
  if (!account.data) {
    return null;
  }
  return <LikeButton deckId={deckId} canLike={account.data.id !== ownerId} onImage={onImage} />;
}

function OwnDeckNotice({ ownerId, deckId }: { ownerId: string; deckId: string }) {
  const account = useAccount();

  if (account.data?.id !== ownerId) {
    return null;
  }
  return (
    <Alert color="blue" variant="light">
      Tu vois ton deck comme les personnes qui ont son lien.{' '}
      <Anchor component={Link} to={`/decks/${deckId}`} size="sm">
        Revenir à l'édition
      </Anchor>
    </Alert>
  );
}

interface CommanderCardProps {
  card: Card;
  label: string;
  imageUrl: string | undefined;
  onOpen: () => void;
}

function CommanderCard({ card, label, imageUrl, onOpen }: CommanderCardProps) {
  return (
    <Paper
      withBorder
      p="sm"
      maw={420}
      onMouseEnter={() =>
        showCardPreview({ name: card.name, scryfallId: card.scryfall_id, foil: card.foil, imageUrl, open: onOpen })
      }
    >
      <Group wrap="nowrap" align="center">
        <Box w={72} style={{ flexShrink: 0, cursor: 'pointer' }} onClick={onOpen}>
          <CardImage name={card.name} url={imageUrl} loading={!imageUrl} />
        </Box>
        <Stack gap={4} style={{ minWidth: 0 }}>
          <Text size="xs" c="dimmed">
            {label}
          </Text>
          <Text fw={600} lineClamp={1}>
            {card.name}
          </Text>
        </Stack>
      </Group>
    </Paper>
  );
}

function useSharedDeckTiles(signedIn: boolean, collectionCounts: Map<string, number> | null) {
  const contextMenu = useCardContextMenu();
  const cardMenu = useSharedCardMenu(signedIn);
  const extras: DeckBoardsExtras<OwnedEntry> = {
    tile: (card) => ({
      props: {
        collectionCount: collectionCounts ? collectionCounts.get(cardNameKey(card.name)) : undefined,
        onContextMenu: (event, clicked, shown) => contextMenu.open(event, cardMenu.menuFor(clicked, shown)),
      },
    }),
  };
  return {
    extras,
    overlays: (
      <>
        {contextMenu.element}
        {cardMenu.modals}
      </>
    ),
  };
}

function SharedDeckCards({ shared, signedIn }: { shared: SharedDeck; signedIn: boolean }) {
  const { pathname } = useLocation();
  const showCollection = useShowCollectionInDecks(signedIn) && signedIn;
  const ownership = useDeckOwnership(shared.deck.id, showCollection);
  const ownedByName = new Map((ownership.data?.cards ?? []).map((entry) => [cardNameKey(entry.name), entry.owned]));
  const [sort, setSort] = useState<SharedDeckSort>('mana_value');
  const [grouping, setGrouping] = useState<SharedCardGrouping | null>('type');
  const display = useCardDisplay({ showDetails: false });
  const [openedCard, setOpenedCard] = useState<Card | null>(null);
  const [collapsed, setCollapsed] = useState<CollapsibleBoard[]>(DEFAULT_COLLAPSED_BOARDS);
  const currency = usePriceCurrency();
  const stats = useSharedDeckStats(shared.deck.id, currency !== null);
  const all = sharedCardsToCards(shared.cards);
  const commanders = all
    .filter((_, index) => shared.cards[index].commander)
    .sort(
      (a, b) =>
        Number(b.scryfall_id === shared.deck.commander_scryfall_id) -
        Number(a.scryfall_id === shared.deck.commander_scryfall_id),
    );
  const commander = commanders[0];
  const cardTags = tagsByName(shared.cards);
  const boards = useDeckBoards({
    entries: all.map(ownedEntry),
    sort,
    grouping,
    commanders: commanders.map((card) => ({ cardId: card.id })),
    tagsOf: (card) => tagsOf(cardTags, card.name),
  });
  const visuals = useCardVisuals(all, display);
  const tiles = useSharedDeckTiles(signedIn, showCollection ? ownedByName : null);

  function toggleBoard(board: CollapsibleBoard) {
    setCollapsed((current) =>
      current.includes(board) ? current.filter((other) => other !== board) : [...current, board],
    );
  }

  const commanderImage = commander ? visuals.imageUrl(commander) : undefined;

  useEffect(() => {
    setDefaultCardPreview(
      commander
        ? {
            name: commander.name,
            scryfallId: commander.scryfall_id,
            foil: commander.foil,
            imageUrl: commanderImage,
            open: () => setOpenedCard(commander),
          }
        : null,
      pathname,
    );
  });
  useEffect(() => () => setDefaultCardPreview(null), []);

  return (
    <Stack>
      {commanders.length > 0 && (
        <Group align="stretch" gap="sm">
          {commanders.map((card, index) => (
            <CommanderCard
              key={card.id}
              card={card}
              label={index === 0 ? 'Commandant' : 'Second commandant'}
              imageUrl={visuals.imageUrl(card)}
              onOpen={() => setOpenedCard(card)}
            />
          ))}
        </Group>
      )}

      <Group justify="flex-end" align="stretch" gap="md" miw={0}>
        <Select
          label="Grouper par"
          placeholder="Aucun regroupement"
          data={sharedGroupingOptions}
          value={grouping}
          onChange={(value) => setGrouping(parseSharedGrouping(value))}
          clearable
          w={200}
        />
        <CardDisplayControls
          display={display}
          wrap="nowrap"
          options={
            <Select
              label={grouping ? 'Tri dans chaque groupe' : 'Tri'}
              data={sharedDeckSortOptions}
              value={sort}
              onChange={(value) => value && setSort(value as SharedDeckSort)}
              allowDeselect={false}
              w={240}
              miw={0}
            />
          }
        />
        {signedIn && <CollectionToggle description="Les cartes de ce deck que tu as dans ta collection" />}
      </Group>

      <DeckBoards
        boards={boards}
        display={display}
        collapsed={collapsed}
        onToggleBoard={toggleBoard}
        boardValues={stats.data?.board_values}
        emptyDeck={<EmptyNote title="Ce deck est vide" />}
        extras={tiles.extras}
        onOpen={setOpenedCard}
      />

      {tiles.overlays}
      <SharedCardModal
        card={openedCard}
        imageUrl={openedCard ? visuals.imageUrl(openedCard) : undefined}
        onClose={() => setOpenedCard(null)}
      />
    </Stack>
  );
}
