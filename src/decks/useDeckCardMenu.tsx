import { Menu } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useState } from 'react';

import { errorMessage } from '../api/errors';
import type { Deck, DeckBoard } from '../api/types';
import { useImportIntoDeck } from '../bulk/api';
import { useCreateCards } from '../cards/api';
import { CardCopyItems, FoilToggleItem, ProxyToggleItem } from '../cards/CardContextMenu';
import { canPair, commanderEligibility } from '../scryfall/commander';
import { useScryfallCard } from '../scryfall/hooks';
import { AddCopiesToDeckModal, deckLineFile } from './AddCopiesToDeckModal';
import {
  isCommanderFormat,
  useCommitPendingCards,
  useRemoveCardFromDeck,
  useRemovePendingCard,
  useSetPendingQuantity,
  useSwitchFoil,
  useSwitchProxy,
  useUpdateDeck,
} from './api';
import { BOARDS } from './boards';
import { type CommanderSlot, commanderSlotOf, hasCommander, hasPartner, setSlotChanges } from './commanders';
import type { DeckEntry } from './deckEntries';
import { deckListErrorMessage, deckListSummary } from './DeckListInput';
import { SplitPrintingsModal, summaryDetails } from './SplitPrintingsModal';
import type { DeckCardActions } from './useDeckCardActions';

const moveLabels: Record<DeckBoard, string> = {
  main: 'Déplacer dans le deck principal',
  sideboard: 'Déplacer dans le sideboard',
  considering: 'Déplacer dans Considering',
};

function notifyError(err: unknown) {
  notifications.show({ color: 'red', message: errorMessage(err) });
}

