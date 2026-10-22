import {
  Anchor,
  Box,
  Button,
  Card,
  Center,
  Group,
  Loader,
  Paper,
  SimpleGrid,
  Skeleton,
  Stack,
  Text,
  Title,
} from '@mantine/core';
import type { ReactNode } from 'react';
import { Link } from 'react-router';

import type { Card as CollectionCard, Deck } from '../api/types';
import { useAccount } from '../auth/account';
import { useCards } from '../cards/api';
import { CardImage } from '../cards/CardImage';
import { useAllDecks } from '../decks/api';
import { artBackground, useDeckArts } from '../decks/art';
import { DeckTile } from '../decks/DeckTile';
import { MothRoost, RoamingPerch } from '../layout/MothRoost';
import { usePageTitle } from '../layout/usePageTitle';
import { useCardImages } from '../scryfall/hooks';
import { useAllStorages } from '../storages/api';
import { notebookTitle } from './notebookTitle';
import { StorageArt } from '../storages/StorageArt';
import { EmptyNote } from '../theme/EmptyNote';
import { SectionTitle } from '../theme/SectionTitle';
import { tapeProps } from '../theme/tape';

const RECENT_DECKS = 3;
const RECENT_CARDS = 6;

function plural(count: number, word: string) {
  return `${count} ${word}${count > 1 ? 's' : ''}`;
}

function latestCards(cards: CollectionCard[]) {
  const seen = new Set<string>();
  return cards
    .filter((card) => {
      if (seen.has(card.scryfall_id)) {
        return false;
      }
      seen.add(card.scryfall_id);
      return true;
    })
    .slice(0, RECENT_CARDS);
}

interface StatTileProps {
  label: string;
  value: number | undefined;
  note?: string;
  art: ReactNode;
  to: string;
}

function StatTile({ label, value, note, art, to }: StatTileProps) {
  return (
    <div {...tapeProps(`home-${label}`)}>
      <Card withBorder shadow="sm" h="100%" component={Link} to={to}>
        <Group gap="md" wrap="nowrap">
          {art}
          <Stack gap={0} style={{ minWidth: 0 }}>
            {value === undefined ? (
              <Skeleton h={36} w={56} my={4} />
            ) : (
              <Text ff="heading" fw={700} fz={36} lh={1.2}>
                {value}
              </Text>
            )}
            <Text fw={600}>
              <RoamingPerch text={label} />
            </Text>
            {note && (
              <Text
                className="tamiyo-hand"
                size="lg"
                c="dimmed"
                lineClamp={1}
                // lineClamp clips overflow: leave room for the moth above and beside the last symbol.
                style={{ padding: '0.5em 0.75em 0 0', margin: '-0.5em -0.75em 0 0' }}
              >
                <RoamingPerch text={note} />
              </Text>
            )}
          </Stack>
        </Group>
      </Card>
    </div>
  );
}

function SeeAll({ to, children }: { to: string; children: ReactNode }) {
  return (
    <Anchor component={Link} to={to} size="sm" c="prune" style={{ flexShrink: 0 }}>
      {children}
    </Anchor>
  );
}

function Hero({
  title,
  deck,
  artUrl,
  artist,
}: {
  title?: string;
  deck?: Deck;
  artUrl?: string;
  artist?: string | null;
}) {
  const onArt = !!artUrl;
  return (
    <Paper
      withBorder
      shadow="sm"
      radius="md"
      p={{ base: 'lg', sm: 'xl' }}
      pos="relative"
      mih={onArt ? { base: 280, sm: 360 } : undefined}
      className="tamiyo-banner-taped"
      style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-end',
        ...(onArt ? { ...artBackground(artUrl, 'light'), color: 'white' } : {}),
      }}
    >
      <Stack gap={4} style={{ minWidth: 0 }}>
        {title === undefined ? (
          <Skeleton h={44} w={320} maw="100%" />
        ) : (
          <Title order={1} fz={{ base: 28, sm: 34 }} c={onArt ? 'white' : undefined}>
            <RoamingPerch title text={title} shadow={onArt} />
          </Title>
        )}
        <Text
          className="tamiyo-hand"
          fz={24}
          c={onArt ? 'prune.2' : 'prune'}
          style={{ transform: 'rotate(-1.5deg)', transformOrigin: 'left' }}
        >
          <RoamingPerch
            text={deck ? `on reprend « ${deck.name} » ?` : 'par quelle page on commence ?'}
            shadow={onArt}
          />
        </Text>
        <Group gap="sm" mt="md">
          {deck && (
            <Button component={Link} to={`/decks/${deck.id}`}>
              Reprendre le deck
            </Button>
          )}
          <Button component={Link} to="/cards" variant={deck ? 'default' : 'filled'}>
            Ouvrir la collection
          </Button>
          <Button component={Link} to="/explorer" variant="default">
            Explorer les decks
          </Button>
        </Group>
      </Stack>
      {onArt && artist && (
        <Text size="xs" c="gray.4" pos="absolute" bottom={8} right={12} visibleFrom="sm">
          Illustration : {artist}
        </Text>
      )}
    </Paper>
  );
}

