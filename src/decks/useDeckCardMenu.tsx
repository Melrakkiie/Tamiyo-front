import { Menu } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useState } from 'react';

import { errorMessage } from '../api/errors';
import type { Deck, DeckBoard } from '../api/types';
import { useImportIntoDeck } from '../bulk/api';
import { useCreateCards } from '../cards/api';
import { CardCopyItems, FoilToggleItem, ProxyToggleItem, type ShownFace } from '../cards/CardContextMenu';
import type { CardFace } from '../scryfall/client';
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
import { type ArtChoice, backArtChoice } from './art';
import { BOARDS } from './boards';
import { type CommanderSlot, commanderSlotOf, hasCommander, hasPartner, setSlotChanges } from './commanders';
import { type DeckEntry, entrySlotTarget, entrySources } from './deckEntries';
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

  function toggleFoil(entry: DeckEntry, foil: boolean) {
    const finish = foil ? 'foil' : 'non-foil';
    switchFoil.mutate(
      { deckId: deck.id, ...entrySources(entry), foil },
      {
        onSuccess: (summary) =>
          notifications.show({
            color: 'green',
            message: `${entry.name} est maintenant ${finish} dans ce deck${summaryDetails(summary)}. Ta collection n'a pas changé.`,
          }),
        onError: notifyError,
      },
    );
  }

  function toggleProxy(entry: DeckEntry, proxy: boolean) {
    const state = proxy ? 'est maintenant proxy' : "n'est plus proxy";
    switchProxy.mutate(
      { deckId: deck.id, ...entrySources(entry), proxy },
      {
        onSuccess: (summary) =>
          notifications.show({
            color: 'green',
            message: `${entry.name} ${state} dans ce deck${summaryDetails(summary)}. Ta collection n'a pas changé.`,
          }),
        onError: notifyError,
      },
    );
  }

  function addOne(entry: DeckEntry, board: DeckBoard) {
    importLine.mutate(
      { deckId: deck.id, file: deckLineFile(entry, 1, board), commanderFromFirstLine: false },
      {
        onSuccess: (summary) =>
          notifications.show({
            color: (summary.cards_skipped ?? 0) > 0 ? 'yellow' : 'green',
            message: `${entry.name} ajoutée : ${deckListSummary(summary)}.`,
          }),
        onError: (err) => notifications.show({ color: 'red', message: deckListErrorMessage(err) }),
      },
    );
  }

  function removeOne(entry: DeckEntry) {
    const message = `Un exemplaire de ${entry.name} retiré du deck.`;
    if (entry.kind === 'owned') {
      const ids = entry.copy_ids;
      removeOwned.mutate(
        { deckId: deck.id, cardId: ids[ids.length - 1], commanderSlot: commanderSlotOf(deck, entry) },
        done(message),
      );
      return;
    }
    const item = entry.pending;
    if (item.quantity > 1) {
      setPendingQuantity.mutate({ deckId: deck.id, pendingId: item.id, quantity: item.quantity - 1 }, done(message));
    } else {
      removePending.mutate({ deckId: deck.id, pendingId: item.id }, done(message));
    }
  }

  function makeCommander(entry: DeckEntry, slot: CommanderSlot) {
    const role = slot === 'commander' ? 'le commandant' : 'le second commandant';
    updateDeck.mutate(
      { id: deck.id, changes: setSlotChanges(slot, entrySlotTarget(entry)) },
      done(`${entry.name} est maintenant ${role} du deck.`),
    );
  }

  function addToCollection(entry: DeckEntry) {
    if (entry.kind === 'pending') {
      const count = entry.quantity;
      commit.mutate(
        { deckId: deck.id, storageId: null, pendingId: entry.pending.id },
        done(
          count > 1
            ? `${count} exemplaires de ${entry.name} ajoutés à ta collection, sans rangement.`
            : `${entry.name} ajoutée à ta collection, sans rangement.`,
        ),
      );
      return;
    }
    createCards.mutate(
      {
        card: {
          name: entry.name,
          scryfall_id: entry.scryfall_id,
          set_code: entry.set_code,
          collector_number: entry.collector_number,
          foil: entry.foil,
          proxy: false,
          storage_id: null,
          mana_value: entry.mana_value,
          colors: entry.colors,
          card_type: entry.card_type,
          color_identity: entry.color_identity,
        },
        quantity: 1,
      },
      done(`Un exemplaire de plus de ${entry.name} dans ta collection, hors de ce deck.`),
    );
  }

  function setDeckImage(choice: ArtChoice, name: string) {
    updateDeck.mutate(
      { id: deck.id, changes: { background_scryfall_id: choice.scryfallId, background_face: choice.face } },
      done(`L'illustration de ${name} est maintenant celle du deck.`),
    );
  }

  function menuFor(entry: DeckEntry, board: DeckBoard, shown: ShownFace) {
    const { imageUrl } = shown;
    const item = { entry: entry, board, tag: null, imageUrl };
    const commander = commanderSlotOf(deck, entry) !== null;
    const { quantity } = entry;
    return (
      <>
        <FoilToggleItem card={entry} onToggle={(foil) => toggleFoil(entry, foil)} divider={false} />
        <ProxyToggleItem card={entry} onToggle={(proxy) => toggleProxy(entry, proxy)} />
        <Menu.Divider />
        {quantity >= 2 && !commander && (
          <Menu.Item onClick={() => setSplitEntry(entry)}>Séparer les éditions…</Menu.Item>
        )}
        <Menu.Item onClick={() => addOne(entry, board)}>Ajouter un exemplaire</Menu.Item>
        <Menu.Item onClick={() => removeOne(entry)} disabled={commander && quantity <= 1}>
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
            entry={entry}
            pairWith={hasCommander(deck) && !hasPartner(deck) ? deck.commander_scryfall_id : null}
            onClick={(slot) => makeCommander(entry, slot)}
          />
        )}
        <Menu.Item onClick={() => setOtherDeckEntry(entry)}>Ajouter à un autre deck</Menu.Item>
        <Menu.Item onClick={() => addToCollection(entry)}>
          {entry.kind === 'pending' ? 'Ajouter à ma collection' : 'Ajouter un exemplaire à ma collection'}
        </Menu.Item>
        <Menu.Divider />
        <CardCopyItems card={entry} imageUrl={imageUrl} />
        <DeckImageItem deck={deck} entry={entry} face={shown.face} onClick={setDeckImage} />
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

interface DeckImageItemProps {
  deck: Deck;
  entry: DeckEntry;
  face: CardFace;
  onClick: (choice: ArtChoice, name: string) => void;
}

function DeckImageItem({ deck, entry, face, onClick }: DeckImageItemProps) {
  const printing = useScryfallCard(face === 'back' ? entry.scryfall_id : null);
  const choice =
    face === 'front'
      ? { scryfallId: entry.scryfall_id, face, name: entry.name }
      : printing.data
        ? backArtChoice(printing.data)
        : null;
  const current =
    choice !== null && deck.background_scryfall_id === choice.scryfallId && deck.background_face === choice.face;
  return (
    <Menu.Item onClick={() => choice && onClick(choice, choice.name)} disabled={!choice || current}>
      Utiliser comme image du deck
    </Menu.Item>
  );
}

interface CommanderItemProps {
  entry: DeckEntry;
  pairWith: string | null | undefined;
  onClick: (slot: CommanderSlot) => void;
}

function CommanderItem({ entry, pairWith, onClick }: CommanderItemProps) {
  const scryfallCard = useScryfallCard(entry.scryfall_id);
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
