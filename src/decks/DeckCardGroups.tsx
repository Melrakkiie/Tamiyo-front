import { Divider, SimpleGrid, Stack, Text, Title, Tooltip } from '@mantine/core';
import type { ReactNode } from 'react';

import type { Card } from '../api/types';
import { copyCount } from '../cards/api';
import { useCardSize } from '../cards/CardSizeControl';
import { type CardGroup, groupCards, sortIntoGroups, typeLabels } from '../cards/grouping';
import type { FaceTypes } from '../scryfall/classify';
import { useCardFaceTypes } from '../scryfall/hooks';
import { StorageIcon } from '../storages/StorageLabel';
import { type DeckCardGrouping, groupByStorage, groupByTag } from './storageGrouping';

interface BackFaceEntry {
  name: string;
  quantity: number;
}

function GroupCount({ label, cards, backFaces }: { label: string; cards: Card[]; backFaces: BackFaceEntry[] }) {
  const count = cards.reduce((total, card) => total + copyCount(card), 0);
  const others = backFaces.reduce((total, entry) => total + entry.quantity, 0);
  if (others === 0) {
    return <>({count})</>;
  }
  return (
    <>
      ({count}{' '}
      <Tooltip
        multiline
        w={320}
        withArrow
        label={
          <Stack gap={4}>
            <Text size="sm" fw={700}>
              Autres {label.toLowerCase()} (au verso)
            </Text>
            {backFaces.map((entry) => (
              <Text key={entry.name} size="sm">
                {entry.quantity} {entry.name}
              </Text>
            ))}
            <Text size="sm" mt={4}>
              Total {label.toLowerCase()} : <strong>{count + others}</strong>
            </Text>
          </Stack>
        }
      >
        <Text span inherit style={{ textDecoration: 'underline dotted', cursor: 'help' }}>
          + {others} autre{others > 1 ? 's' : ''}
        </Text>
      </Tooltip>
      )
    </>
  );
}

export interface DeckCardGrouped {
  groups: CardGroup[];
  backFaces: Map<string, Map<string, number>>;
}

export function useDeckCardGroups(
  stacks: Card[],
  grouping: DeckCardGrouping | null,
  storageNames: Map<number, string> = new Map(),
  tagsOf: (card: Card) => string[] = () => [],
): DeckCardGrouped {
  const faceTypes = useCardFaceTypes(stacks.map((card) => card.scryfall_id));
  const groupedStacks =
    grouping === 'type'
      ? stacks.map((card) => {
          const types: FaceTypes | undefined = faceTypes.data?.[card.scryfall_id];
          return types ? { ...card, card_type: types.front } : card;
        })
      : stacks;
  const backFaces = new Map<string, Map<string, number>>();
  if (grouping === 'type') {
    for (const card of groupedStacks) {
      const types: FaceTypes | undefined = faceTypes.data?.[card.scryfall_id];
      if (types?.back && types.back !== types.front) {
        const label = typeLabels[types.back];
        const entries = backFaces.get(label) ?? new Map<string, number>();
        entries.set(card.name, (entries.get(card.name) ?? 0) + copyCount(card));
        backFaces.set(label, entries);
      }
    }
  }
  const groups =
    grouping === 'storage'
      ? groupByStorage(groupedStacks, storageNames)
      : grouping === 'tag'
        ? groupByTag(groupedStacks, tagsOf)
        : grouping
          ? groupCards(sortIntoGroups(groupedStacks, grouping), grouping)
          : [];
  return { groups, backFaces };
}

interface DeckCardGroupsProps extends DeckCardGrouped {
  gridProps: ReturnType<typeof useCardSize>['gridProps'];
  renderTile: (card: Card) => ReactNode;
}

export function DeckCardGroups({ groups, backFaces, gridProps, renderTile }: DeckCardGroupsProps) {
  return (
    <Stack gap="lg">
      {groups.map((group, index) => (
        <Stack key={`${index}-${group.label}`} gap="sm">
          <Divider
            labelPosition="left"
            label={
              <Title order={4}>
                {group.storage && (
                  <Text span c="dimmed" mr={6} style={{ display: 'inline-block', verticalAlign: '-0.1em' }}>
                    <StorageIcon size={16} />
                  </Text>
                )}
                {group.label}{' '}
                <Text span size="sm" c="dimmed">
                  <GroupCount
                    label={group.label}
                    cards={group.cards}
                    backFaces={[...(backFaces.get(group.label) ?? new Map<string, number>())]
                      .map(([name, quantity]) => ({ name, quantity }))
                      .sort((a, b) => a.name.localeCompare(b.name))}
                  />
                </Text>
              </Title>
            }
          />
          <SimpleGrid {...gridProps}>{group.cards.map(renderTile)}</SimpleGrid>
        </Stack>
      ))}
    </Stack>
  );
}
