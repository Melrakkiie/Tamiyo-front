import {
  Alert,
  Anchor,
  Badge,
  Button,
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
import { CardSizeControl, useCardSize } from '../cards/CardSizeControl';
import { CardTile } from '../cards/CardTile';
import { useDeckComparison } from '../decks/api';
import { DeckCardGroups, useDeckCardGroups } from '../decks/DeckCardGroups';
import { compareUrl } from '../decks/CompareDeckModal';
import { sortDeckCards } from '../decks/pendingCards';
import { SharedCardModal } from '../decks/SharedCardModal';
import { type SharedDeckSort, sharedDeckSortOptions } from '../decks/shared';
import { parseSharedGrouping, type SharedCardGrouping, sharedGroupingOptions } from '../decks/storageGrouping';
import { useCardBackImages, useCardImages, useManaCosts } from '../scryfall/hooks';

type Side = 'deck' | 'other' | 'both';

const sideColors: Record<Side, string> = { deck: 'blue', both: 'teal', other: 'grape' };

interface DisplayOptions {
  grouping: SharedCardGrouping | null;
  sort: SharedDeckSort;
  textOnly: boolean;
  gridProps: ReturnType<typeof useCardSize>['gridProps'];
}

export function DeckComparePage() {
  const params = useParams();
  const id = params.id ?? '';
  const otherId = params.otherId ?? '';
  const signedIn = useSession().status === 'authenticated';
  const comparison = useDeckComparison(id, otherId, signedIn);
  const [tab, setTab] = useState<string | null>('common');
  const [sort, setSort] = useState<SharedDeckSort>('mana_value');
  const [grouping, setGrouping] = useState<SharedCardGrouping | null>('type');
  const { size, setSize, textOnly, gridProps } = useCardSize();

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
  const options: DisplayOptions = { grouping, sort, textOnly, gridProps };

  return (
    <Stack>
      <Anchor component={Link} to={`/decks/${deck.id}`} size="sm">
        ← {deck.name}
      </Anchor>

      <Group justify="space-between" align="flex-start">
        <Title order={2}>Comparaison</Title>
        <Button variant="default" component={Link} to={compareUrl(other.id, deck.id)}>
          Inverser
        </Button>
      </Group>

      <SimpleGrid cols={{ base: 1, sm: 2 }}>
        <DeckSummary deck={deck} color={sideColors.deck} />
        <DeckSummary deck={other} color={sideColors.other} />
      </SimpleGrid>

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
        <CardSizeControl value={size} onChange={setSize} />
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
          <Badge variant="light">{deck.format}</Badge>
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

function sideTags(card: ComparedCard, side: Side) {
  switch (side) {
    case 'deck':
      return card.tags;
    case 'other':
      return card.other_tags;
    case 'both':
      return [...new Set([...card.tags, ...card.other_tags])];
  }
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

function toCards(cards: ComparedCard[], side: Side): Card[] {
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
  const [opened, setOpened] = useState<Card | null>(null);
  const converted = toCards(cards, side);
  const byId = new Map(converted.map((card, index) => [card.id, cards[index]]));
  const sorted = sortDeckCards(converted, options.sort);
  const ids = sorted.map((card) => card.scryfall_id);
  const images = useCardImages(ids);
  const backImages = useCardBackImages(ids);
  const manaCosts = useManaCosts(ids);
  const grouped = useDeckCardGroups(sorted, options.grouping, undefined, (card) => {
    const compared = byId.get(card.id);
    return compared ? sideTags(compared, side) : [];
  });

  function isCommander(card: Card) {
    const compared = byId.get(card.id);
    return (
      compared !== undefined &&
      ((side !== 'other' && compared.commander) || (side !== 'deck' && compared.other_commander))
    );
  }

  function details(card: Card, long: boolean): ReactNode {
    const compared = byId.get(card.id);
    if (!compared || side !== 'both') {
      return null;
    }
    const differs = compared.quantity !== compared.other_quantity;
    return (
      <Text
        size={long ? 'sm' : 'xs'}
        fw={differs ? 700 : undefined}
        c={differs ? 'orange' : 'dimmed'}
        lineClamp={1}
        title={`${compared.quantity} dans ${deck.name}, ${compared.other_quantity} dans ${other.name}`}
      >
        {long
          ? `${compared.quantity} dans ${deck.name} · ${compared.other_quantity} dans ${other.name}`
          : `${compared.quantity} / ${compared.other_quantity}`}
      </Text>
    );
  }

  function renderTile(card: Card) {
    return (
      <CardTile
        key={card.id}
        card={card}
        imageUrl={images.data?.[card.scryfall_id]}
        backImageUrl={backImages.data?.[card.scryfall_id]}
        imageLoading={images.isLoading}
        textOnly={options.textOnly}
        commander={isCommander(card)}
        manaCost={manaCosts.isLoading ? undefined : (manaCosts.data?.[card.scryfall_id] ?? null)}
        details={details(card, false)}
        onOpen={setOpened}
      />
    );
  }

  if (cards.length === 0) {
    return (
      <Center p="xl">
        <Text c="dimmed">Aucune carte.</Text>
      </Center>
    );
  }

  return (
    <Stack>
      {side === 'both' && (
        <Text size="sm" c="dimmed">
          Exemplaires dans {deck.name} / dans {other.name}, en orange quand ils diffèrent.
        </Text>
      )}
      {options.grouping ? (
        <DeckCardGroups {...grouped} gridProps={options.gridProps} renderTile={renderTile} />
      ) : (
        <SimpleGrid {...options.gridProps}>{sorted.map(renderTile)}</SimpleGrid>
      )}
      <SharedCardModal
        card={opened}
        imageUrl={opened ? images.data?.[opened.scryfall_id] : undefined}
        details={opened ? details(opened, true) : undefined}
        onClose={() => setOpened(null)}
      />
    </Stack>
  );
}
