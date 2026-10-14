import { Group, Image, Paper, ScrollArea, SimpleGrid, Stack, Text, UnstyledButton } from '@mantine/core';
import { useState } from 'react';

import { PrintingPrice } from '../cards/price';
import { imageUrl, type ScryfallCard } from './client';
import { EditionSearchInput, NoEditionMatch } from './EditionSearchInput';
import { foilFor, matchesEdition } from './printing';
import { SetIcon } from './SetIcon';

interface PrintingGridProps {
  printings: ScryfallCard[];
  selectedId?: string | null;
  disabled?: boolean;
  foil?: boolean;
  onSelect: (printing: ScryfallCard) => void;
}

export function PrintingGrid({ printings, selectedId, disabled, foil = false, onSelect }: PrintingGridProps) {
  const [query, setQuery] = useState('');
  const shown = printings.filter((printing) => matchesEdition(query, printing.set_name, printing.set));

  return (
    <Stack gap="xs">
      <EditionSearchInput value={query} onChange={setQuery} />
      {shown.length === 0 ? (
        <NoEditionMatch />
      ) : (
        <ScrollArea.Autosize mah={360} type="auto">
          <SimpleGrid cols={{ base: 2, sm: 4 }} spacing="xs">
            {shown.map((printing) => (
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
                  <PrintingPrice printing={printing} foil={foilFor(printing, foil)} size="sm" />
                </Paper>
              </UnstyledButton>
            ))}
          </SimpleGrid>
        </ScrollArea.Autosize>
      )}
    </Stack>
  );
}
