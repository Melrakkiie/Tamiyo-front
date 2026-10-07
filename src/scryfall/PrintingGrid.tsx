import { Group, Image, Paper, ScrollArea, SimpleGrid, Text, UnstyledButton } from '@mantine/core';

import { imageUrl, type ScryfallCard } from './client';
import { SetIcon } from './SetIcon';

interface PrintingGridProps {
  printings: ScryfallCard[];
  selectedId?: string | null;
  disabled?: boolean;
  onSelect: (printing: ScryfallCard) => void;
}

export function PrintingGrid({ printings, selectedId, disabled, onSelect }: PrintingGridProps) {
  return (
    <ScrollArea.Autosize mah={360} type="auto">
      <SimpleGrid cols={{ base: 2, sm: 4 }} spacing="xs">
        {printings.map((printing) => (
          <UnstyledButton key={printing.id} onClick={() => onSelect(printing)} disabled={disabled}>
            <Paper
              withBorder
              p={4}
              radius="md"
              style={{
                ...(selectedId === printing.id
                  ? { borderColor: 'var(--mantine-primary-color-filled)', borderWidth: 2 }
                  : {}),
                ...(disabled ? { opacity: 0.5 } : {}),
              }}
            >
              <Image src={imageUrl(printing, 'small')} alt={printing.name} radius="sm" loading="lazy" />
              <Text size="xs" mt={4} lineClamp={1}>
                {printing.set_name}
              </Text>
              <Group gap={4} justify="space-between" align="center" wrap="nowrap">
                <Text size="xs" c="dimmed">
                  {printing.set.toUpperCase()} · #{printing.collector_number} · {printing.released_at.slice(0, 4)}
                </Text>
                <SetIcon setCode={printing.set} size={22} />
              </Group>
            </Paper>
          </UnstyledButton>
        ))}
      </SimpleGrid>
    </ScrollArea.Autosize>
  );
}