export function HomePage() {
  usePageTitle('Accueil');
  const account = useAccount();
  const decks = useAllDecks();
  const storages = useAllStorages();
  const cards = useCards({ page: 1, limit: 2 * RECENT_CARDS, sort: '-added', query: '', storageId: undefined });

  const recentDecks = [...(decks.data ?? [])].sort((a, b) => b.updated.localeCompare(a.updated)).slice(0, RECENT_DECKS);
  const lastDeck = recentDecks[0];
  const artOf = useDeckArts(recentDecks);
  const lastArt = lastDeck ? artOf(lastDeck) : undefined;

  const recentCards = latestCards(cards.data?.data ?? []);
  const images = useCardImages(recentCards.map((card) => card.scryfall_id));

  const favorites = (decks.data ?? []).filter((deck) => deck.favorite).length;
  const storedCards = (storages.data ?? []).reduce((total, storage) => total + storage.card_count, 0);
  const cardTotal = cards.data?.total;
  const loading = decks.isLoading || cards.isLoading;
  const empty = !loading && cardTotal === 0 && decks.data?.length === 0;

  return (
    <MothRoost>
      <Stack gap={40} pt="xs">
        <Hero
          title={account.isPending ? undefined : notebookTitle(account.data?.display_name)}
          deck={lastDeck}
          artUrl={lastArt?.url}
          artist={lastArt?.artist}
        />

        <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="xl" verticalSpacing="xl">
          <StatTile
            label={cardTotal === 1 ? 'Carte' : 'Cartes'}
            value={cardTotal}
            note={recentCards[0] ? `dernière : ${recentCards[0].name}` : undefined}
            art={<StorageArt type="box" size={56} />}
            to="/cards"
          />
          <StatTile
            label={decks.data?.length === 1 ? 'Deck' : 'Decks'}
            value={decks.data?.length}
            note={favorites > 0 ? `dont ${plural(favorites, 'favori')}` : undefined}
            art={<StorageArt type="deckbox" size={56} />}
            to="/decks"
          />
          <StatTile
            label={storages.data?.length === 1 ? 'Rangement' : 'Rangements'}
            value={storages.data?.length}
            note={storedCards > 0 ? `${plural(storedCards, 'carte')} rangée${storedCards > 1 ? 's' : ''}` : undefined}
            art={<StorageArt type="binder" size={56} />}
            to="/storages"
          />
        </SimpleGrid>

        {loading ? (
          <Center p="xl">
            <Loader />
          </Center>
        ) : empty ? (
          <EmptyNote
            title={<RoamingPerch text="Ton carnet est encore tout neuf" />}
            note={<RoamingPerch text="ajoute tes premières cartes, ou monte un deck" />}
          >
            <Group gap="sm" justify="center">
              <Button component={Link} to="/cards">
                Ajouter des cartes
              </Button>
              <Button component={Link} to="/decks" variant="default">
                Créer un deck
              </Button>
            </Group>
          </EmptyNote>
        ) : (
          <>
            {recentDecks.length > 0 && (
              <Stack gap="md">
                <Group gap="md" wrap="nowrap">
                  <Box style={{ flex: 1, minWidth: 0 }}>
                    <SectionTitle>
                      <RoamingPerch text="Decks récents" />
                    </SectionTitle>
                  </Box>
                  <SeeAll to="/decks">Tous les decks</SeeAll>
                </Group>
                <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="xl" verticalSpacing="xl" pt={6}>
                  {recentDecks.map((deck) => (
                    <DeckTile key={deck.id} deck={deck} art={artOf(deck)} showVisibility={false} />
                  ))}
                </SimpleGrid>
              </Stack>
            )}

            {recentCards.length > 0 && (
              <Stack gap="md">
                <Group gap="md" wrap="nowrap">
                  <Box style={{ flex: 1, minWidth: 0 }}>
                    <SectionTitle>
                      <RoamingPerch text="Dernières trouvailles" />
                    </SectionTitle>
                  </Box>
                  <SeeAll to="/cards">Toute la collection</SeeAll>
                </Group>
                <SimpleGrid cols={{ base: 2, xs: 3, md: 6 }} spacing="lg" verticalSpacing="xl" pt={6}>
                  {recentCards.map((card) => (
                    <Box
                      key={card.id}
                      component={Link}
                      to={`/cards?carte=${card.id}`}
                      {...tapeProps(`home-card-${card.id}`)}
                    >
                      <CardImage name={card.name} url={images.data?.[card.scryfall_id]} loading={images.isLoading} />
                    </Box>
                  ))}
                </SimpleGrid>
              </Stack>
            )}
          </>
        )}
      </Stack>
    </MothRoost>
  );
}
