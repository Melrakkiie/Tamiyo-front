import { Alert, Badge, Center, Image, Loader, Paper, SimpleGrid, Stack, Text, UnstyledButton } from '@mantine/core';
import { notifications } from '@mantine/notifications';

import { errorMessage } from '../api/errors';
import type { Card, PendingCard } from '../api/types';
import { useCollectionCopies } from '../cards/api';
import type { ScryfallCard } from '../scryfall/client';
import { useCardImages, usePrintings } from '../scryfall/hooks';
import { foilFor, printingDetails } from '../scryfall/printing';
import { PrintingGrid } from '../scryfall/PrintingGrid';
import { useAllStorages } from '../storages/api';
import {
  useReplaceDeckCardWithPending,
  useReplacePendingCard,
  useReplacePendingWithOwned,
  useSwapDeckCard,
} from './api';

export type EditionSource = { kind: 'card'; card: Card } | { kind: 'pending'; item: PendingCard };

interface EditionSwitcherProps {
  deckId: number;
  source: EditionSource;
  deckCardIds: Set<number>;
  isCommander: boolean;
  onSwapped: () => void;
}

function sourceDetails(source: EditionSource) {
  return source.kind === 'card' ? source.card : source.item;
}

export function EditionSwitcher({ deckId, source, deckCardIds, isCommander, onSwapped }: EditionSwitcherProps) {
  const current = sourceDetails(source);
  const copies = useCollectionCopies(current.name);
  const owned = (copies.data ?? []).filter(
    (copy) => !(source.kind === 'card' && copy.id === source.card.id) && !deckCardIds.has(copy.id),
  );
  const ownedPrintings = new Set(owned.map((copy) => copy.scryfall_id));
  const printings = usePrintings(current.name);
  const others = (printings.data ?? []).filter(
    (printing) => printing.id !== current.scryfall_id && !ownedPrintings.has(printing.id),
  );
  const images = useCardImages(
    owned.map((copy) => copy.scryfall_id),
    'small',
  );
  const storages = useAllStorages();
  const storageNames = new Map<number, string>((storages.data ?? []).map((storage) => [storage.id, storage.name]));

  const swap = useSwapDeckCard();
  const swapPending = useReplacePendingWithOwned();
  const toPending = useReplaceDeckCardWithPending();
  const replacePending = useReplacePendingCard();
  const busy = swap.isPending || swapPending.isPending || toPending.isPending || replacePending.isPending;
  const error = swap.error ?? swapPending.error ?? toPending.error ?? replacePending.error;

  function done(message: string) {
    notifications.show({ color: 'green', message });
    onSwapped();
  }

  function chooseOwned(copy: Card) {
    const message = `${current.name} : l'exemplaire ${copy.set_code.toUpperCase()} #${copy.collector_number}${copy.foil ? ' foil' : ''} de ta collection est maintenant dans le deck.`;
    if (source.kind === 'card') {
      swap.mutate(
        { deckId, fromCardId: source.card.id, toCardId: copy.id, isCommander },
        { onSuccess: () => done(message) },
      );
    } else {
      swapPending.mutate(
        { deckId, from: source.item, toCardId: copy.id, isCommander },
        { onSuccess: () => done(message) },
      );
    }
  }

  function choosePrinting(printing: ScryfallCard) {
    const card = { ...printingDetails(printing), foil: foilFor(printing, current.foil), quantity: 1 };
    const message = `${current.name} : l'édition ${printing.set.toUpperCase()} #${printing.collector_number} est dans le deck, en attendant d'être dans ta collection.`;
    if (source.kind === 'card') {
      toPending.mutate({ deckId, fromCardId: source.card.id, isCommander, card }, { onSuccess: () => done(message) });
    } else {
      replacePending.mutate({ deckId, from: source.item, isCommander, card }, { onSuccess: () => done(message) });
    }
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
        ) : owned.length === 0 ? (
          <Text size="sm" c="dimmed">
            Aucun autre exemplaire de cette carte dans ta collection (en dehors de ce deck).
          </Text>
        ) : (
          <>
            <Text size="xs" c="dimmed">
              Dans ta collection : clique sur un exemplaire pour le mettre dans le deck à la place de celui-ci.
              {isCommander ? ' Il deviendra aussi le commandant.' : ''}
            </Text>
            <SimpleGrid cols={{ base: 2, sm: 4 }} spacing="xs">
              {owned.map((copy) => (
                <UnstyledButton key={copy.id} onClick={() => chooseOwned(copy)} disabled={busy}>
                  <Paper withBorder p={4} radius="md" style={busy ? { opacity: 0.5 } : undefined}>
                    <Image src={images.data?.[copy.scryfall_id]} alt={copy.name} radius="sm" loading="lazy" />
                    <Text size="xs" mt={4}>
                      {copy.set_code.toUpperCase()} · #{copy.collector_number}{' '}
                      {copy.foil && (
                        <Badge size="xs" variant="light">
                          foil
                        </Badge>
                      )}
                      {copy.proxy && (
                        <Badge size="xs" variant="light" color="gray">
                          proxy
                        </Badge>
                      )}
                    </Text>
                    <Text size="xs" c="dimmed" lineClamp={1}>
                      {copy.storage_id ? (storageNames.get(copy.storage_id) ?? 'Rangement inconnu') : 'Sans rangement'}
                    </Text>
                  </Paper>
                </UnstyledButton>
              ))}
            </SimpleGrid>
          </>
        )}
      </Stack>

      <Stack gap="xs">
        <Text size="sm" fw={500}>
          Autres éditions, pas dans ta collection
        </Text>
        {printings.isLoading ? (
          <Center p="md">
            <Loader size="sm" />
          </Center>
        ) : printings.error ? (
          <Alert color="red">{errorMessage(printings.error)}</Alert>
        ) : others.length === 0 ? (
          <Text size="sm" c="dimmed">
            Aucune autre édition papier de cette carte sur Scryfall.
          </Text>
        ) : (
          <>
            <Text size="xs" c="dimmed">
              {source.kind === 'card'
                ? "La carte actuelle sort du deck (elle reste dans ta collection) et l'édition choisie y entre en orange, à ajouter à ta collection plus tard."
                : "L'édition choisie remplace celle-ci dans le deck, toujours en orange."}
              {isCommander ? ' Elle deviendra aussi le commandant.' : ''}
            </Text>
            <PrintingGrid printings={others} disabled={busy} onSelect={choosePrinting} />
          </>
        )}
      </Stack>

      {error && <Alert color="red">{errorMessage(error)}</Alert>}
    </Stack>
  );
}
