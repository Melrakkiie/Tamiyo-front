import { Alert, Button, Grid, Group, Modal, Select, Stack, Switch, Text, Title } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useRef, useState } from 'react';

import { errorMessage } from '../api/errors';
import type { Card } from '../api/types';
import { useStorageOptions } from '../storages/api';
import { useDeleteCard, useUpdateCard } from './api';
import { CardImage } from './CardImage';

interface CardDetailModalProps {
  card: Card | null;
  imageUrl: string | undefined;
  onClose: () => void;
}

export function CardDetailModal({ card, imageUrl, onClose }: CardDetailModalProps) {
  const lastShown = useRef<{ card: Card; imageUrl: string | undefined } | null>(null);
  if (card) {
    lastShown.current = { card, imageUrl };
  }
  const shown = lastShown.current;

  return (
    <Modal opened={card !== null} onClose={onClose} title={shown?.card.name} size="lg">
      {shown && (
        <CardDetail key={shown.card.id} card={shown.card} imageUrl={shown.imageUrl} onClose={onClose} />
      )}
    </Modal>
  );
}

function CardDetail({ card, imageUrl, onClose }: { card: Card; imageUrl: string | undefined; onClose: () => void }) {
  const storageOptions = useStorageOptions();
  const [foil, setFoil] = useState(card.foil);
  const [storageId, setStorageId] = useState<string | null>(card.storage_id ? String(card.storage_id) : null);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  const update = useUpdateCard();
  const remove = useDeleteCard();

  const storageChanged = storageId !== (card.storage_id ? String(card.storage_id) : null);
  const changed = foil !== card.foil || storageChanged;

  function save() {
    update.mutate(
      {
        id: card.id,
        changes: {
          ...(foil !== card.foil ? { foil } : {}),
          ...(storageChanged ? { storage_id: storageId ? Number(storageId) : null } : {}),
        },
      },
      {
        onSuccess: () => {
          notifications.show({ color: 'green', message: 'Carte mise à jour.' });
          onClose();
        },
      },
    );
  }

  function deleteCard() {
    remove.mutate(card.id, {
      onSuccess: () => {
        notifications.show({ color: 'green', message: `${card.name} a été supprimée de ta collection.` });
        onClose();
      },
    });
  }

  const error = update.error ?? remove.error;

  return (
    <Grid gutter="lg">
      <Grid.Col span={{ base: 12, sm: 5 }}>
        <CardImage name={card.name} url={imageUrl} loading={false} />
      </Grid.Col>
      <Grid.Col span={{ base: 12, sm: 7 }}>
        <Stack>
          <div>
            <Title order={3} size="h4">
              {card.name}
            </Title>
            <Text size="sm" c="dimmed">
              {card.set_code.toUpperCase()} · #{card.collector_number} · coût de mana {card.mana_value}
            </Text>
          </div>

          {error && <Alert color="red">{errorMessage(error)}</Alert>}

          <Switch label="Foil" checked={foil} onChange={(event) => setFoil(event.currentTarget.checked)} />

          <Select
            label="Rangement"
            placeholder="Aucun rangement"
            data={storageOptions}
            value={storageId}
            onChange={setStorageId}
            clearable
            searchable
          />

          <Group justify="space-between" mt="sm">
            {confirmingDelete ? (
              <Group gap="xs">
                <Button color="red" onClick={deleteCard} loading={remove.isPending}>
                  Confirmer la suppression
                </Button>
                <Button variant="default" onClick={() => setConfirmingDelete(false)}>
                  Annuler
                </Button>
              </Group>
            ) : (
              <Button color="red" variant="subtle" onClick={() => setConfirmingDelete(true)}>
                Supprimer
              </Button>
            )}
            <Button onClick={save} disabled={!changed} loading={update.isPending}>
              Enregistrer
            </Button>
          </Group>
        </Stack>
      </Grid.Col>
    </Grid>
  );
}
