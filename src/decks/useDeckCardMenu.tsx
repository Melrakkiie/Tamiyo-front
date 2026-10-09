import { Menu } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useState } from 'react';

import { errorMessage } from '../api/errors';
import type { Card, Deck, DeckBoard, PendingCard } from '../api/types';
import { useImportIntoDeck } from '../bulk/api';
import { copyIds, useCreateCards, useUpdateCopies } from '../cards/api';
import { CardCopyItems, FoilToggleItem } from '../cards/CardContextMenu';
import { commanderEligibility } from '../scryfall/commander';
import { useScryfallCard } from '../scryfall/hooks';
import { AddCopiesToDeckModal, deckLineFile } from './AddCopiesToDeckModal';
import {
  isCommanderFormat,
  useCommitPendingCards,
  useRemoveCardFromDeck,
  useRemovePendingCard,
  useReplacePendingCard,
  useSetPendingQuantity,
  useUpdateDeck,
} from './api';
import { BOARDS } from './boards';
import { deckListErrorMessage, deckListSummary } from './DeckListInput';
import { isPendingCard, pendingIdOf } from './pendingCards';
import type { DeckCardActions } from './useDeckCardActions';

const moveLabels: Record<DeckBoard, string> = {
  main: 'Déplacer dans le deck principal',
  sideboard: 'Déplacer dans le sideboard',
  considering: 'Déplacer dans Considering',
};

function notifyError(err: unknown) {
  notifications.show({ color: 'red', message: errorMessage(err) });
}

