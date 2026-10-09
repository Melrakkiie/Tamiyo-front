import { Box, Group, Paper, Portal, ScrollArea, Stack, Text, UnstyledButton } from '@mantine/core';
import type { ReactNode } from 'react';

import type { Card } from '../api/types';
import { BOARDS, boardLabels } from './boards';
import { type DragItem, useDraggedCard, useDropTarget } from './dragDrop';
import type { DeckCardActions } from './useDeckCardActions';

function TrashIcon() {
  return (
    <svg
      width={20}
      height={20}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M4 7l16 0" />
      <path d="M10 11l0 6" />
      <path d="M14 11l0 6" />
      <path d="M5 7l1 12a2 2 0 0 0 2 2h8a2 2 0 0 0 2 -2l1 -12" />
      <path d="M9 7v-3a1 1 0 0 1 1 -1h4a1 1 0 0 1 1 1v3" />
    </svg>
  );
}

interface DropZoneProps {
  id: string;
  accepts: (item: DragItem) => boolean;
  onDrop: (item: DragItem) => void;
  danger?: boolean;
  fullWidth?: boolean;
  label: string;
  children: ReactNode;
}

function DropZone({ id, accepts, onDrop, danger = false, fullWidth = false, label, children }: DropZoneProps) {
  const { active, over, targetProps } = useDropTarget(id, { accepts, onDrop });
  if (!active) {
    return null;
  }
  const color = danger ? 'var(--mantine-color-red-4)' : 'var(--mantine-color-gray-3)';
  return (
    <UnstyledButton
      {...targetProps}
      aria-label={label}
      tabIndex={-1}
      px="lg"
      py="sm"
      style={{
        border: `2px dashed ${over ? (danger ? 'var(--mantine-color-red-5)' : 'var(--mantine-color-blue-4)') : color}`,
        borderRadius: 'var(--mantine-radius-md)',
        background: over
          ? danger
            ? 'rgba(250, 82, 82, 0.25)'
            : 'rgba(77, 171, 247, 0.25)'
          : 'rgba(255, 255, 255, 0.06)',
        color: danger ? 'var(--mantine-color-red-4)' : 'var(--mantine-color-gray-0)',
        transform: over ? 'scale(1.05)' : undefined,
        transition: 'transform 100ms ease, background 100ms ease',
        cursor: 'grabbing',
        width: fullWidth ? '100%' : undefined,
        textAlign: fullWidth ? 'center' : undefined,
      }}
    >
      {children}
    </UnstyledButton>
  );
}

function AppliedTag({ tag }: { tag: string }) {
  return (
    <Box
      px="lg"
      py="sm"
      w="100%"
      ta="center"
      style={{
        border: '2px solid transparent',
        borderRadius: 'var(--mantine-radius-md)',
        background: 'rgba(255, 255, 255, 0.03)',
        color: 'var(--mantine-color-gray-6)',
      }}
    >
      <Text size="md" td="line-through" title="Cette carte a déjà ce tag">
        #{tag}
      </Text>
    </Box>
  );
}

interface QuickTagsPanelProps {
  tags: string[];
  dragged: DragItem;
  actions: DeckCardActions;
  tagsOf: (card: Card) => string[];
}

function QuickTagsPanel({ tags, dragged, actions, tagsOf }: QuickTagsPanelProps) {
  const applied = new Set(tagsOf(dragged.card));
  return (
    <Portal>
      <Box
        pos="fixed"
        left={16}
        top="50%"
        w={220}
        style={{ zIndex: 900, transform: 'translateY(-50%)', pointerEvents: 'none' }}
      >
        <Paper
          data-no-autoscroll="side"
          radius="md"
          p="md"
          shadow="xl"
          style={{ pointerEvents: 'auto', background: 'rgba(37, 38, 43, 0.95)' }}
        >
          <Text size="sm" fw={600} c="gray.0" ta="center" mb="sm">
            Tags rapides
          </Text>
          <ScrollArea.Autosize mah="70vh" type="auto" offsetScrollbars>
            <Stack gap="xs">
              {tags.map((tag) =>
                applied.has(tag) ? (
                  <AppliedTag key={tag} tag={tag} />
                ) : (
                  <DropZone
                    key={tag}
                    id={`quick-tag:${tag}`}
                    label={`Ajouter le tag ${tag}`}
                    fullWidth
                    accepts={(item) => !tagsOf(item.card).includes(tag)}
                    onDrop={(item) => actions.addTag(item, tag)}
                  >
                    <Text size="md" lineClamp={1}>
                      #{tag}
                    </Text>
                  </DropZone>
                ),
              )}
            </Stack>
          </ScrollArea.Autosize>
        </Paper>
      </Box>
    </Portal>
  );
}

interface DeckDropBarProps {
  actions: DeckCardActions;
  tagMode: boolean;
  tagsOf: (card: Card) => string[];
  deckTags: string[];
}

export function DeckDropBar({ actions, tagMode, tagsOf, deckTags }: DeckDropBarProps) {
  const dragged = useDraggedCard();
  if (!dragged) {
    return null;
  }
  return (
    <>
      {tagMode && deckTags.length > 0 && (
        <QuickTagsPanel tags={deckTags} dragged={dragged} actions={actions} tagsOf={tagsOf} />
      )}
      <DropBar dragged={dragged} actions={actions} tagMode={tagMode} tagsOf={tagsOf} />
    </>
  );
}

function DropBar({ dragged, actions, tagMode, tagsOf }: Omit<DeckDropBarProps, 'deckTags'> & { dragged: DragItem }) {
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
          data-no-autoscroll="top"
          radius="md"
          p="md"
          shadow="xl"
          style={{ pointerEvents: 'auto', background: 'rgba(37, 38, 43, 0.95)', maxWidth: '100%' }}
        >
          <Stack gap="sm" align="center">
            <Group gap="md" justify="center">
              {BOARDS.map((board) => (
                <DropZone
                  key={board}
                  id={`bar:board:${board}`}
                  label={boardLabels[board]}
                  accepts={(item) => actions.canMoveTo(item, board)}
                  onDrop={(item) => actions.moveToBoard(item, board)}
                >
                  <Text size="md">{boardLabels[board]}</Text>
                </DropZone>
              ))}
              <DropZone
                id="bar:remove"
                label="Retirer du deck"
                danger
                accepts={() => true}
                onDrop={(item) => actions.remove(item)}
              >
                <TrashIcon />
              </DropZone>
              {tagMode && (
                <DropZone
                  id="bar:untag"
                  label="Retirer le tag"
                  accepts={(item) => item.tag !== null}
                  onDrop={(item) => actions.removeTag(item)}
                >
                  <Text size="md">Retirer le tag{dragged.tag ? ` « ${dragged.tag} »` : ''}</Text>
                </DropZone>
              )}
              {tagMode && (
                <DropZone
                  id="bar:untag-all"
                  label="Retirer tous les tags"
                  accepts={(item) => tagsOf(item.card).length > 0}
                  onDrop={(item) => actions.removeAllTags(item)}
                >
                  <Text size="md">Retirer tous les tags</Text>
                </DropZone>
              )}
            </Group>
            {!tagMode && (
              <Text size="sm" c="gray.4">
                Groupe les cartes par tag pour les glisser d'un tag à l'autre.
              </Text>
            )}
          </Stack>
        </Paper>
      </Box>
    </Portal>
  );
}
