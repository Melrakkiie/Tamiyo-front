import { Alert, Button, Group, NumberInput, Stack, Text } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useState } from 'react';

import { errorMessage } from '../api/errors';
import type { DeckEntry } from './deckEntries';
import { deckListErrorMessage, deckListSummary } from './DeckListInput';
import type { PlanDeck } from './entryMutations/requests';
import { useDeckEntryMutations } from './entryMutations/useDeckEntryMutations';

interface DeckQuantityControlProps {
  deck: PlanDeck;
  entry: DeckEntry;
  onChanged: (removedAll: boolean) => void;
}

function copies(count: number) {
  return `${count} exemplaire${count > 1 ? 's' : ''}`;
}

export function DeckQuantityControl({ deck, entry, onChanged }: DeckQuantityControlProps) {
  const current = entry.quantity;
  const [value, setValue] = useState<number | string>(current);
  const [adding, setAdding] = useState(false);
  const target = Math.max(0, Math.floor(Number(value)) || 0);
  const difference = target - current;
  const mutations = useDeckEntryMutations(deck);

  async function apply() {
    setAdding(difference > 0);
    let result;
    try {
      result = await mutations.run(entry, { kind: 'setQuantity', quantity: target });
    } catch {
      return;
    }
    const count = result.affected;
    if (result.summary) {
      const { summary } = result;
      setValue(current);
      onChanged(false);
      notifications.show({
        color: (summary.cards_skipped ?? 0) > 0 ? 'yellow' : 'green',
        message: `${copies(count)} de ${entry.name} ajouté${count > 1 ? 's' : ''} : ${deckListSummary(summary)}.`,
      });
    } else {
      notifications.show({
        color: 'green',
        message: `${copies(count)} de ${entry.name} retiré${count > 1 ? 's' : ''} du deck.`,
      });
      onChanged(result.entry === null);
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
          loading={mutations.isPending}
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
        {entry.kind === 'owned'
          ? "Les exemplaires ajoutés viennent de ta collection s'il t'en reste dans cette édition, sinon ils apparaissent à part, en orange. Retirer une carte du deck ne la supprime pas de ta collection."
          : "Les exemplaires ajoutés viennent de ta collection s'il t'en reste dans cette édition, sinon ils restent en orange."}
      </Text>
      {mutations.error && (
        <Alert color="red">{adding ? deckListErrorMessage(mutations.error) : errorMessage(mutations.error)}</Alert>
      )}
    </Stack>
  );
}
