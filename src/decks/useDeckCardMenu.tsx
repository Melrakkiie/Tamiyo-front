import { Menu } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useState } from 'react';

import { errorMessage } from '../api/errors';
import type { Deck, DeckBoard } from '../api/types';
import { CardCopyItems, FoilToggleItem, ProxyToggleItem, type ShownFace } from '../cards/CardContextMenu';
import type { CardFace } from '../scryfall/client';
import { canPair, commanderEligibility } from '../scryfall/commander';
import { useScryfallCard } from '../scryfall/hooks';
import { AddCopiesToDeckModal } from './AddCopiesToDeckModal';
import { isCommanderFormat, useUpdateDeck } from './api';
import { type ArtChoice, backArtChoice } from './art';
import { BOARDS } from './boards';
import { type CommanderSlot, hasCommander, hasPartner, setSlotChanges } from './commanders';
import { type DeckEntry, entrySlotTarget } from './deckEntries';
import { deckListErrorMessage, deckListSummary } from './DeckListInput';
import type { EntryIntent } from './entryMutations/plan';
import { heldSlot } from './entryMutations/slots';
import { useDeckEntryMutations } from './entryMutations/useDeckEntryMutations';
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
  const mutations = useDeckEntryMutations(deck);
  const updateDeck = useUpdateDeck();
  const [otherDeckEntry, setOtherDeckEntry] = useState<DeckEntry | null>(null);
  const [splitEntry, setSplitEntry] = useState<DeckEntry | null>(null);

  const done = (message: string) => ({
    onSuccess: () => notifications.show({ color: 'green', message }),
    onError: notifyError,
  });

  async function switchCopies(entry: DeckEntry, intent: EntryIntent, describe: (details: string) => string) {
    try {
      const { summary } = await mutations.run(entry, intent);
      if (summary) {
        notifications.show({ color: 'green', message: describe(summaryDetails(summary)) });
      }
    } catch (err) {
      notifyError(err);
    }
  }

  function toggleFoil(entry: DeckEntry, foil: boolean) {
    const finish = foil ? 'foil' : 'non-foil';
    return switchCopies(
      entry,
      { kind: 'switchFinish', foil },
      (details) => `${entry.name} est maintenant ${finish} dans ce deck${details}. Ta collection n'a pas changé.`,
    );
  }

  function toggleProxy(entry: DeckEntry, proxy: boolean) {
    const state = proxy ? 'est maintenant proxy' : "n'est plus proxy";
    return switchCopies(
      entry,
      { kind: 'switchProxy', proxy },
      (details) => `${entry.name} ${state} dans ce deck${details}. Ta collection n'a pas changé.`,
    );
  }

  async function addOne(entry: DeckEntry, board: DeckBoard) {
    try {
      const { summary } = await mutations.run(entry, { kind: 'addCopies', count: 1, board });
      if (summary) {
        notifications.show({
          color: (summary.cards_skipped ?? 0) > 0 ? 'yellow' : 'green',
          message: `${entry.name} ajoutée : ${deckListSummary(summary)}.`,
        });
      }
    } catch (err) {
      notifications.show({ color: 'red', message: deckListErrorMessage(err) });
    }
  }

  async function removeOne(entry: DeckEntry) {
    try {
      await mutations.run(entry, { kind: 'removeCopies', count: 1 });
      notifications.show({ color: 'green', message: `Un exemplaire de ${entry.name} retiré du deck.` });
    } catch (err) {
      notifyError(err);
    }
  }

  function makeCommander(entry: DeckEntry, slot: CommanderSlot) {
    const role = slot === 'commander' ? 'le commandant' : 'le second commandant';
    updateDeck.mutate(
      { id: deck.id, changes: setSlotChanges(slot, entrySlotTarget(entry)) },
      done(`${entry.name} est maintenant ${role} du deck.`),
    );
  }

  async function addToCollection(entry: DeckEntry) {
    const count = entry.quantity;
    const message =
      entry.kind === 'owned'
        ? `Un exemplaire de plus de ${entry.name} dans ta collection, hors de ce deck.`
        : count > 1
          ? `${count} exemplaires de ${entry.name} ajoutés à ta collection, sans rangement.`
          : `${entry.name} ajoutée à ta collection, sans rangement.`;
    try {
      await mutations.run(entry, { kind: 'addToCollection' });
      notifications.show({ color: 'green', message });
    } catch (err) {
      notifyError(err);
    }
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
    const commander = heldSlot(deck, entry) !== null;
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
