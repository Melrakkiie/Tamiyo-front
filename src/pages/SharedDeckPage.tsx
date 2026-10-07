import {
  Alert,
  Anchor,
  Badge,
  Box,
  Center,
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
import { useEffect, useState } from 'react';
import { Link, useLocation, useParams } from 'react-router';

import { ApiError, errorMessage } from '../api/errors';
import type { Card, SharedDeck } from '../api/types';
import { useAccount } from '../auth/account';
import { ProfileAvatar } from '../auth/UserAvatar';
import { useSession } from '../auth/useSession';
import { CardImage } from '../cards/CardImage';
import { CardSizeControl, useCardSize } from '../cards/CardSizeControl';
import { CardTile } from '../cards/CardTile';
import { type CardGrouping, groupingOptions, parseGrouping } from '../cards/grouping';
import { artBackground, artCredit, deckArtId } from '../decks/art';
import { DeckCardGroups, useDeckCardGroups } from '../decks/DeckCardGroups';
import { LegalityWarning } from '../decks/DeckLegalityWarning';
import { DeckStatsView } from '../decks/DeckStatsPanel';
import { sortDeckCards } from '../decks/pendingCards';
import { sharedCardsToCards, useSharedDeck, useSharedDeckLegality, useSharedDeckStats } from '../decks/shared';
import { SharedCardModal } from '../decks/SharedCardModal';
import { visibilityOption } from '../decks/visibility';
import { setDefaultCardPreview, showCardPreview } from '../layout/cardPreview';
import { useCardArts, useCardBackImages, useCardImages, useManaCosts } from '../scryfall/hooks';

type SharedSort = 'name' | 'mana_value' | '-mana_value';

const sortOptions: { value: SharedSort; label: string }[] = [
  { value: 'name', label: 'Nom (A → Z)' },
  { value: 'mana_value', label: 'Coût de mana croissant' },
  { value: '-mana_value', label: 'Coût de mana décroissant' },
];

export function SharedDeckPage() {
  const { id = '' } = useParams();
  return <SharedDeckView key={id} deckId={id} />;
}

function SharedDeckView({ deckId }: { deckId: string }) {
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
          {notFound ? "Ce deck n'existe pas, ou son propriétaire ne le partage plus." : errorMessage(shared.error)}
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
        style={art ? { ...artBackground(art.url, 'light'), display: 'flex', flexDirection: 'column' } : undefined}
      >
        <Stack gap={6} style={art ? { marginTop: 'auto' } : undefined}>
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
          <SharedDeckCards shared={shared.data} />
        </Tabs.Panel>
        <Tabs.Panel value="stats" pt="md">
          {tab === 'stats' && <DeckStatsView stats={stats} emptyMessage="Ce deck est vide." />}
        </Tabs.Panel>
      </Tabs>
    </Stack>
  );
}

function OwnDeckNotice({ ownerId, deckId }: { ownerId: string; deckId: string }) {
  const account = useAccount();

  if (account.data?.id !== ownerId) {
    return null;
  }
  return (
    <Alert color="blue" variant="light">
      C'est ton deck, tel que le voient les personnes qui ont son lien.{' '}
      <Anchor component={Link} to={`/decks/${deckId}`} size="sm">
        Le modifier
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

function SharedDeckCards({ shared }: { shared: SharedDeck }) {
  const { pathname } = useLocation();
  const [sort, setSort] = useState<SharedSort>('name');
  const [grouping, setGrouping] = useState<CardGrouping | null>('type');
  const { size, setSize, textOnly, gridProps } = useCardSize();
  const [openedCard, setOpenedCard] = useState<Card | null>(null);
  const all = sharedCardsToCards(shared.cards);
  const commanderIndex = shared.cards.findIndex((card) => card.commander);
  const commander = commanderIndex >= 0 ? all[commanderIndex] : undefined;
  const cards = sortDeckCards(all, sort);
  const ids = cards.map((card) => card.scryfall_id);
  const images = useCardImages(ids);
  const backImages = useCardBackImages(ids);
  const manaCosts = useManaCosts(ids);
  const grouped = useDeckCardGroups(cards, grouping);
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
        onOpen={setOpenedCard}
      />
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
            onChange={(value) => value && setSort(value as SharedSort)}
            allowDeselect={false}
            w={240}
          />
        </Group>
        <CardSizeControl value={size} onChange={setSize} />
      </Group>

      {cards.length === 0 ? (
        <Center p="xl">
          <Text c="dimmed">Ce deck est vide.</Text>
        </Center>
      ) : grouping ? (
        <DeckCardGroups {...grouped} gridProps={gridProps} renderTile={renderTile} />
      ) : (
        <SimpleGrid {...gridProps}>{cards.map(renderTile)}</SimpleGrid>
      )}

      <SharedCardModal
        card={openedCard}
        imageUrl={openedCard ? images.data?.[openedCard.scryfall_id] : undefined}
        onClose={() => setOpenedCard(null)}
      />
    </Stack>
  );
}
