import { Alert, Button, Group, NumberInput, Stack, Text } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useState } from 'react';

import { errorMessage } from '../api/errors';
import type { Card, DeckBoard, PendingCard } from '../api/types';
import { useImportIntoDeck } from '../bulk/api';
import { useRemoveCardFromDeck, useRemoveCopiesFromDeck, useRemovePendingCard, useSetPendingQuantity } from './api';
import { deckLineFile } from './AddCopiesToDeckModal';
import { deckListErrorMessage, deckListSummary } from './DeckListInput';

export type QuantitySource =
  | { kind: 'owned'; copyIds: number[]; isCommander: boolean }
  | { kind: 'pending'; item: PendingCard };

interface DeckQuantityControlProps {
  deckId: string;
  card: Card;
  board: DeckBoard;
  source: QuantitySource;
  onChanged: (removedAll: boolean) => void;
}

function copies(count: number) {
  return `${count} exemplaire${count > 1 ? 's' : ''}`;
}

export function DeckQuantityControl({ deckId, card, board, source, onChanged }: DeckQuantityControlProps) {
  const current = source.kind === 'owned' ? source.copyIds.length : source.item.quantity;
  const [value, setValue] = useState<number | string>(current);
  const target = Math.max(0, Math.floor(Number(value)) || 0);
  const difference = target - current;

  const addCopies = useImportIntoDeck();
  const removeOne = useRemoveCardFromDeck();
  const removeCopies = useRemoveCopiesFromDeck();
  const removePending = useRemovePendingCard();
  const setPendingQuantity = useSetPendingQuantity();
  const busy =
    addCopies.isPending ||
    removeOne.isPending ||
    removeCopies.isPending ||
    removePending.isPending ||
    setPendingQuantity.isPending;
  const removeError = removeOne.error ?? removeCopies.error ?? removePending.error ?? setPendingQuantity.error;

  function add(count: number) {
    addCopies.mutate(
      { deckId, file: deckLineFile(card, count, board), commanderFromFirstLine: false },
      {
        onSuccess: (summary) => {
          setValue(current);
          onChanged(false);
          notifications.show({
            color: (summary.cards_skipped ?? 0) > 0 ? 'yellow' : 'green',
            message: `${copies(count)} de ${card.name} ajouté${count > 1 ? 's' : ''} : ${deckListSummary(summary)}.`,
          });
        },
      },
    );
  }

  function remove(count: number) {
    const onSuccess = () => {
      notifications.show({
        color: 'green',
        message: `${copies(count)} de ${card.name} retiré${count > 1 ? 's' : ''} du deck.`,
      });
      onChanged(count >= current);
    };
    if (source.kind === 'pending') {
      if (count >= current) {
        removePending.mutate({ deckId, pendingId: source.item.id }, { onSuccess });
      } else {
        setPendingQuantity.mutate({ deckId, pendingId: source.item.id, quantity: current - count }, { onSuccess });
      }
      return;
    }
    const ids = source.copyIds.slice(source.copyIds.length - count);
    if (ids.length === 1) {
      removeOne.mutate({ deckId, cardId: ids[0], isCommander: source.isCommander }, { onSuccess });
    } else {
      removeCopies.mutate({ deckId, cardIds: ids }, { onSuccess });
    }
  }

  function apply() {
    if (difference > 0) {
      add(difference);
    } else if (difference < 0) {
      remove(-difference);
    }
  }

  return (
    <Stack gap={4}>
      <Group align="flex-end" wrap="nowrap">
        <NumberInput
          label="Quantité dans le deck"
          min={0}
          max={current + 100}
          allowDecimal={false}
          value={value}
          onChange={setValue}
          w={180}
        />
        <Button
          variant={difference < 0 ? 'subtle' : 'light'}
          color={difference < 0 ? 'red' : undefined}
          onClick={apply}
          disabled={difference === 0}
          loading={busy}
        >
          {difference > 0
            ? `Ajouter ${copies(difference)}`
            : difference < 0
              ? target === 0
                ? 'Retirer du deck'
                : `Retirer ${copies(-difference)}`
              : 'Quantité inchangée'}
        </Button>
      </Group>
      <Text size="xs" c="dimmed">
        {source.kind === 'owned'
          ? "Les exemplaires ajoutés viennent de ta collection s'il t'en reste dans cette édition, sinon ils apparaissent à part, en orange. Retirer une carte du deck ne la supprime pas de ta collection."
          : "Les exemplaires ajoutés viennent de ta collection s'il t'en reste dans cette édition, sinon ils restent en orange."}
      </Text>
      {addCopies.error && <Alert color="red">{deckListErrorMessage(addCopies.error)}</Alert>}
      {removeError && <Alert color="red">{errorMessage(removeError)}</Alert>}
    </Stack>
  );
}
