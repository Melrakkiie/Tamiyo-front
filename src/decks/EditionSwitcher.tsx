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
import type { Card } from '../api/types';
import { useCollectionCopies } from '../cards/api';
import { PrintingPrice } from '../cards/price';
import type { ScryfallCard } from '../scryfall/client';
import { useCardImages, usePrintings } from '../scryfall/hooks';
import { EditionSearchInput, NoEditionMatch } from '../scryfall/EditionSearchInput';
import { PrintingGrid } from '../scryfall/PrintingGrid';
import { SetIcon } from '../scryfall/SetIcon';
import { useStorageDirectory } from '../storages/useStorageDirectory';
import { StorageLabel } from '../storages/StorageLabel';
import { FoilSticker, ProxySticker } from '../theme/Sticker';
import type { CommanderSlot } from './commanders';
import type { DeckEntry } from './deckEntries';
import { editionChoices } from './editionChoices';
import { useSwapEdition } from './useSwapEdition';

interface EditionSwitcherProps {
  deckId: string;
  entry: DeckEntry;
  deckCardIds: Set<number>;
  commanderSlot: CommanderSlot | null;
  onSwapped: (next: DeckEntry) => void;
}

export function EditionSwitcher({ deckId, entry, deckCardIds, commanderSlot, onSwapped }: EditionSwitcherProps) {
  const becomes = commanderSlot === 'partner' ? 'le second commandant' : 'le commandant';
  const copies = useCollectionCopies(entry.name, entry.scryfall_id);
  const printings = usePrintings(entry.name);
  const storages = useStorageDirectory(deckId);
  const [showLocked, setShowLocked] = useState(false);
  const [query, setQuery] = useState('');
  const choices = editionChoices({
    source: entry,
    copies: copies.data ?? [],
    printings: printings.data ?? [],
    deckCardIds,
    isLocked: storages.isLocked,
    showLocked: showLocked,
    query,
  });
  const images = useCardImages(
    choices.offered.map((copy) => copy.scryfall_id),
    'small',
  );
  const byId = new Map((printings.data ?? []).map((printing) => [printing.id, printing]));

  const { swap, isPending: busy, error } = useSwapEdition(deckId, commanderSlot);

  function done(message: string, next: DeckEntry) {
    notifications.show({ color: 'green', message });
    onSwapped(next);
  }

  function ignore() {}

  function chooseOwned(copy: Card) {
    const message = `${entry.name} : l'exemplaire ${copy.set_code.toUpperCase()} #${copy.collector_number}${copy.foil ? ' foil' : ''} de ta collection est maintenant dans le deck.`;
    swap(entry, { kind: 'owned', copy }).then((next) => done(message, next), ignore);
  }

  function choosePrinting(printing: ScryfallCard) {
    const message = `${entry.name} : l'édition ${printing.set.toUpperCase()} #${printing.collector_number} est dans le deck, en attendant d'être dans ta collection.`;
    swap(entry, { kind: 'printing', printing }).then((next) => done(message, next), ignore);
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
              <Anchor component="button" type="button" size="xs" ta="left" onClick={() => setShowLocked(true)}>
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
                          storage={storages.nameOf(copy.storage_id)}
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
              {entry.kind === 'owned'
                ? "La carte actuelle sort du deck (elle reste dans ta collection) et l'édition choisie y entre en orange, à ajouter à ta collection plus tard."
                : "L'édition choisie remplace celle-ci dans le deck, toujours en orange."}
              {commanderSlot ? ` Elle deviendra aussi ${becomes}.` : ''}
            </Text>
            <PrintingGrid printings={choices.others} disabled={busy} foil={entry.foil} onSelect={choosePrinting} />
          </>
        )}
      </Stack>

      {error && <Alert color="red">{errorMessage(error)}</Alert>}
    </Stack>
  );
}
