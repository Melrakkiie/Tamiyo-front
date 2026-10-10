import { Box, Collapse, Group, Input, SegmentedControl, Stack, Text, Title, UnstyledButton } from '@mantine/core';
import type { ReactNode } from 'react';

import type { DeckBoard } from '../api/types';
import { boardLabels, boardOptions, type CollapsibleBoard } from './boards';

export function Chevron({ open }: { open: boolean }) {
  return (
    <svg
      width={18}
      height={18}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      style={{ transform: open ? 'rotate(90deg)' : undefined, transition: 'transform 150ms ease' }}
    >
      <path d="M9 6l6 6l-6 6" />
    </svg>
  );
}

interface BoardSectionProps {
  board: CollapsibleBoard;
  count: number;
  collapsed: boolean;
  onToggle: () => void;
  emptyMessage: string;
  children: ReactNode;
}

export function BoardSection({ board, count, collapsed, onToggle, emptyMessage, children }: BoardSectionProps) {
  return (
    <Box pt="md" style={{ borderTop: '1px solid var(--mantine-color-default-border)' }}>
      <Stack gap="md">
        <UnstyledButton onClick={onToggle} aria-expanded={!collapsed}>
          <Group gap="xs" wrap="nowrap">
            <Chevron open={!collapsed} />
            <Title order={3} size="h4">
              {boardLabels[board]}{' '}
              <Text span size="sm" c="dimmed">
                ({count})
              </Text>
            </Title>
          </Group>
        </UnstyledButton>
        <Collapse in={!collapsed}>
          {count === 0 ? (
            <Text size="sm" c="dimmed">
              {emptyMessage}
            </Text>
          ) : (
            children
          )}
        </Collapse>
      </Stack>
    </Box>
  );
}

interface BoardPickerProps {
  label?: string;
  value: DeckBoard;
  onChange: (board: DeckBoard) => void;
  disabled?: boolean;
  description?: string;
}

export function BoardPicker({ label = 'Section', value, onChange, disabled = false, description }: BoardPickerProps) {
  return (
    <Input.Wrapper label={label} description={description}>
      <SegmentedControl
        mt={4}
        fullWidth
        data={boardOptions}
        value={value}
        onChange={(next) => onChange(next as DeckBoard)}
        disabled={disabled}
      />
    </Input.Wrapper>
  );
}
