import { Box, Collapse, Group, Paper, Portal, SimpleGrid, Stack, Text, UnstyledButton } from '@mantine/core';
import type { ReactNode } from 'react';

import type { Deck } from '../api/types';
import { createDragDrop } from '../layout/dragDrop';
import { capitalize, groupByRecent } from '../layout/groupByRecent';
import { Chevron } from './BoardSection';
import { type FolderLike, type FolderNode, type FolderTree, isInsideFolder } from './folders';

export type FolderDragItem = { kind: 'deck'; deck: Deck } | { kind: 'folder'; folder: FolderLike };

export function FolderIcon({ size = 18 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      style={{ display: 'block', flexShrink: 0 }}
    >
      <path d="M5 4h4l3 3h7a2 2 0 0 1 2 2v8a2 2 0 0 1 -2 2h-14a2 2 0 0 1 -2 -2v-11a2 2 0 0 1 2 -2" />
    </svg>
  );
}

function DragGhost({ item }: { item: FolderDragItem }) {
  return (
    <Paper shadow="lg" px="sm" py={6} radius="md" withBorder>
      <Group gap={6} wrap="nowrap">
        {item.kind === 'folder' && <FolderIcon size={16} />}
        <Text size="sm" fw={500}>
          {item.kind === 'deck' ? item.deck.name : item.folder.name}
        </Text>
      </Group>
    </Paper>
  );
}

const folderDrag = createDragDrop<FolderDragItem>({
  sameItem: (a, b) =>
    a.kind === 'deck'
      ? b.kind === 'deck' && a.deck.id === b.deck.id
      : b.kind === 'folder' && a.folder.id === b.folder.id,
  Ghost: DragGhost,
});

export const FolderDragProvider = folderDrag.DragProvider;
export const DraggableDeck = ({ deck, children }: { deck: Deck; children: ReactNode }) => (
  <folderDrag.Draggable item={{ kind: 'deck', deck }}>{children}</folderDrag.Draggable>
);

export interface FolderMoves {
  folders: FolderLike[];
  moveDeck: (deck: Deck, folderId: number | null) => void;
  moveFolder: (folder: FolderLike, parentId: number | null) => void;
}

function canDrop(moves: FolderMoves, item: FolderDragItem, folderId: number | null) {
  if (item.kind === 'deck') {
    return (item.deck.folder_id ?? null) !== folderId;
  }
  if (item.folder.parent_id === folderId) {
    return false;
  }
  return folderId === null || !isInsideFolder(moves.folders, folderId, item.folder.id);
}

function drop(moves: FolderMoves, item: FolderDragItem, folderId: number | null) {
  if (item.kind === 'deck') {
    moves.moveDeck(item.deck, folderId);
  } else {
    moves.moveFolder(item.folder, folderId);
  }
}

function useFolderDrop(moves: FolderMoves | undefined, folderId: number | null) {
  return folderDrag.useDropTarget(moves ? `folder:${folderId ?? 'root'}` : null, {
    accepts: (item) => !!moves && canDrop(moves, item, folderId),
    onDrop: (item) => moves && drop(moves, item, folderId),
  });
}

interface DeckFormatGroupsProps {
  decks: Deck[];
  renderDeck: (deck: Deck) => ReactNode;
}

export function DeckFormatGroups({ decks, renderDeck }: DeckFormatGroupsProps) {
  return (
    <Stack gap="lg">
      {groupByRecent(decks, (deck) => deck.format, capitalize).map((group) => (
        <Stack key={group.key} gap="xs">
          <Text size="xs" fw={600} c="dimmed" tt="uppercase">
            {group.label} ({group.items.length})
          </Text>
          <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }}>{group.items.map(renderDeck)}</SimpleGrid>
        </Stack>
      ))}
    </Stack>
  );
}

interface FolderTreeViewProps<F extends FolderLike> {
  tree: FolderTree<F>;
  renderDeck: (deck: Deck) => ReactNode;
  isCollapsed: (folder: F) => boolean;
  onToggle: (folder: F) => void;
  menu?: (folder: F) => ReactNode;
  moves?: FolderMoves;
}

