import { Box, px, SimpleGrid, Stack, useMantineTheme, useMatches } from '@mantine/core';
import { useElementSize } from '@mantine/hooks';
import { type ReactNode, useLayoutEffect, useRef, useState } from 'react';

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
            pointerEvents: 'none',
          }}
        >
          {row.map((card) => (
            <Box key={card.id} style={{ pointerEvents: 'auto', minWidth: 0 }}>
              {renderTile(card)}
            </Box>
          ))}
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
  columns?: number;
}

export function CardGrid({ display, cards, renderTile, columns: fixedColumns }: CardGridProps) {
  const responsiveColumns = useColumnCount(display.columns);
  const columns = fixedColumns ?? responsiveColumns;
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
  return (
    <SimpleGrid {...display.gridProps} cols={fixedColumns ?? display.gridProps.cols}>
      {cards.map((card) => renderTile(card))}
    </SimpleGrid>
  );
}

function packRows<G extends LayoutGroup>(
  groups: G[],
  columns: number,
  separator: number,
  span: (group: G) => number,
): G[][] {
  const rows: G[][] = [];
  let row: G[] = [];
  let used = 0;
  for (const group of groups) {
    const size = span(group);
    if (row.length > 0 && used + separator + size > columns + 1e-6) {
      rows.push(row);
      row = [];
      used = 0;
    }
    used += row.length > 0 ? separator + size : size;
    row.push(group);
  }
  if (row.length > 0) {
    rows.push(row);
  }
  return rows;
}

function useHeaderWidths() {
  const ref = useRef<HTMLDivElement>(null);
  const [widths, setWidths] = useState<Map<string, number>>(new Map());

  useLayoutEffect(() => {
    const container = ref.current;
    if (!container) {
      return;
    }
    const elements = Array.from(container.children) as HTMLElement[];
    const read = () => {
      const next = new Map(
        elements.map((element) => [element.dataset.key ?? '', Math.ceil(element.getBoundingClientRect().width)]),
      );
      setWidths((previous) =>
        previous.size === next.size && [...next].every(([key, width]) => previous.get(key) === width) ? previous : next,
      );
    };
    read();
    const observer = new ResizeObserver(read);
    elements.forEach((element) => observer.observe(element));
    return () => observer.disconnect();
  });

  return { ref, widths };
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
  const theme = useMantineTheme();
  const { ref, width } = useElementSize();
  const headers = useHeaderWidths();
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

  const cardGap = display.mode === 'grid' ? GAP : Number(px(theme.spacing[display.gridProps.spacing]));
  const groupGap = Number(px(theme.spacing.xl));
  const cardWidth = (width - (columns - 1) * cardGap) / columns;
  const renderGroup = (group: G, packed = false) =>
    wrap(
      group,
      <Stack gap="sm">
        {group.header}
        <Box maw={packed && width > 0 ? group.cards.length * (cardWidth + cardGap) - cardGap : undefined}>
          <CardGrid
            display={display}
            cards={group.cards}
            columns={packed ? group.cards.length : undefined}
            renderTile={(card) => renderTile(card, group)}
          />
        </Box>
      </Stack>,
    );

  if (display.mode === 'text') {
    return (
      <Stack gap="lg">
        {groups.map((group) => (
          <div key={group.key}>{renderGroup(group)}</div>
        ))}
      </Stack>
    );
  }

  const separator = width > 0 ? (groupGap - cardGap) / (cardWidth + cardGap) : 1;
  const headerWidth = (group: G) => headers.widths.get(group.key) ?? 0;
  const span = (group: G) =>
    width > 0
      ? Math.max(group.cards.length, (headerWidth(group) + cardGap) / (cardWidth + cardGap))
      : group.cards.length;
  const groupWidth = (cards: number) =>
    `calc((100% - ${(columns - 1) * cardGap}px) / ${columns} * ${cards} + ${(cards - 1) * cardGap}px)`;

  return (
    <Box pos="relative">
      <div
        ref={headers.ref}
        aria-hidden
        style={{ position: 'absolute', width: 0, height: 0, overflow: 'hidden', visibility: 'hidden' }}
      >
        {groups.map((group) => (
          <div key={group.key} data-key={group.key} style={{ width: 'max-content' }}>
            {group.header}
          </div>
        ))}
      </div>
      <Stack ref={ref} gap="lg">
        {packRows(groups, columns, separator, span).map((row) =>
          row.length === 1 ? (
            <div key={row[0].key}>{renderGroup(row[0])}</div>
          ) : (
            <Box key={row[0].key} style={{ display: 'flex', columnGap: groupGap, alignItems: 'flex-start' }}>
              {row.map((group) => (
                <div
                  key={group.key}
                  style={{ width: groupWidth(group.cards.length), minWidth: headerWidth(group), flexShrink: 0 }}
                >
                  {renderGroup(group, true)}
                </div>
              ))}
            </Box>
          ),
        )}
      </Stack>
    </Box>
  );
}
