import {
  Alert,
  Anchor,
  Center,
  Group,
  Image,
  Loader,
  Paper,
  SimpleGrid,
  Stack,
  Text,
  UnstyledButton,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useState } from 'react';

import { errorMessage } from '../api/errors';
import type { Card, DeckBoard, PendingCard } from '../api/types';
import { useCollectionCopies } from '../cards/api';
import { PrintingPrice } from '../cards/price';
import type { ScryfallCard } from '../scryfall/client';
import { useCardImages, usePrintings } from '../scryfall/hooks';
import { EditionSearchInput, NoEditionMatch } from '../scryfall/EditionSearchInput';
import { foilFor, printingDetails } from '../scryfall/printing';
import { PrintingGrid } from '../scryfall/PrintingGrid';
import { SetIcon } from '../scryfall/SetIcon';
import { useStorageDirectory } from '../storages/useStorageDirectory';
import { StorageLabel } from '../storages/StorageLabel';
import { FoilSticker, ProxySticker } from '../theme/Sticker';
import {
  useReplaceDeckCardWithPending,
  useReplacePendingCard,
  useReplacePendingWithOwned,
  useSwapDeckCard,
} from './api';
import type { CommanderSlot } from './commanders';
import type { DeckEntry } from './deckEntries';
import { editionChoices } from './editionChoices';

export type EditionSource = { kind: 'card'; card: Card; board: DeckBoard } | { kind: 'pending'; item: PendingCard };

interface EditionSwitcherProps {
  deckId: string;
  source: EditionSource;
  entry: DeckEntry;
  deckCardIds: Set<number>;
  commanderSlot: CommanderSlot | null;
  onSwapped: (next: EditionSource) => void;
}

function sourceDetails(source: EditionSource) {
  return source.kind === 'card' ? source.card : source.item;
}