export function FolderTreeView<F extends FolderLike>({ tree, renderDeck, ...props }: FolderTreeViewProps<F>) {
  return (
    <Stack gap="xl">
      {tree.roots.length > 0 && (
        <Stack gap="xs">
          {tree.roots.map((node) => (
            <FolderSection key={node.folder.id} node={node} renderDeck={renderDeck} {...props} />
          ))}
        </Stack>
      )}
      <DeckFormatGroups decks={tree.rootDecks} renderDeck={renderDeck} />
      {props.moves && <RootDropBar moves={props.moves} />}
    </Stack>
  );
}

type FolderSectionProps<F extends FolderLike> = Omit<FolderTreeViewProps<F>, 'tree'> & { node: FolderNode<F> };

function FolderSection<F extends FolderLike>({ node, renderDeck, ...props }: FolderSectionProps<F>) {
  const { folder } = node;
  const collapsed = props.isCollapsed(folder);
  const target = useFolderDrop(props.moves, folder.id);
  const header = (
    <Group
      {...target.targetProps}
      gap="xs"
      wrap="nowrap"
      px="xs"
      py={6}
      style={{
        borderRadius: 'var(--mantine-radius-md)',
        outline: target.active ? '2px dashed var(--mantine-color-default-border)' : undefined,
        background: target.over ? 'var(--mantine-primary-color-light)' : undefined,
        transition: 'background 100ms ease',
      }}
    >
      <UnstyledButton
        onClick={() => props.onToggle(folder)}
        aria-expanded={!collapsed}
        style={{ flex: 1, minWidth: 0 }}
      >
        <Group gap="xs" wrap="nowrap">
          <Chevron open={!collapsed} />
          <FolderIcon />
          <Text fw={600} truncate>
            {folder.name}
          </Text>
          <Text size="sm" c="dimmed" style={{ flexShrink: 0 }}>
            ({node.deckCount})
          </Text>
        </Group>
      </UnstyledButton>
      {props.menu?.(folder)}
    </Group>
  );

  return (
    <Stack gap={4}>
      {props.moves ? <folderDrag.Draggable item={{ kind: 'folder', folder }}>{header}</folderDrag.Draggable> : header}
      <Collapse in={!collapsed}>
        <Box ml={20} pl="md" pt={4} pb="sm" style={{ borderLeft: '1px solid var(--mantine-color-default-border)' }}>
          <Stack gap="md">
            {node.children.length > 0 && (
              <Stack gap="xs">
                {node.children.map((child) => (
                  <FolderSection key={child.folder.id} node={child} renderDeck={renderDeck} {...props} />
                ))}
              </Stack>
            )}
            {node.decks.length > 0 && <DeckFormatGroups decks={node.decks} renderDeck={renderDeck} />}
            {node.deckCount === 0 && (
              <Text size="sm" c="dimmed">
                {props.moves ? 'Dossier vide : glisse un deck sur son nom pour le ranger ici.' : 'Dossier vide.'}
              </Text>
            )}
          </Stack>
        </Box>
      </Collapse>
    </Stack>
  );
}

function RootDropBar({ moves }: { moves: FolderMoves }) {
  const target = useFolderDrop(moves, null);
  if (!target.active) {
    return null;
  }
  return (
    <Portal>
      <Box
        pos="fixed"
        top={16}
        left={0}
        right={0}
        px="md"
        style={{ zIndex: 900, display: 'flex', justifyContent: 'center', pointerEvents: 'none' }}
      >
        <Paper
          {...target.targetProps}
          data-no-autoscroll="top"
          radius="md"
          px="xl"
          py="md"
          shadow="xl"
          style={{
            pointerEvents: 'auto',
            background: target.over ? 'rgba(77, 171, 247, 0.35)' : 'rgba(37, 38, 43, 0.95)',
            border: `2px dashed ${target.over ? 'var(--mantine-color-blue-4)' : 'var(--mantine-color-gray-3)'}`,
            color: 'var(--mantine-color-gray-0)',
            cursor: 'grabbing',
          }}
        >
          <Text size="md">Sortir du dossier</Text>
        </Paper>
      </Box>
    </Portal>
  );
}
