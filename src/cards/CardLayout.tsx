import { Box, SimpleGrid, Stack, useMatches } from '@mantine/core';
import type { ReactNode } from 'react';

import type { Card } from '../api/types';
import type { CardDisplay } from './CardDisplay';

const CARD_HEIGHT_RATIO = 680 / 488;
const GRID_VISIBLE = 0.42;
const STACK_VISIBLE = 0.125;
const GAP = 8;
const HEADER_HEIGHT = 0.35;

function useColumnCount(columns: number) {
  return useMatches({
    base: Math.min(columns, 2),
    xs: Math.min(columns, 3),
    sm: Math.min(columns, 6),
    md: columns,
  });
}

function overlap(columns: number, visible: number) {
  const width = `((100% - ${(columns - 1) * GAP}px) / ${columns})`;
  return `calc(-1 * ${width} * ${CARD_HEIGHT_RATIO * (1 - visible)})`;
}

function chunk<T>(items: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let start = 0; start < items.length; start += size) {
    chunks.push(items.slice(start, start + size));
  }
  return chunks;
}

function OverlappingGrid({
  cards,
  columns,
  renderTile,
}: {
  cards: Card[];
  columns: number;
  renderTile: (card: Card) => ReactNode;
}) {
  const rows = chunk(cards, columns);
  return (
    <div>
      {rows.map((row, index) => (
        <Box
          key={index}
          style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
            columnGap: GAP,
            marginBottom: index < rows.length - 1 ? overlap(columns, GRID_VISIBLE) : undefined,
            position: 'relative',
          }}
        >
          {row.map((card) => renderTile(card))}
        </Box>
      ))}
    </div>
  );
}

export function CardStack({ cards, renderTile }: { cards: Card[]; renderTile: (card: Card) => ReactNode }) {
  return (
    <div>
      {cards.map((card, index) => (
        <Box
          key={card.id}
          style={{
            marginBottom:
              index < cards.length - 1 ? `calc(-100% * ${CARD_HEIGHT_RATIO * (1 - STACK_VISIBLE)})` : undefined,
            position: 'relative',
          }}
        >
          {renderTile(card)}
        </Box>
      ))}
    </div>
  );
}

interface CardGridProps {
  display: CardDisplay;
  cards: Card[];
  renderTile: (card: Card) => ReactNode;
}

export function CardGrid({ display, cards, renderTile }: CardGridProps) {
  const columns = useColumnCount(display.columns);
  if (display.mode === 'grid') {
    return <OverlappingGrid cards={cards} columns={columns} renderTile={renderTile} />;
  }
  if (display.mode === 'stacks') {
    const perStack = Math.max(1, Math.ceil(cards.length / columns));
    return (
      <SimpleGrid cols={columns} spacing={GAP}>
        {chunk(cards, perStack).map((stack, index) => (
          <CardStack key={index} cards={stack} renderTile={renderTile} />
        ))}
      </SimpleGrid>
    );
  }
  return <SimpleGrid {...display.gridProps}>{cards.map((card) => renderTile(card))}</SimpleGrid>;
}

function stackHeight(cards: number) {
  return HEADER_HEIGHT + CARD_HEIGHT_RATIO * (1 + Math.max(0, cards - 1) * STACK_VISIBLE);
}

function distribute<G extends LayoutGroup>(groups: G[], count: number): G[][] {
  const columns: G[][] = Array.from({ length: count }, () => []);
  const heights = new Array<number>(count).fill(0);
  for (const group of groups) {
    const shortest = heights.indexOf(Math.min(...heights));
    columns[shortest].push(group);
    heights[shortest] += stackHeight(group.cards.length);
  }
  return columns;
}

export interface LayoutGroup {
  key: string;
  header: ReactNode;
  cards: Card[];
  wrap?: (content: ReactNode) => ReactNode;
}

interface CardGroupsLayoutProps<G extends LayoutGroup> {
  display: CardDisplay;
  groups: G[];
  renderTile: (card: Card, group: G) => ReactNode;
}

export function CardGroupsLayout<G extends LayoutGroup>({ display, groups, renderTile }: CardGroupsLayoutProps<G>) {
  const columns = useColumnCount(display.columns);
  const wrap = (group: G, content: ReactNode) => (group.wrap ? group.wrap(content) : content);

  if (display.mode === 'stacks') {
    const stackColumns = Math.max(1, Math.min(columns, groups.length));
    return (
      <Box
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
          columnGap: GAP,
          alignItems: 'start',
        }}
      >
        {distribute(groups, stackColumns).map((column, index) => (
          <Stack key={index} gap="lg">
            {column.map((group) => (
              <div key={group.key}>
                {wrap(
                  group,
                  <Stack gap="xs">
                    {group.header}
                    <CardStack cards={group.cards} renderTile={(card) => renderTile(card, group)} />
                  </Stack>,
                )}
              </div>
            ))}
          </Stack>
        ))}
      </Box>
    );
  }

  return (
    <Stack gap="lg">
      {groups.map((group) => (
        <div key={group.key}>
          {wrap(
            group,
            <Stack gap="sm">
              {group.header}
              <CardGrid display={display} cards={group.cards} renderTile={(card) => renderTile(card, group)} />
            </Stack>,
          )}
        </div>
      ))}
    </Stack>
  );
}