export function EditionSwitcher({
  deckId,
  source,
  entry,
  deckCardIds,
  commanderSlot,
  onSwapped,
}: EditionSwitcherProps) {
  const becomes = commanderSlot === 'partner' ? 'le second commandant' : 'le commandant';
  const current = sourceDetails(source);
  const copies = useCollectionCopies(current.name, current.scryfall_id);
  const printings = usePrintings(current.name);
  const storages = useStorageDirectory(deckId);
  const [showClosed, setShowClosed] = useState(false);
  const [query, setQuery] = useState('');
  const choices = editionChoices({
    source: entry,
    copies: copies.data ?? [],
    printings: printings.data ?? [],
    deckCardIds,
    isLocked: storages.isLocked,
    showLocked: showClosed,
    query,
  });
  const images = useCardImages(
    choices.offered.map((copy) => copy.scryfall_id),
    'small',
  );
  const byId = new Map((printings.data ?? []).map((printing) => [printing.id, printing]));

  const swap = useSwapDeckCard();
  const swapPending = useReplacePendingWithOwned();
  const toPending = useReplaceDeckCardWithPending();
  const replacePending = useReplacePendingCard();
  const busy = swap.isPending || swapPending.isPending || toPending.isPending || replacePending.isPending;
  const error = swap.error ?? swapPending.error ?? toPending.error ?? replacePending.error;

  function done(message: string, next: EditionSource) {
    notifications.show({ color: 'green', message });
    onSwapped(next);
  }

  function ignore() {}

  function chooseOwned(copy: Card) {
    const message = `${current.name} : l'exemplaire ${copy.set_code.toUpperCase()} #${copy.collector_number}${copy.foil ? ' foil' : ''} de ta collection est maintenant dans le deck.`;
    if (source.kind === 'card') {
      swap
        .mutateAsync({ deckId, fromCardId: source.card.id, toCardId: copy.id, board: source.board, commanderSlot })
        .then(() => done(message, { kind: 'card', card: copy, board: source.board }), ignore);
    } else {
      swapPending
        .mutateAsync({ deckId, from: source.item, toCardId: copy.id, commanderSlot })
        .then(() => done(message, { kind: 'card', card: copy, board: source.item.board }), ignore);
    }
  }

  function choosePrinting(printing: ScryfallCard) {
    const card = { ...printingDetails(printing), foil: foilFor(printing, current.foil), quantity: 1 };
    const message = `${current.name} : l'édition ${printing.set.toUpperCase()} #${printing.collector_number} est dans le deck, en attendant d'être dans ta collection.`;
    const swapped =
      source.kind === 'card'
        ? toPending.mutateAsync({
            deckId,
            fromCardId: source.card.id,
            commanderSlot,
            card: { ...card, board: source.board },
          })
        : replacePending.mutateAsync({ deckId, from: source.item, commanderSlot, card });
    swapped.then((item) => done(message, { kind: 'pending', item }), ignore);
  }

  return (
    <Stack gap="md">
      <Stack gap="xs">
        <Text size="sm" fw={500}>
          Changer d'édition
        </Text>
        {copies.isLoading ? (
          <Center p="md">
            <Loader size="sm" />
          </Center>
        ) : copies.error ? (
          <Alert color="red">{errorMessage(copies.error)}</Alert>
        ) : choices.offered.length === 0 && choices.hiddenLocked === 0 ? (
          <Text size="sm" c="dimmed">
            Aucun autre exemplaire de cette carte dans ta collection (en dehors de ce deck).
          </Text>
        ) : (
          <>
            <Text size="xs" c="dimmed">
              {choices.offered.length === 0
                ? 'Tous les autres exemplaires de ta collection sont dans des rangements verrouillés pour ce deck.'
                : `Dans ta collection : clique sur un exemplaire pour le mettre dans le deck à la place de celui-ci.${commanderSlot ? ` Il deviendra aussi ${becomes}.` : ''}`}
            </Text>
            {choices.hiddenLocked > 0 && (
              <Anchor component="button" type="button" size="xs" ta="left" onClick={() => setShowClosed(true)}>
                Voir {choices.hiddenLocked} exemplaire{choices.hiddenLocked > 1 ? 's' : ''} dans des rangements
                verrouillés
              </Anchor>
            )}
            {choices.offered.length > 0 && <EditionSearchInput value={query} onChange={setQuery} />}
            {choices.offered.length > 0 && choices.copies.length === 0 && <NoEditionMatch />}
            <SimpleGrid cols={{ base: 2, sm: 4 }} spacing="xs">
              {choices.copies.map((copy) => {
                const printing = byId.get(copy.scryfall_id);
                return (
                  <UnstyledButton key={copy.id} onClick={() => chooseOwned(copy)} disabled={busy}>
                    <Paper withBorder p={4} radius="md" style={busy ? { opacity: 0.5 } : undefined}>
                      <Image src={images.data?.[copy.scryfall_id]} alt={copy.name} radius="sm" loading="lazy" />
                      <Group gap={4} mt={4} wrap="nowrap">
                        <Text size="xs">
                          {copy.set_code.toUpperCase()} · #{copy.collector_number}
                        </Text>
                        {copy.foil && <FoilSticker />}
                        {copy.proxy && <ProxySticker />}
                      </Group>
                      <Group gap={4} justify="space-between" align="center" wrap="nowrap">
                        <StorageLabel
                          name={storages.nameOf(copy.storage_id)}
                          locked={storages.isLocked(copy.storage_id)}
                        />
                        <SetIcon setCode={copy.set_code} size={22} />
                      </Group>
                      {printing && <PrintingPrice printing={printing} foil={copy.foil} size="sm" />}
                    </Paper>
                  </UnstyledButton>
                );
              })}
            </SimpleGrid>
          </>
        )}
      </Stack>

      <Stack gap="xs">
        <Text size="sm" fw={500}>
          Autres éditions, pas disponibles dans ta collection
        </Text>
        {printings.isLoading ? (
          <Center p="md">
            <Loader size="sm" />
          </Center>
        ) : printings.error ? (
          <Alert color="red">{errorMessage(printings.error)}</Alert>
        ) : choices.others.length === 0 ? (
          <Text size="sm" c="dimmed">
            Aucune autre édition papier de cette carte sur Scryfall.
          </Text>
        ) : (
          <>
            <Text size="xs" c="dimmed">
              {source.kind === 'card'
                ? "La carte actuelle sort du deck (elle reste dans ta collection) et l'édition choisie y entre en orange, à ajouter à ta collection plus tard."
                : "L'édition choisie remplace celle-ci dans le deck, toujours en orange."}
              {commanderSlot ? ` Elle deviendra aussi ${becomes}.` : ''}
            </Text>
            <PrintingGrid printings={choices.others} disabled={busy} foil={current.foil} onSelect={choosePrinting} />
          </>
        )}
      </Stack>

      {error && <Alert color="red">{errorMessage(error)}</Alert>}
    </Stack>
  );
}
