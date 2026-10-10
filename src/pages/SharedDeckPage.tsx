import {
  Alert,
  Anchor,
  Badge,
  Box,
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
import { type ReactNode, useEffect, useState } from 'react';
import { Link, Navigate, useLocation, useParams } from 'react-router';

import { ApiError, errorMessage } from '../api/errors';
import type { Card, DeckCard, SharedDeck } from '../api/types';
import { useAccount } from '../auth/account';
import { ProfileAvatar } from '../auth/UserAvatar';
import { useShowCollectionInDecks } from '../auth/preferences';
import { useSession } from '../auth/useSession';
import { useCardContextMenu } from '../cards/CardContextMenu';
import { CardImage } from '../cards/CardImage';
import { CardSizeControl, useCardSize } from '../cards/CardSizeControl';
import { CardTile } from '../cards/CardTile';
import { artBackground, artCredit, deckArtId } from '../decks/art';
import { type CollapsibleBoard, DEFAULT_COLLAPSED_BOARDS, inBoard } from '../decks/boards';
import { BoardSection } from '../decks/BoardSection';
import { type DeckCardGrouped, DeckCardGroups, useDeckCardGroups } from '../decks/DeckCardGroups';
import { LegalityWarning } from '../decks/DeckLegalityWarning';
import { isCommanderFormat } from '../decks/api';
import { BracketBadge } from '../decks/bracket';
import { LikeButton, LikeCount } from '../decks/LikeButton';
import { CollectionToggle } from '../decks/CollectionToggle';
import { CompareDeckModal } from '../decks/CompareDeckModal';
import { useDeckCopyActions } from '../decks/DeckCopyActions';
import { DeckStatsView } from '../decks/DeckStatsPanel';
import { ExportDeckModal } from '../decks/ExportDeckModal';
import { sortDeckCards } from '../decks/pendingCards';
import {
  type SharedDeckSort,
  sharedCardsToCards,
  sharedDeckSortOptions,
  useDeckOwnership,
  useSharedDeck,
  useSharedDeckLegality,
  useSharedDeckStats,
} from '../decks/shared';
import { SharedCardModal } from '../decks/SharedCardModal';
import { useSharedCardMenu } from '../decks/useSharedCardMenu';
import { parseSharedGrouping, type SharedCardGrouping, sharedGroupingOptions } from '../decks/storageGrouping';
import { cardNameKey, tagsByName, tagsOf } from '../decks/tags';
import { visibilityOption } from '../decks/visibility';
import { setDefaultCardPreview, showCardPreview } from '../layout/cardPreview';
import { SettingsMenu } from '../layout/SettingsMenu';
import { useCardArts, useCardBackImages, useCardImages, useManaCosts } from '../scryfall/hooks';

export function SharedDeckRedirect() {
  const { id = '' } = useParams();
  return <Navigate to={`/decks/${id}`} replace />;
}

export function SharedDeckView({ deckId }: { deckId: string }) {
  const shared = useSharedDeck(deckId);
  const legality = useSharedDeckLegality(deckId);
  const [tab, setTab] = useState<string | null>('cards');
  const stats = useSharedDeckStats(deckId, tab === 'stats');
  const { status } = useSession();
  const signedIn = status === 'authenticated';
  const artId = shared.data ? deckArtId(shared.data.deck) : null;
  const arts = useCardArts([artId]);
  const art = artId ? (arts.data?.[artId] ?? null) : null;

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
      <Paper
        radius="md"
        p={art ? 'lg' : 0}
        mih={art ? 200 : undefined}
        pos="relative"
        style={art ? { ...artBackground(art.url, 'light'), display: 'flex', flexDirection: 'column' } : undefined}
      >
        {signedIn ? (
          <SignedInDeckMenu deckId={deck.id} deckName={deck.name} ownerId={owner.id} onImage={art !== null} />
        ) : (
          <SharedDeckMenu deckId={deck.id} deckName={deck.name} onImage={art !== null} />
        )}
        <Stack gap={6} pr={48} style={art ? { marginTop: 'auto' } : undefined}>
          <Title order={2} c={art ? 'white' : undefined}>
            {deck.name}
          </Title>
          <Group gap="xs">
            <Badge variant={art ? 'white' : 'light'}>{deck.format}</Badge>
            <Badge
              variant={art ? 'white' : 'light'}
              color={visibilityOption(deck.visibility).color}
              title={visibilityOption(deck.visibility).description}
            >
              {visibilityOption(deck.visibility).label}
            </Badge>
            {isCommanderFormat(deck.format) && <BracketBadge bracket={deck.bracket} onImage={art !== null} size="md" />}
            {signedIn ? (
              <SharedDeckLike deckId={deck.id} ownerId={owner.id} onImage={art !== null} />
            ) : (
              <LikeCount count={deck.likes_count} onImage={art !== null} />
            )}
          </Group>
          <Group gap="xs" wrap="nowrap">
            <ProfileAvatar scryfallId={owner.avatar_scryfall_id} name={ownerName} size={28} />
            <Text size="sm" c={art ? 'gray.3' : 'dimmed'}>
              par{' '}
              {signedIn ? (
                <Anchor component={Link} to={`/users/${owner.id}`} size="sm" c={art ? 'white' : undefined} fw={500}>
                  {ownerName}
                </Anchor>
              ) : (
                <Text span inherit fw={500} c={art ? 'white' : undefined}>
                  {ownerName}
                </Text>
              )}
            </Text>
          </Group>
        </Stack>
        {art && (
          <Text size="xs" c="gray.4" ta="right" mt="xs">
            {artCredit(art.artist)}
          </Text>
        )}
      </Paper>

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
          {tab === 'stats' && <DeckStatsView stats={stats} emptyMessage="Ce deck est vide." />}
        </Tabs.Panel>
      </Tabs>
    </Stack>
  );
}

