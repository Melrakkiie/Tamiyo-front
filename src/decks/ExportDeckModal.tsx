import { Alert, Button, CopyButton, Group, Modal, SegmentedControl, Stack, Text, Textarea } from '@mantine/core';
import { useState } from 'react';

import { errorMessage } from '../api/errors';
import { type DeckExportFormat, deckExportFilenames, saveText, useDeckExport } from '../bulk/api';

const formats: { value: DeckExportFormat; label: string; description: string }[] = [
  {
    value: 'plain',
    label: 'Liste simple',
    description: 'Une ligne par carte, sans édition : « 4 Lightning Bolt ». Le commandant en premier.',
  },
  {
    value: 'moxfield',
    label: 'Moxfield',
    description:
      'Une ligne par édition : « 1 Sol Ring (SLD) 1011 *F* », à importer dans Moxfield. Le commandant en premier.',
  },
  {
    value: 'arena',
    label: 'MTG Arena',
    description: 'Sections « Commander » et « Deck », une ligne par carte, à coller dans MTG Arena.',
  },
];

interface ExportDeckModalProps {
  deckId: string;
  deckName: string;
  opened: boolean;
  onClose: () => void;
}

export function ExportDeckModal({ deckId, deckName, opened, onClose }: ExportDeckModalProps) {
  const [format, setFormat] = useState<DeckExportFormat>('plain');
  const exported = useDeckExport(deckId, format, opened);
  const text = exported.data ?? '';
  const option = formats.find((candidate) => candidate.value === format) ?? formats[0];

  return (
    <Modal opened={opened} onClose={onClose} title={`Exporter ${deckName}`} size="lg">
      <Stack>
        <SegmentedControl
          data={formats.map(({ value, label }) => ({ value, label }))}
          value={format}
          onChange={(value) => setFormat(value as DeckExportFormat)}
          fullWidth
        />
        <Text size="xs" c="dimmed">
          {option.description} Les cartes pas encore dans ta collection sont incluses.
        </Text>
        {exported.error ? (
          <Alert color="red">{errorMessage(exported.error)}</Alert>
        ) : (
          <Textarea
            aria-label="Texte exporté"
            value={exported.isLoading ? 'Chargement…' : text}
            readOnly
            autosize
            minRows={10}
            maxRows={18}
            onFocus={(event) => event.currentTarget.select()}
            styles={{ input: { fontFamily: 'var(--mantine-font-family-monospace)' } }}
          />
        )}
        <Group justify="flex-end">
          <Button variant="default" onClick={() => saveText(text, deckExportFilenames[format])} disabled={!text}>
            Télécharger
          </Button>
          <CopyButton value={text}>
            {({ copied, copy }) => (
              <Button color={copied ? 'teal' : undefined} onClick={copy} disabled={!text}>
                {copied ? 'Copié' : 'Copier'}
              </Button>
            )}
          </CopyButton>
        </Group>
      </Stack>
    </Modal>
  );
}
