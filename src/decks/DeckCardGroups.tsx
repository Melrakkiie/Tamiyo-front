import { Box, Stack, Text, Tooltip } from '@mantine/core';
import type { ReactNode } from 'react';

import type { Card } from '../api/types';
import { totalCopies } from '../cards/copies';
import type { CardDisplay } from '../cards/CardDisplay';
import { CardGroupsLayout } from '../cards/CardLayout';
import { SectionTitle } from '../theme/SectionTitle';
import type { CardGroup } from '../cards/grouping';
import type { BackFaceEntry } from './boardLayout';
import { type DragItem, useDropTarget } from './dragDrop';
import { StorageIcon } from '../storages/StorageLabel';

function GroupCount({ label, cards, backFaces }: { label: string; cards: Card[]; backFaces: BackFaceEntry[] }) {
  const count = totalCopies(cards);
  if (backFaces.length === 0) {
    return <>{count}</>;
  }
  return (
    <>
      {count} <BackFacesExtra label={label} count={count} backFaces={backFaces} />
    </>
  );
}

interface BackFacesExtraProps {
  label: string;
  count: number;
  backFaces: BackFaceEntry[];
}

export function BackFacesExtra({ label, count, backFaces }: BackFacesExtraProps) {
  const others = backFaces.reduce((total, entry) => total + entry.quantity, 0);
  if (others === 0) {
    return null;
  }
  return (
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
  );
}

export interface GroupDrop {
  id: (group: CardGroup) => string | null;
  accepts: (group: CardGroup, item: DragItem) => boolean;
  onDrop: (group: CardGroup, item: DragItem) => void;
}

function GroupDropArea({ group, drop, children }: { group: CardGroup; drop?: GroupDrop; children: ReactNode }) {
  const { active, over, targetProps } = useDropTarget(drop ? drop.id(group) : null, {
    accepts: (item) => drop?.accepts(group, item) ?? false,
    onDrop: (item) => drop?.onDrop(group, item),
  });
  return (
    <Box {...targetProps} className={active ? 'tamiyo-drop-area' : undefined} data-over={over || undefined}>
      {children}
    </Box>
  );
}

interface DeckCardGroupsProps {
  groups: CardGroup[];
  backFaces: Map<string, BackFaceEntry[]>;
  display: CardDisplay;
  renderTile: (card: Card, group: CardGroup) => ReactNode;
  drop?: GroupDrop;
}

export function DeckCardGroups({ groups, backFaces, display, renderTile, drop }: DeckCardGroupsProps) {
  const layoutGroups = groups.map((group, index) => ({
    key: `${index}-${group.label}`,
    group,
    cards: group.cards,
    wrap: (content: ReactNode) => (
      <GroupDropArea group={group} drop={drop}>
        {content}
      </GroupDropArea>
    ),
    header: (
      <SectionTitle
        count={<GroupCount label={group.label} cards={group.cards} backFaces={backFaces.get(group.label) ?? []} />}
      >
        {group.storage && (
          <Text span c="dimmed" mr={6} style={{ display: 'inline-block', verticalAlign: '-0.1em' }}>
            <StorageIcon size={16} />
          </Text>
        )}
        {group.label}
      </SectionTitle>
    ),
  }));
  return (
    <CardGroupsLayout
      display={display}
      groups={layoutGroups}
      renderTile={(card, layoutGroup) => renderTile(card, layoutGroup.group)}
    />
  );
}