interface SharedDeckMenuProps {
  deckId: string;
  deckName: string;
  onImage: boolean;
  extraItems?: ReactNode;
  extraModals?: ReactNode;
}

function SharedDeckMenu({ deckId, deckName, onImage, extraItems, extraModals }: SharedDeckMenuProps) {
  const [exportOpened, setExportOpened] = useState(false);
  const [compareOpened, setCompareOpened] = useState(false);

  return (
    <>
      <Box
        pos="absolute"
        top={onImage ? 'var(--mantine-spacing-lg)' : 0}
        right={onImage ? 'var(--mantine-spacing-lg)' : 0}
      >
        <SettingsMenu label="Actions sur le deck" onImage={onImage}>
          <Menu.Item onClick={() => setExportOpened(true)}>Exporter</Menu.Item>
          <Menu.Item onClick={() => setCompareOpened(true)}>Comparer avec un autre deck</Menu.Item>
          {extraItems}
        </SettingsMenu>
      </Box>
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
  const copyActions = useDeckCopyActions(props.deckId, account.data?.id === ownerId);

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

function CommanderCard({ card, imageUrl, onOpen }: { card: Card; imageUrl: string | undefined; onOpen: () => void }) {
  return (
    <Paper withBorder p="sm" maw={420} onMouseEnter={() => showCardPreview(null)}>
      <Group wrap="nowrap" align="center">
        <Box w={72} style={{ flexShrink: 0, cursor: 'pointer' }} onClick={onOpen}>
          <CardImage name={card.name} url={imageUrl} loading={!imageUrl} />
        </Box>
        <Stack gap={4} style={{ minWidth: 0 }}>
          <Text size="xs" c="dimmed">
            Commandant
          </Text>
          <Text fw={600} lineClamp={1}>
            {card.name}
          </Text>
        </Stack>
      </Group>
    </Paper>
  );
}

function SharedDeckCards({ shared, signedIn }: { shared: SharedDeck; signedIn: boolean }) {
  const { pathname } = useLocation();
  const showCollection = useShowCollectionInDecks(signedIn) && signedIn;
  const ownership = useDeckOwnership(shared.deck.id, showCollection);
  const ownedByName = new Map((ownership.data?.cards ?? []).map((entry) => [cardNameKey(entry.name), entry.owned]));
  const [sort, setSort] = useState<SharedDeckSort>('mana_value');
  const [grouping, setGrouping] = useState<SharedCardGrouping | null>('type');
  const { size, setSize, textOnly, gridProps } = useCardSize();
  const [openedCard, setOpenedCard] = useState<Card | null>(null);
  const [collapsed, setCollapsed] = useState<CollapsibleBoard[]>(DEFAULT_COLLAPSED_BOARDS);
  const all = sharedCardsToCards(shared.cards);
  const commanderIndex = shared.cards.findIndex((card) => card.commander);
  const commander = commanderIndex >= 0 ? all[commanderIndex] : undefined;
  const cards = sortDeckCards<DeckCard>(all, sort);
  const mainCards = inBoard(cards, 'main');
  const sideboardCards = inBoard(cards, 'sideboard');
  const consideringCards = inBoard(cards, 'considering');
  const ids = cards.map((card) => card.scryfall_id);
  const images = useCardImages(ids);
  const backImages = useCardBackImages(ids);
  const manaCosts = useManaCosts(ids);
  const cardTags = tagsByName(shared.cards);
  const cardTagsOf = (card: Card) => tagsOf(cardTags, card.name);
  const groupedMain = useDeckCardGroups(mainCards, grouping, undefined, cardTagsOf);
  const groupedSideboard = useDeckCardGroups(sideboardCards, grouping, undefined, cardTagsOf);
  const groupedConsidering = useDeckCardGroups(consideringCards, grouping, undefined, cardTagsOf);

  const contextMenu = useCardContextMenu();
  const cardMenu = useSharedCardMenu(signedIn);

  function toggleBoard(board: CollapsibleBoard) {
    setCollapsed((current) =>
      current.includes(board) ? current.filter((other) => other !== board) : [...current, board],
    );
  }

  function count(boardCards: Card[]) {
    return boardCards.reduce((total, card) => total + (card.quantity ?? 1), 0);
  }
  const commanderImage = commander ? images.data?.[commander.scryfall_id] : undefined;

  useEffect(() => {
    setDefaultCardPreview(
      commander
        ? {
            name: commander.name,
            scryfallId: commander.scryfall_id,
            imageUrl: commanderImage,
            open: () => setOpenedCard(commander),
          }
        : null,
      pathname,
    );
  });
  useEffect(() => () => setDefaultCardPreview(null), []);

  function renderTile(card: Card) {
    return (
      <CardTile
        key={card.id}
        card={card}
        imageUrl={images.data?.[card.scryfall_id]}
        backImageUrl={backImages.data?.[card.scryfall_id]}
        imageLoading={images.isLoading}
        textOnly={textOnly}
        manaCost={manaCosts.isLoading ? undefined : (manaCosts.data?.[card.scryfall_id] ?? null)}
        collectionCount={showCollection ? ownedByName.get(cardNameKey(card.name)) : undefined}
        compact={size === 'small'}
        onOpen={setOpenedCard}
        onContextMenu={(event, clicked) =>
          contextMenu.open(event, cardMenu.menuFor(clicked, images.data?.[clicked.scryfall_id]))
        }
      />
    );
  }

  function renderBoard(boardCards: Card[], grouped: DeckCardGrouped) {
    return grouping ? (
      <DeckCardGroups {...grouped} gridProps={gridProps} renderTile={renderTile} />
    ) : (
      <SimpleGrid {...gridProps}>{boardCards.map(renderTile)}</SimpleGrid>
    );
  }

  return (
    <Stack>
      {commander && (
        <CommanderCard card={commander} imageUrl={commanderImage} onOpen={() => setOpenedCard(commander)} />
      )}

      <Group justify="space-between" align="flex-end">
        <Group align="flex-end">
          <Select
            label="Grouper par"
            placeholder="Aucun regroupement"
            data={sharedGroupingOptions}
            value={grouping}
            onChange={(value) => setGrouping(parseSharedGrouping(value))}
            clearable
            w={200}
          />
          <Select
            label={grouping ? 'Tri dans chaque groupe' : 'Tri'}
            data={sharedDeckSortOptions}
            value={sort}
            onChange={(value) => value && setSort(value as SharedDeckSort)}
            allowDeselect={false}
            w={240}
          />
        </Group>
        <Group gap="lg" align="stretch">
          {signedIn && <CollectionToggle description="Les cartes de ce deck que tu as dans ta collection" />}
          <CardSizeControl value={size} onChange={setSize} />
        </Group>
      </Group>

      {cards.length === 0 ? (
        <Center p="xl">
          <Text c="dimmed">Ce deck est vide.</Text>
        </Center>
      ) : mainCards.length === 0 ? (
        <Text size="sm" c="dimmed">
          Aucune carte dans le deck principal.
        </Text>
      ) : (
        renderBoard(mainCards, groupedMain)
      )}
      {sideboardCards.length > 0 && (
        <BoardSection
          board="sideboard"
          count={count(sideboardCards)}
          collapsed={collapsed.includes('sideboard')}
          onToggle={() => toggleBoard('sideboard')}
          emptyMessage=""
        >
          {renderBoard(sideboardCards, groupedSideboard)}
        </BoardSection>
      )}
      {consideringCards.length > 0 && (
        <BoardSection
          board="considering"
          count={count(consideringCards)}
          collapsed={collapsed.includes('considering')}
          onToggle={() => toggleBoard('considering')}
          emptyMessage=""
        >
          {renderBoard(consideringCards, groupedConsidering)}
        </BoardSection>
      )}

      {contextMenu.element}
      {cardMenu.modals}
      <SharedCardModal
        card={openedCard}
        imageUrl={openedCard ? images.data?.[openedCard.scryfall_id] : undefined}
        onClose={() => setOpenedCard(null)}
      />
    </Stack>
  );
}
