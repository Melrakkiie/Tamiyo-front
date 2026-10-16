import { Popover, Text, UnstyledButton } from '@mantine/core';
import type { ReactNode } from 'react';

import { QuestionIcon } from './Sticker';

interface InfoHintProps {
  label: string;
  children: ReactNode;
}

export function InfoHint({ label, children }: InfoHintProps) {
  return (
    <Popover withArrow shadow="md" width={300} position="bottom-start">
      <Popover.Target>
        <UnstyledButton
          className="tamiyo-sticker tamiyo-info-hint"
          data-tone="prune"
          data-size="xs"
          data-round
          aria-label={label}
        >
          <QuestionIcon />
        </UnstyledButton>
      </Popover.Target>
      <Popover.Dropdown>
        <Text size="sm" component="div">
          {children}
        </Text>
      </Popover.Dropdown>
    </Popover>
  );
}
