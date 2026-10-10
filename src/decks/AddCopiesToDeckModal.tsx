import { Alert, Button, Group, Modal, NumberInput, Select, Stack, Text } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useRef, useState } from 'react';

import type { Card, DeckBoard } from '../api/types';
import { useImportIntoDeck } from '../bulk/api';
import { useAllDecks } from './api';
import { withBoardHeader } from './boards';
import { BoardPicker } from './BoardSection';
import { deckListErrorMessage, deckListSummary } from './DeckListInput';

const MAX_COPIES = 100;

type DeckLinePrinting = Pick<Card, 'name' | 'set_code' | 'collector_number' | 'foil'>;

export function deckLine(card: DeckLinePrinting, count: number, board: DeckBoard) {
  return withBoardHeader(
    `${count} ${card.name} (${card.set_code}) ${card.collector_number}${card.foil ? ' *F*' : ''}\n`,
    board,
  );
}

export function deckLineFile(card: DeckLinePrinting, count: number, board: DeckBoard) {
  return new File([deckLine(card, count, board)], 'deck.txt', { type: 'text/plain' });
}

interface AddCopiesToDeckModalProps {
  card: Card | null;
  excludedDeckId?: string;
  onClose: () => void;
}

export function AddCopiesToDeckModal({ card, excludedDeckId, onClose }: AddCopiesToDeckModalProps) {
  const lastShown = useRef<Card | null>(null);
  if (card) {
    lastShown.current = card;
  }
  const shown = lastShown.current;
  return (
    <Modal opened={card !== null} onClose={onClose} title={shown ? `Ajouter ${shown.name} à un deck` : undefined}>
      {shown && <AddCopiesForm key={shown.id} card={shown} excludedDeckId={excludedDeckId} onClose={onClose} />}
    </Modal>
  );
}

function AddCopiesForm({
  card,
  excludedDeckId,
  onClose,
}: {
  card: Card;
  excludedDeckId?: string;
  onClose: () => void;
}) {
  const decks = useAllDecks();
  const add = useImportIntoDeck();
  const [deckId, setDeckId] = useState<string | null>(null);
  const [board, setBoard] = useState<DeckBoard>('main');
  const [count, setCount] = useState<number | string>(1);
  const options = [...(decks.data ?? [])]
    .filter((deck) => deck.id !== excludedDeckId)
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((deck) => ({ value: deck.id, label: deck.name }));

  function submit() {
    if (!deckId) {
      return;
    }
    const copies = Math.min(MAX_COPIES, Math.max(1, Math.floor(Number(count)) || 1));
    const deckName = options.find((option) => option.value === deckId)?.label ?? 'le deck';
    add.mutate(
      { deckId, file: deckLineFile(card, copies, board), commanderFromFirstLine: false },
      {
        onSuccess: (summary) => {
          notifications.show({
            color: (summary.cards_skipped ?? 0) > 0 ? 'yellow' : 'green',
            message: `${card.name} ajoutée à ${deckName} : ${deckListSummary(summary)}.`,
          });
          onClose();
        },
      },
    );
  }

  return (
    <Stack>
      <Select
        label="Deck"
        placeholder={decks.isLoading ? 'Chargement…' : 'Choisis un deck'}
        data={options}
        value={deckId}
        onChange={setDeckId}
        searchable
        nothingFoundMessage="Aucun deck"
        data-autofocus
      />
      <BoardPicker value={board} onChange={setBoard} />
      <NumberInput
        label="Exemplaires"
        min={1}
        max={MAX_COPIES}
        allowDecimal={false}
        value={count}
        onChange={setCount}
        w={160}
      />
      <Text size="xs" c="dimmed">
        Les exemplaires viennent de ta collection s'il t'en reste de libres dans cette édition, sinon ils sont ajoutés
        en attente.
      </Text>
      {add.error && <Alert color="red">{deckListErrorMessage(add.error)}</Alert>}
      <Group justify="flex-end">
        <Button variant="default" onClick={onClose}>
          Annuler
        </Button>
        <Button onClick={submit} disabled={!deckId} loading={add.isPending}>
          Ajouter
        </Button>
      </Group>
    </Stack>
  );
}
