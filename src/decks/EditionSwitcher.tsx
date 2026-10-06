import { Alert, Badge, Center, Image, Loader, Paper, SimpleGrid, Stack, Text, UnstyledButton } from '@mantine/core';
import { notifications } from '@mantine/notifications';

import { errorMessage } from '../api/errors';
import type { Card } from '../api/types';
import { useCollectionCopies } from '../cards/api';
import { useCardImages } from '../scryfall/hooks';
import { useAllStorages } from '../storages/api';
import { useSwapDeckCard } from './api';

interface EditionSwitcherProps {
  deckId: number;
  card: Card;
  deckCardIds: Set<number>;
  isCommander: boolean;
  onSwapped: () => void;
}

export function EditionSwitcher({ deckId, card, deckCardIds, isCommander, onSwapped }: EditionSwitcherProps) {
  const copies = useCollectionCopies(card.name);
  const candidates = (copies.data ?? []).filter((copy) => copy.id !== card.id && !deckCardIds.has(copy.id));
  const images = useCardImages(
    candidates.map((copy) => copy.scryfall_id),
    'small',
  );
  const storages = useAllStorages();
  const storageNames = new Map<number, string>((storages.data ?? []).map((storage) => [storage.id, storage.name]));
  const swap = useSwapDeckCard();

  function choose(copy: Card) {
    swap.mutate(
      { deckId, fromCardId: card.id, toCardId: copy.id, isCommander },
      {
        onSuccess: () => {
          notifications.show({
            color: 'green',
            message: `${card.name} : l'exemplaire ${copy.set_code.toUpperCase()} #${copy.collector_number}${copy.foil ? ' foil' : ''} est maintenant dans le deck.`,
          });
          onSwapped();
        },
      },
    );
  }

  return (
    <Stack gap="xs">
      <Text size="sm" fw={500}>
        Changer d'exemplaire
      </Text>
      {copies.isLoading ? (
        <Center p="md">
          <Loader size="sm" />
        </Center>
      ) : copies.error ? (
        <Alert color="red">{errorMessage(copies.error)}</Alert>
      ) : candidates.length === 0 ? (
        <Text size="sm" c="dimmed">
          Aucun autre exemplaire de cette carte dans ta collection (en dehors de ce deck).
        </Text>
      ) : (
        <>
          <Text size="xs" c="dimmed">
            Clique sur un exemplaire de ta collection pour le mettre dans le deck à la place de celui-ci.
            {isCommander ? ' Il deviendra aussi le commandant.' : ''}
          </Text>
          <SimpleGrid cols={{ base: 2, sm: 4 }} spacing="xs">
            {candidates.map((copy) => (
              <UnstyledButton key={copy.id} onClick={() => choose(copy)} disabled={swap.isPending}>
                <Paper withBorder p={4} radius="md" style={swap.isPending ? { opacity: 0.5 } : undefined}>
                  <Image src={images.data?.[copy.scryfall_id]} alt={copy.name} radius="sm" loading="lazy" />
                  <Text size="xs" mt={4}>
                    {copy.set_code.toUpperCase()} · #{copy.collector_number}{' '}
                    {copy.foil && (
                      <Badge size="xs" variant="light">
                        foil
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
      {swap.error && <Alert color="red">{errorMessage(swap.error)}</Alert>}
    </Stack>
  );
}
