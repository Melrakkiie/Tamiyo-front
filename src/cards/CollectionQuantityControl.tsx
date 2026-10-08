import { Alert, Button, Group, NumberInput, Stack, Text } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useState } from 'react';

import { errorMessage } from '../api/errors';
import type { Card } from '../api/types';
import { copyIds, PartialCreationError, useCreateCards, useDeleteCopies } from './api';

function copies(count: number) {
  return `${count} exemplaire${count > 1 ? 's' : ''}`;
}

interface CollectionQuantityControlProps {
  card: Card;
  onChanged: () => void;
}

export function CollectionQuantityControl({ card, onChanged }: CollectionQuantityControlProps) {
  const ids = copyIds(card);
  const current = ids.length;
  const [value, setValue] = useState<number | string>(current);
  const [confirming, setConfirming] = useState(false);
  const target = Math.max(0, Math.floor(Number(value)) || 0);
  const difference = target - current;
  const create = useCreateCards();
  const remove = useDeleteCopies();

  function change(next: number | string) {
    setValue(next);
    setConfirming(false);
  }

  function add(count: number) {
    create.mutate(
      {
        card: {
          name: card.name,
          scryfall_id: card.scryfall_id,
          set_code: card.set_code,
          collector_number: card.collector_number,
          foil: card.foil,
          proxy: card.proxy ?? false,
          storage_id: card.storage_id ?? null,
          mana_value: card.mana_value,
          colors: card.colors,
          card_type: card.card_type,
          color_identity: card.color_identity,
        },
        quantity: count,
      },
      {
        onSuccess: () => {
          notifications.show({
            color: 'green',
            message: `${copies(count)} de ${card.name} ajouté${count > 1 ? 's' : ''} à ta collection.`,
          });
          onChanged();
        },
      },
    );
  }

  function removeCopies(count: number) {
    remove.mutate(ids.slice(ids.length - count), {
      onSuccess: () => {
        notifications.show({
          color: 'green',
          message: `${copies(count)} de ${card.name} supprimé${count > 1 ? 's' : ''} de ta collection.`,
        });
        onChanged();
      },
    });
  }

  function apply() {
    if (difference > 0) {
      add(difference);
    } else if (difference < 0) {
      if (!confirming) {
        setConfirming(true);
        return;
      }
      removeCopies(-difference);
    }
  }

  const error = create.error ?? remove.error;

  return (
    <Stack gap={4}>
      <Group align="flex-end" wrap="nowrap">
        <NumberInput
          label="Quantité dans ta collection"
          min={0}
          max={current + 100}
          allowDecimal={false}
          value={value}
          onChange={change}
          w={200}
        />
        <Button
          variant={difference < 0 ? (confirming ? 'filled' : 'subtle') : 'light'}
          color={difference < 0 ? 'red' : undefined}
          onClick={apply}
          disabled={difference === 0}
          loading={create.isPending || remove.isPending}
        >
          {difference > 0
            ? `Ajouter ${copies(difference)}`
            : difference < 0
              ? confirming
                ? `Confirmer : supprimer ${copies(-difference)}`
                : `Supprimer ${copies(-difference)}`
              : 'Quantité inchangée'}
        </Button>
      </Group>
      <Text size="xs" c="dimmed">
        Les exemplaires ajoutés reprennent l'édition, le foil, le proxy et le rangement de cette carte. Un exemplaire
        supprimé qui était dans un deck y reste entouré en orange, à rajouter à ta collection plus tard.
      </Text>
      {error && (
        <Alert color="red">
          {error instanceof PartialCreationError
            ? `Seuls ${error.created} exemplaires sur ${error.requested} ont pu être ajoutés : ${errorMessage(error.reason)}`
            : errorMessage(error)}
        </Alert>
      )}
    </Stack>
  );
}