export function useDeckCardMenu(deck: Deck, actions: DeckCardActions) {
  const switchFoil = useSwitchFoil();
  const switchProxy = useSwitchProxy();
  const importLine = useImportIntoDeck();
  const removeOwned = useRemoveCardFromDeck();
  const removePending = useRemovePendingCard();
  const setPendingQuantity = useSetPendingQuantity();
  const updateDeck = useUpdateDeck();
  const commit = useCommitPendingCards();
  const createCards = useCreateCards();
  const [otherDeckEntry, setOtherDeckEntry] = useState<DeckEntry | null>(null);
  const [splitEntry, setSplitEntry] = useState<DeckEntry | null>(null);

  const done = (message: string) => ({
    onSuccess: () => notifications.show({ color: 'green', message }),
    onError: notifyError,
  });

  function toggleFoil(card: DeckEntry, foil: boolean) {
    const finish = foil ? 'foil' : 'non-foil';
    switchFoil.mutate(
      card.kind === 'pending'
        ? { deckId: deck.id, pendingIds: [card.pending.id], foil }
        : { deckId: deck.id, cardIds: card.copy_ids, foil },
      {
        onSuccess: (summary) =>
          notifications.show({
            color: 'green',
            message: `${card.name} est maintenant ${finish} dans ce deck${summaryDetails(summary)}. Ta collection n'a pas changé.`,
          }),
        onError: notifyError,
      },
    );
  }

  function toggleProxy(card: DeckEntry, proxy: boolean) {
    const state = proxy ? 'est maintenant proxy' : "n'est plus proxy";
    switchProxy.mutate(
      card.kind === 'pending'
        ? { deckId: deck.id, pendingIds: [card.pending.id], proxy }
        : { deckId: deck.id, cardIds: card.copy_ids, proxy },
      {
        onSuccess: (summary) =>
          notifications.show({
            color: 'green',
            message: `${card.name} ${state} dans ce deck${summaryDetails(summary)}. Ta collection n'a pas changé.`,
          }),
        onError: notifyError,
      },
    );
  }

  function addOne(card: DeckEntry, board: DeckBoard) {
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

  function removeOne(card: DeckEntry) {
    const message = `Un exemplaire de ${card.name} retiré du deck.`;
    if (card.kind === 'owned') {
      const ids = card.copy_ids;
      removeOwned.mutate(
        { deckId: deck.id, cardId: ids[ids.length - 1], commanderSlot: commanderSlotOf(deck, card) },
        done(message),
      );
      return;
    }
    const item = card.pending;
    if (item.quantity > 1) {
      setPendingQuantity.mutate({ deckId: deck.id, pendingId: item.id, quantity: item.quantity - 1 }, done(message));
    } else {
      removePending.mutate({ deckId: deck.id, pendingId: item.id }, done(message));
    }
  }

  function makeCommander(card: DeckEntry, slot: CommanderSlot) {
    const target = card.kind === 'pending' ? { pendingId: card.pending.id } : { cardId: card.id };
    const role = slot === 'commander' ? 'le commandant' : 'le second commandant';
    updateDeck.mutate(
      { id: deck.id, changes: setSlotChanges(slot, target) },
      done(`${card.name} est maintenant ${role} du deck.`),
    );
  }

  function addToCollection(card: DeckEntry) {
    if (card.kind === 'pending') {
      const count = card.quantity;
      commit.mutate(
        { deckId: deck.id, storageId: null, pendingId: card.pending.id },
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

  function setDeckImage(card: DeckEntry) {
    updateDeck.mutate(
      { id: deck.id, changes: { background_scryfall_id: card.scryfall_id } },
      done(`L'illustration de ${card.name} est maintenant celle du deck.`),
    );
  }

  function menuFor(card: DeckEntry, board: DeckBoard, imageUrl: string | undefined) {
    const item = { entry: card, board, tag: null, imageUrl };
    const commander = commanderSlotOf(deck, card) !== null;
    const { quantity } = card;
    return (
      <>
        <FoilToggleItem card={card} onToggle={(foil) => toggleFoil(card, foil)} divider={false} />
        <ProxyToggleItem card={card} onToggle={(proxy) => toggleProxy(card, proxy)} />
        <Menu.Divider />
        {quantity >= 2 && !commander && (
          <Menu.Item onClick={() => setSplitEntry(card)}>Séparer les éditions…</Menu.Item>
        )}
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
          <CommanderItem
            card={card}
            pairWith={hasCommander(deck) && !hasPartner(deck) ? deck.commander_scryfall_id : null}
            onClick={(slot) => makeCommander(card, slot)}
          />
        )}
        <Menu.Item onClick={() => setOtherDeckEntry(card)}>Ajouter à un autre deck</Menu.Item>
        <Menu.Item onClick={() => addToCollection(card)}>
          {card.kind === 'pending' ? 'Ajouter à ma collection' : 'Ajouter un exemplaire à ma collection'}
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
    <>
      <AddCopiesToDeckModal card={otherDeckEntry} excludedDeckId={deck.id} onClose={() => setOtherDeckEntry(null)} />
      <SplitPrintingsModal deckId={deck.id} entry={splitEntry} onClose={() => setSplitEntry(null)} />
    </>
  );

  return { menuFor, modals };
}

interface CommanderItemProps {
  card: DeckEntry;
  pairWith: string | null | undefined;
  onClick: (slot: CommanderSlot) => void;
}

function CommanderItem({ card, pairWith, onClick }: CommanderItemProps) {
  const scryfallCard = useScryfallCard(card.scryfall_id);
  const commander = useScryfallCard(pairWith ?? null);
  if (scryfallCard.isLoading || commander.isLoading) {
    return <Menu.Item disabled>Définir comme commandant</Menu.Item>;
  }
  if (!scryfallCard.data) {
    return null;
  }
  if (commander.data && canPair(commander.data, scryfallCard.data)) {
    return <Menu.Item onClick={() => onClick('partner')}>Définir comme second commandant</Menu.Item>;
  }
  if (commanderEligibility(scryfallCard.data) !== 'eligible') {
    return null;
  }
  return <Menu.Item onClick={() => onClick('commander')}>Définir comme commandant</Menu.Item>;
}