export function useDeckCardMenu(deck: Deck, pendingItems: PendingCard[], actions: DeckCardActions) {
  const updateCopies = useUpdateCopies();
  const replacePending = useReplacePendingCard();
  const importLine = useImportIntoDeck();
  const removeOwned = useRemoveCardFromDeck();
  const removePending = useRemovePendingCard();
  const setPendingQuantity = useSetPendingQuantity();
  const updateDeck = useUpdateDeck();
  const commit = useCommitPendingCards();
  const createCards = useCreateCards();
  const [otherDeckCard, setOtherDeckCard] = useState<Card | null>(null);

  const pendingOf = (card: Card) => pendingItems.find((item) => item.id === pendingIdOf(card));
  const isCommander = (card: Card) =>
    isPendingCard(card) ? pendingIdOf(card) === deck.commander_pending_id : card.id === deck.commander_id;
  const done = (message: string) => ({
    onSuccess: () => notifications.show({ color: 'green', message }),
    onError: notifyError,
  });

  function toggleFoil(card: Card, foil: boolean) {
    const message = `${card.name} est maintenant ${foil ? 'foil' : 'non-foil'}.`;
    if (!isPendingCard(card)) {
      updateCopies.mutate({ ids: copyIds(card), changes: { foil } }, done(message));
      return;
    }
    const item = pendingOf(card);
    if (item) {
      replacePending.mutate(
        {
          deckId: deck.id,
          from: item,
          isCommander: isCommander(card),
          card: {
            name: item.name,
            scryfall_id: item.scryfall_id,
            set_code: item.set_code,
            collector_number: item.collector_number,
            foil,
            quantity: item.quantity,
            mana_value: item.mana_value,
            colors: item.colors,
            card_type: item.card_type,
            color_identity: item.color_identity,
          },
        },
        done(message),
      );
    }
  }

  function addOne(card: Card, board: DeckBoard) {
    importLine.mutate(
      { deckId: deck.id, file: deckLineFile(card, 1, board), commanderFromFirstLine: false },
      {
        onSuccess: (summary) =>
          notifications.show({
            color: (summary.cards_skipped ?? 0) > 0 ? 'yellow' : 'green',
            message: `${card.name} ajoutée : ${deckListSummary(summary)}.`,
          }),
        onError: (err) => notifications.show({ color: 'red', message: deckListErrorMessage(err) }),
      },
    );
  }

  function removeOne(card: Card) {
    const message = `Un exemplaire de ${card.name} retiré du deck.`;
    if (!isPendingCard(card)) {
      const ids = copyIds(card);
      removeOwned.mutate(
        { deckId: deck.id, cardId: ids[ids.length - 1], isCommander: isCommander(card) },
        done(message),
      );
      return;
    }
    const item = pendingOf(card);
    if (!item) {
      return;
    }
    if (item.quantity > 1) {
      setPendingQuantity.mutate({ deckId: deck.id, pendingId: item.id, quantity: item.quantity - 1 }, done(message));
    } else {
      removePending.mutate({ deckId: deck.id, pendingId: item.id }, done(message));
    }
  }

  function makeCommander(card: Card) {
    const changes = isPendingCard(card) ? { commander_pending_id: pendingIdOf(card) } : { commander_id: card.id };
    updateDeck.mutate({ id: deck.id, changes }, done(`${card.name} est maintenant le commandant du deck.`));
  }

  function addToCollection(card: Card) {
    if (isPendingCard(card)) {
      const count = card.quantity ?? 1;
      commit.mutate(
        { deckId: deck.id, storageId: null, pendingId: pendingIdOf(card) },
        done(
          count > 1
            ? `${count} exemplaires de ${card.name} ajoutés à ta collection, sans rangement.`
            : `${card.name} ajoutée à ta collection, sans rangement.`,
        ),
      );
      return;
    }
    createCards.mutate(
      {
        card: {
          name: card.name,
          scryfall_id: card.scryfall_id,
          set_code: card.set_code,
          collector_number: card.collector_number,
          foil: card.foil,
          proxy: false,
          storage_id: null,
          mana_value: card.mana_value,
          colors: card.colors,
          card_type: card.card_type,
          color_identity: card.color_identity,
        },
        quantity: 1,
      },
      done(`Un exemplaire de plus de ${card.name} dans ta collection, hors de ce deck.`),
    );
  }

  function setDeckImage(card: Card) {
    updateDeck.mutate(
      { id: deck.id, changes: { background_scryfall_id: card.scryfall_id } },
      done(`L'illustration de ${card.name} est maintenant celle du deck.`),
    );
  }

  function menuFor(card: Card, board: DeckBoard, imageUrl: string | undefined) {
    const item = { card, board, tag: null, imageUrl };
    const commander = isCommander(card);
    const quantity = card.quantity ?? 1;
    return (
      <>
        <FoilToggleItem card={card} onToggle={(foil) => toggleFoil(card, foil)} />
        <Menu.Item onClick={() => addOne(card, board)}>Ajouter un exemplaire</Menu.Item>
        <Menu.Item onClick={() => removeOne(card)} disabled={commander && quantity <= 1}>
          Retirer un exemplaire
        </Menu.Item>
        <Menu.Item color="red" onClick={() => actions.remove(item)} disabled={commander}>
          Retirer tous les exemplaires
        </Menu.Item>
        <Menu.Divider />
        {BOARDS.filter((target) => target !== board).map((target) => (
          <Menu.Item key={target} onClick={() => actions.moveToBoard(item, target)} disabled={commander}>
            {moveLabels[target]}
          </Menu.Item>
        ))}
        {isCommanderFormat(deck.format) && !commander && board === 'main' && (
          <CommanderItem card={card} onClick={() => makeCommander(card)} />
        )}
        <Menu.Item onClick={() => setOtherDeckCard(card)}>Ajouter à un autre deck</Menu.Item>
        <Menu.Item onClick={() => addToCollection(card)}>
          {isPendingCard(card) ? 'Ajouter à ma collection' : 'Ajouter un exemplaire à ma collection'}
        </Menu.Item>
        <Menu.Divider />
        <CardCopyItems card={card} imageUrl={imageUrl} />
        <Menu.Item onClick={() => setDeckImage(card)} disabled={deck.background_scryfall_id === card.scryfall_id}>
          Utiliser comme image du deck
        </Menu.Item>
      </>
    );
  }

  const modals = (
    <AddCopiesToDeckModal card={otherDeckCard} excludedDeckId={deck.id} onClose={() => setOtherDeckCard(null)} />
  );

  return { menuFor, modals };
}

function CommanderItem({ card, onClick }: { card: Card; onClick: () => void }) {
  const scryfallCard = useScryfallCard(card.scryfall_id);
  const eligibility = scryfallCard.data ? commanderEligibility(scryfallCard.data) : null;
  if (scryfallCard.isLoading) {
    return <Menu.Item disabled>Définir comme commandant</Menu.Item>;
  }
  if (eligibility !== 'eligible') {
    return null;
  }
  return <Menu.Item onClick={onClick}>Définir comme commandant</Menu.Item>;
}
