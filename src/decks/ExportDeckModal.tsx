import {
  Alert,
  Button,
  Checkbox,
  CopyButton,
  Group,
  Modal,
  SegmentedControl,
  Stack,
  Switch,
  Text,
  Textarea,
} from '@mantine/core';
import { useState } from 'react';

import { errorMessage } from '../api/errors';
import type { DeckBoard } from '../api/types';
import { type DeckExportFormat, deckExportFilenames, saveText, useDeckExport } from '../bulk/api';
import { BOARDS, boardLabels } from './boards';

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
      'Une ligne par édition : « 1 Sol Ring (SLD) 1011 *F* », à importer dans Moxfield. Le commandant en premier, et les tags si tu veux.',
  },
  {
    value: 'arena',
    label: 'MTG Arena',
    description: 'Sections « Commander » et « Deck », une ligne par carte, à coller dans MTG Arena.',
  },
  {
    value: 'tamiyo',
    label: 'Tamiyo',
    description:
      'Le deck complet, à réimporter dans Tamiyo : éditions exactes, foil, sections, commandant, et tags si tu veux.',
  },
  {
    value: 'cardmarket',
    label: 'Cardmarket',
    description: 'Une ligne par carte, à coller dans une liste de souhaits Cardmarket.',
  },
];

type CardmarketCards = 'all' | 'pending';
type CardmarketPrintings = 'name' | 'printings';

const cardmarketCardsOptions: { value: CardmarketCards; label: string }[] = [
  { value: 'all', label: 'Tout le deck' },
  { value: 'pending', label: 'Seulement les cartes en attente' },
];

const cardmarketPrintingsOptions: { value: CardmarketPrintings; label: string }[] = [
  { value: 'name', label: 'Nom de la carte' },
  { value: 'printings', label: 'Éditions précises' },
];

const DEFAULT_CARDMARKET_BOARDS: DeckBoard[] = ['main', 'sideboard'];

function exportNotes(format: DeckExportFormat, shared: boolean, printings: boolean) {
  if (format === 'cardmarket') {
    return printings
      ? "Le nom d'extension vient de Scryfall : si Cardmarket l'écrit autrement, il ignore la ligne. Le foil et les versions (V.1) ne sont pas indiqués."
      : "Cardmarket accepte n'importe quelle édition.";
  }
  const pending = shared
    ? 'Les cartes en attente sont incluses.'
    : 'Les cartes pas encore dans ta collection sont incluses.';
  const boards =
    format === 'arena'
      ? "Le sideboard suit dans sa propre section ; la section Considering n'est pas exportée."
      : format === 'tamiyo'
        ? 'Le sideboard et la section Considering aussi.'
        : 'Le sideboard et la section Considering suivent, chacun dans sa propre section.';
  return `${pending} ${boards}`;
}

interface ExportDeckModalProps {
  deckId: string;
  deckName: string;
  opened: boolean;
  onClose: () => void;
  shared?: boolean;
}

export function ExportDeckModal({ deckId, deckName, opened, onClose, shared = false }: ExportDeckModalProps) {
  const [format, setFormat] = useState<DeckExportFormat>('plain');
  const [withTags, setWithTags] = useState(true);
  const [cardmarketCards, setCardmarketCards] = useState<CardmarketCards>('all');
  const [cardmarketPrintings, setCardmarketPrintings] = useState<CardmarketPrintings>('name');
  const [cardmarketBoards, setCardmarketBoards] = useState<DeckBoard[]>(DEFAULT_CARDMARKET_BOARDS);
  const noBoards = format === 'cardmarket' && cardmarketBoards.length === 0;
  const printings = cardmarketPrintings === 'printings';
  const exported = useDeckExport(
    deckId,
    { format, withTags, onlyPending: cardmarketCards === 'pending', printings, boards: cardmarketBoards },
    opened && !noBoards,
    shared,
  );
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
          {option.description} {exportNotes(format, shared, printings)}
        </Text>
        {format === 'cardmarket' && (
          <Stack gap="xs">
            <SegmentedControl
              fullWidth
              aria-label="Cartes exportées"
              data={cardmarketCardsOptions}
              value={cardmarketCards}
              onChange={(value) => setCardmarketCards(value as CardmarketCards)}
            />
            <SegmentedControl
              fullWidth
              aria-label="Éditions"
              data={cardmarketPrintingsOptions}
              value={cardmarketPrintings}
              onChange={(value) => setCardmarketPrintings(value as CardmarketPrintings)}
            />
            <Checkbox.Group
              value={cardmarketBoards}
              onChange={(value) => setCardmarketBoards(value as DeckBoard[])}
              label="Sections exportées"
              error={noBoards ? 'Choisis au moins une section.' : undefined}
            >
              <Group gap="md" mt={4}>
                {BOARDS.map((board) => (
                  <Checkbox key={board} value={board} label={boardLabels[board]} />
                ))}
              </Group>
            </Checkbox.Group>
          </Stack>
        )}
        {(format === 'tamiyo' || format === 'moxfield') && (
          <Switch
            label="Inclure les tags"
            checked={withTags}
            onChange={(event) => setWithTags(event.currentTarget.checked)}
          />
        )}
        {exported.error ? (
          <Alert color="red">
            {errorMessage(exported.error, {
              502: "Scryfall ne répond pas, les noms d'extension sont indisponibles : réessaie, ou exporte seulement les noms.",
            })}
          </Alert>
        ) : (
          <Textarea
            aria-label="Texte exporté"
            value={noBoards ? '' : exported.isLoading ? 'Chargement…' : text}
            placeholder="Aucune carte à exporter."
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
