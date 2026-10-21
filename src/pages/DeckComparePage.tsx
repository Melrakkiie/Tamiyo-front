import {
  Alert,
  Anchor,
  Badge,
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
import { type ReactNode, useState } from 'react';
import { Link, useParams } from 'react-router';

import { ApiError, errorMessage } from '../api/errors';
import type { Card, ComparedCard, ComparedDeck } from '../api/types';
import { useSession } from '../auth/useSession';
import { type CardDisplay, CardDisplayControls, useCardDisplay } from '../cards/CardDisplay';
import { useCardVisuals } from '../cards/useCardVisuals';
import { useDeckComparison } from '../decks/api';
import { comparedStackTotals } from '../decks/comparedStack';
import { DeckBoards, type DeckBoardsExtras, useDeckBoards } from '../decks/DeckBoards';
import { type OwnedSource, type OwnedEntry, ownedEntry } from '../decks/deckEntries';
import { FormatSticker } from '../decks/FormatSticker';
import { SharedCardModal } from '../decks/SharedCardModal';
import { type SharedDeckSort, sharedDeckSortOptions } from '../decks/shared';
import { type CardGrouping, groupingOptions, parseGrouping } from '../cards/grouping';
import { usePageTitle } from '../layout/usePageTitle';

type Side = 'deck' | 'other' | 'both';

const sideColors: Record<Side, string> = { deck: 'lune', both: 'ocelle', other: 'prune' };

interface DisplayOptions {
  grouping: CardGrouping | null;
  sort: SharedDeckSort;
  display: CardDisplay;
}

export function DeckComparePage() {
  const params = useParams();
  const id = params.id ?? '';
  const otherId = params.otherId ?? '';
  const signedIn = useSession().status === 'authenticated';
  const comparison = useDeckComparison(id, otherId, signedIn);
  usePageTitle(
    comparison.data ? `${comparison.data.deck.name} / ${comparison.data.other.name}` : 'Comparaison de decks',
  );
  const [tab, setTab] = useState<string | null>('common');
  const [sort, setSort] = useState<SharedDeckSort>('mana_value');
  const [grouping, setGrouping] = useState<CardGrouping | null>('type');
  const display = useCardDisplay({ showDetails: false });

  if (comparison.isLoading) {
    return (
      <Center p="xl">
        <Loader />
      </Center>
    );
  }

  if (!comparison.data) {
    const notFound =
      comparison.error instanceof ApiError && (comparison.error.status === 404 || comparison.error.status === 400);
    return (
      <Stack align="flex-start">
        <Alert color="red">
          {notFound
            ? signedIn
              ? "Un des deux decks n'existe pas, ou c'est le deck privé de quelqu'un d'autre."
              : "Un des deux decks n'existe pas, ou il est privé."
            : errorMessage(comparison.error)}
        </Alert>
        <Anchor component={Link} to={`/decks/${id}`}>
          Retour au deck
        </Anchor>
      </Stack>
    );
  }

  const { deck, other, common, only_in_deck: onlyInDeck, only_in_other: onlyInOther } = comparison.data;
  const options: DisplayOptions = { grouping, sort, display };

  return (
    <Stack>
      <Anchor component={Link} to={`/decks/${deck.id}`} size="sm">
        ← {deck.name}
      </Anchor>

      <Title order={2}>Comparaison</Title>

      <SimpleGrid cols={{ base: 1, sm: 2 }}>
        <DeckSummary deck={deck} color={sideColors.deck} />
        <DeckSummary deck={other} color={sideColors.other} />
      </SimpleGrid>

      <Group justify="flex-end" align="flex-end" gap="md">
        <Select
          label="Grouper par"
          placeholder="Aucun regroupement"
          data={groupingOptions}
          value={grouping}
          onChange={(value) => setGrouping(parseGrouping(value))}
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
      </Group>

      <Tabs value={tab} onChange={setTab} variant="pills" radius="md">
        <Paper withBorder p={4} radius="md">
          <Tabs.List grow>
            <Tabs.Tab value="deck" color={sideColors.deck}>
              <TabLabel title={`Seulement dans ${deck.name}`} cards={onlyInDeck} side="deck" active={tab === 'deck'} />
            </Tabs.Tab>
            <Tabs.Tab value="common" color={sideColors.both}>
              <TabLabel title="En commun" cards={common} side="both" active={tab === 'common'} />
            </Tabs.Tab>
            <Tabs.Tab value="other" color={sideColors.other}>
              <TabLabel
                title={`Seulement dans ${other.name}`}
                cards={onlyInOther}
                side="other"
                active={tab === 'other'}
              />
            </Tabs.Tab>
          </Tabs.List>
        </Paper>

        <Tabs.Panel value="deck" pt="md">
          {tab === 'deck' && (
            <ComparedCards cards={onlyInDeck} side="deck" deck={deck} other={other} options={options} />
          )}
        </Tabs.Panel>
        <Tabs.Panel value="common" pt="md">
          {tab === 'common' && <ComparedCards cards={common} side="both" deck={deck} other={other} options={options} />}
        </Tabs.Panel>
        <Tabs.Panel value="other" pt="md">
          {tab === 'other' && (
            <ComparedCards cards={onlyInOther} side="other" deck={deck} other={other} options={options} />
          )}
        </Tabs.Panel>
      </Tabs>
    </Stack>
  );
}

function DeckSummary({ deck, color }: { deck: ComparedDeck; color: string }) {
  return (
    <Paper withBorder p="md" radius="md" style={{ borderLeft: `4px solid var(--mantine-color-${color}-6)` }}>
      <Stack gap={6}>
        <Anchor component={Link} to={`/decks/${deck.id}`} fw={600} lineClamp={1}>
          {deck.name}
        </Anchor>
        <Group gap="xs">
          <FormatSticker format={deck.format} size="xs" />
          <Text size="sm" c="dimmed">
            {deck.card_count} carte{deck.card_count > 1 ? 's' : ''}
            {deck.mine ? '' : ` · deck de ${deck.owner.display_name ?? "quelqu'un d'autre"}`}
          </Text>
        </Group>
      </Stack>
    </Paper>
  );
}

function copies(card: ComparedCard, side: Side) {
  switch (side) {
    case 'deck':
      return card.quantity;
    case 'other':
      return card.other_quantity;
    case 'both':
      return 1;
  }
}

interface TabLabelProps {
  title: string;
  cards: ComparedCard[];
  side: Side;
  active: boolean;
}

function TabLabel({ title, cards, side, active }: TabLabelProps) {
  const total = cards.reduce((sum, card) => sum + copies(card, side), 0);
  return (
    <Group gap={8} wrap="nowrap" justify="center">
      <Text size="sm" fw={600} maw={260} truncate>
        {title}
      </Text>
      <Badge size="md" variant={active ? 'white' : 'light'} color={sideColors[side]}>
        {total}
      </Badge>
    </Group>
  );
}

function toOwnedSources(cards: ComparedCard[], side: Side): OwnedSource[] {
  return cards.map((card, index) => ({
    id: index + 1,
    name: card.name,
    scryfall_id: card.scryfall_id,
    set_code: '',
    collector_number: '',
    foil: false,
    proxy: false,
    storage_id: null,
    mana_value: card.mana_value,
    colors: card.colors,
    card_type: card.card_type as Card['card_type'],
    color_identity: card.color_identity,
    added: '',
    updated: '',
    quantity: copies(card, side),
    board: 'main',
  }));
}

interface ComparedCardsProps {
  cards: ComparedCard[];
  side: Side;
  deck: ComparedDeck;
  other: ComparedDeck;
  options: DisplayOptions;
}

function ComparedCards({ cards, side, deck, other, options }: ComparedCardsProps) {
  const [opened, setOpened] = useState<OwnedEntry | null>(null);
  const converted = toOwnedSources(cards, side);
  const byId = new Map<number, ComparedCard>(converted.map((card, index) => [card.id, cards[index]]));
  const boards = useDeckBoards({ entries: converted.map(ownedEntry), sort: options.sort, grouping: options.grouping });
  const visuals = useCardVisuals(converted, options.display);

  function isCommander(entry: OwnedEntry) {
    const totals = comparedStackTotals(entry, byId);
    return (side !== 'other' && totals.commander) || (side !== 'deck' && totals.otherCommander);
  }

  function details(entry: OwnedEntry, long: boolean): ReactNode {
    if (side !== 'both') {
      return null;
    }
    const { quantity, otherQuantity } = comparedStackTotals(entry, byId);
    const differs = quantity !== otherQuantity;
    return (
      <Text
        size={long ? 'sm' : 'xs'}
        fw={differs ? 700 : undefined}
        c={differs ? 'orange' : 'dimmed'}
        lineClamp={1}
        title={`${quantity} dans ${deck.name}, ${otherQuantity} dans ${other.name}`}
      >
        {long
          ? `${quantity} dans ${deck.name} · ${otherQuantity} dans ${other.name}`
          : `${quantity} / ${otherQuantity}`}
      </Text>
    );
  }

  const extras: DeckBoardsExtras<OwnedEntry> = {
    tile: (entry) => ({ props: { commander: isCommander(entry), details: details(entry, false) } }),
  };

  return (
    <Stack>
      {side === 'both' && cards.length > 0 && (
        <Text size="sm" c="dimmed">
          Exemplaires dans {deck.name} / dans {other.name}, en orange quand ils diffèrent.
        </Text>
      )}
      <DeckBoards
        boards={boards}
        display={options.display}
        emptyDeck={
          <Center p="xl">
            <Text c="dimmed">Aucune carte.</Text>
          </Center>
        }
        extras={extras}
        onOpen={setOpened}
      />
      <SharedCardModal
        card={opened}
        imageUrl={opened ? visuals.imageUrl(opened) : undefined}
        details={opened ? details(opened, true) : undefined}
        onClose={() => setOpened(null)}
      />
    </Stack>
  );
}
