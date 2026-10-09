import { Button, Group, Menu, Modal, Stack, Text } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useRef, useState } from 'react';

import { errorMessage } from '../api/errors';
import type { Card } from '../api/types';
import { AddCopiesToDeckModal } from '../decks/AddCopiesToDeckModal';
import { copyIds, useCreateCards, useDeleteCopies, useUpdateCopies } from './api';
import { CardCopyItems, FoilToggleItem } from './CardContextMenu';

function copies(count: number) {
  return `${count} exemplaire${count > 1 ? 's' : ''}`;
}

function notifyError(err: unknown) {
  notifications.show({ color: 'red', message: errorMessage(err) });
}

export function useCollectionCardMenu() {
  const updateCopies = useUpdateCopies();
  const createCards = useCreateCards();
  const deleteCopies = useDeleteCopies();
  const [deckCard, setDeckCard] = useState<Card | null>(null);
  const [deleting, setDeleting] = useState<Card | null>(null);
  const lastDeleting = useRef<Card | null>(null);
  if (deleting) {
    lastDeleting.current = deleting;
  }
  const shownDeleting = lastDeleting.current;

  const done = (message: string) => ({
    onSuccess: () => notifications.show({ color: 'green', message }),
    onError: notifyError,
  });

  function toggleFoil(card: Card, foil: boolean) {
    const ids = copyIds(card);
    updateCopies.mutate(
      { ids, changes: { foil } },
      done(
        ids.length > 1
          ? `Les ${ids.length} exemplaires de ${card.name} sont maintenant ${foil ? 'foil' : 'non-foil'}.`
          : `${card.name} est maintenant ${foil ? 'foil' : 'non-foil'}.`,
      ),
    );
  }

  function addOne(card: Card) {
    createCards.mutate(
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
        quantity: 1,
      },
      done(`Un exemplaire de ${card.name} ajouté à ta collection.`),
    );
  }

  function deleteOne(card: Card) {
    const ids = copyIds(card);
    deleteCopies.mutate([ids[ids.length - 1]], done(`Un exemplaire de ${card.name} supprimé de ta collection.`));
  }

  function deleteAll(card: Card) {
    const ids = copyIds(card);
    deleteCopies.mutate(ids, {
      onSuccess: () => {
        notifications.show({
          color: 'green',
          message: `${copies(ids.length)} de ${card.name} supprimé${ids.length > 1 ? 's' : ''} de ta collection.`,
        });
        setDeleting(null);
      },
      onError: notifyError,
    });
  }

  function menuFor(card: Card, imageUrl: string | undefined) {
    return (
      <>
        <FoilToggleItem card={card} onToggle={(foil) => toggleFoil(card, foil)} />
        <Menu.Item onClick={() => addOne(card)}>Ajouter un exemplaire</Menu.Item>
        <Menu.Item onClick={() => deleteOne(card)}>Supprimer un exemplaire</Menu.Item>
        <Menu.Item color="red" onClick={() => setDeleting(card)}>
          Supprimer tous les exemplaires
        </Menu.Item>
        <Menu.Divider />
        <Menu.Item onClick={() => setDeckCard(card)}>Ajouter à un deck</Menu.Item>
        <Menu.Divider />
        <CardCopyItems card={card} imageUrl={imageUrl} />
      </>
    );
  }

  const count = shownDeleting ? copyIds(shownDeleting).length : 0;
  const modals = (
    <>
      <AddCopiesToDeckModal card={deckCard} onClose={() => setDeckCard(null)} />
      <Modal opened={deleting !== null} onClose={() => setDeleting(null)} title="Supprimer de ta collection ?">
        {shownDeleting && (
          <Stack>
            <Text size="sm">
              {count > 1
                ? `Les ${count} exemplaires de ${shownDeleting.name} seront supprimés de ta collection.`
                : `${shownDeleting.name} sera supprimée de ta collection.`}{' '}
              Un exemplaire qui était dans un deck y reste, entouré en orange, à rajouter à ta collection plus tard.
            </Text>
            <Group justify="flex-end">
              <Button variant="default" onClick={() => setDeleting(null)}>
                Annuler
              </Button>
              <Button color="red" onClick={() => deleteAll(shownDeleting)} loading={deleteCopies.isPending}>
                Supprimer
              </Button>
            </Group>
          </Stack>
        )}
      </Modal>
    </>
  );

  return { menuFor, modals };
}
