import {
  Alert,
  Button,
  Center,
  Group,
  Image,
  Loader,
  Modal,
  Paper,
  ScrollArea,
  SimpleGrid,
  Stack,
  Tabs,
  Text,
  UnstyledButton,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useState } from 'react';

import { errorMessage } from '../api/errors';
import type { Card, Deck } from '../api/types';
import { useCardArts, usePrintings } from '../scryfall/hooks';
import { useDeckCards, useUpdateDeck } from './api';
import { ScryfallCardSearch } from '../scryfall/ScryfallCardSearch';

interface ArtPickerModalProps {
  deck: Deck;
  opened: boolean;
  onClose: () => void;
}

export function ArtPickerModal({ deck, opened, onClose }: ArtPickerModalProps) {
  return (
    <Modal opened={opened} onClose={onClose} title="Choisir l'illustration du deck" size="xl">
      {opened && <ArtPicker deck={deck} onClose={onClose} />}
    </Modal>
  );
}

function uniquePrintings(cards: Card[]): Card[] {
  const seen = new Set<string>();
  return cards.filter((card) => {
    if (seen.has(card.scryfall_id)) {
      return false;
    }
    seen.add(card.scryfall_id);
    return true;
  });
}

function ArtPicker({ deck, onClose }: { deck: Deck; onClose: () => void }) {
  const [activeTab, setActiveTab] = useState<'deck' | 'scryfall'>('deck');
  const [selectedCardName, setSelectedCardName] = useState<string | null>(null);

  const cards = useDeckCards(deck.id, 'name');
  const deckPrintings = uniquePrintings(cards.data ?? []);
  const deckArts = useCardArts(deckPrintings.map((card) => card.scryfall_id));

  const scryfallPrintings = usePrintings(selectedCardName);
  const scryfallArts = useCardArts(
    (scryfallPrintings.data ?? []).map((card) => card.id)
  );

  const update = useUpdateDeck();

  function choose(scryfallId: string | null) {
    update.mutate(
      {
        id: deck.id,
        changes: scryfallId ? { background_scryfall_id: scryfallId } : { clear_background_scryfall_id: true },
      },
      {
        onSuccess: () => {
          notifications.show({ color: 'green', message: 'Illustration du deck mise à jour.' });
          onClose();
        },
      },
    );
  }

  return (
    <Stack>
      <Tabs value={activeTab} onChange={(value) => setActiveTab(value as 'deck' | 'scryfall')}>
        <Tabs.List>
          <Tabs.Tab value="deck">Cartes du deck</Tabs.Tab>
          <Tabs.Tab value="scryfall">Rechercher sur Scryfall</Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="deck">
          <Text size="sm" c="dimmed" mt="sm">
            Choisis une carte du deck : son illustration sera affichée en fond du deck.
          </Text>

          {cards.isLoading || deckArts.isLoading ? (
            <Center p="lg">
              <Loader />
            </Center>
          ) : cards.error || deckArts.error ? (
            <Alert color="red">{errorMessage(cards.error ?? deckArts.error)}</Alert>
          ) : deckPrintings.length === 0 ? (
            <Text size="sm" c="dimmed">
              Ce deck est vide : ajoute des cartes pour pouvoir choisir une illustration.
            </Text>
          ) : (
            <ScrollArea.Autosize mah={480} type="auto">
              <SimpleGrid cols={{ base: 2, sm: 3 }} spacing="sm">
                {deckPrintings.map((card) => {
                  const art = deckArts.data?.[card.scryfall_id];
                  if (!art) {
                    return null;
                  }
                  const selected = deck.background_scryfall_id === card.scryfall_id;
                  return (
                    <UnstyledButton
                      key={card.scryfall_id}
                      onClick={() => choose(card.scryfall_id)}
                      disabled={update.isPending}
                    >
                      <Paper
                        withBorder
                        p={4}
                        radius="md"
                        style={selected ? { borderColor: 'var(--mantine-primary-color-filled)', borderWidth: 2 } : undefined}
                      >
                        <Image src={art.url} alt={card.name} radius="sm" loading="lazy" />
                        <Text size="xs" mt={4} lineClamp={1}>
                          {card.name}
                        </Text>
                        <Text size="xs" c="dimmed" lineClamp={1}>
                          {art.artist ?? ' '}
                        </Text>
                      </Paper>
                    </UnstyledButton>
                  );
                })}
              </SimpleGrid>
            </ScrollArea.Autosize>
          )}
        </Tabs.Panel>

        <Tabs.Panel value="scryfall">
          <Stack gap="sm" mt="sm">
            <ScryfallCardSearch
              label="Rechercher une carte"
              placeholder="Nom de la carte..."
              onSelect={(name) => {
                setSelectedCardName(name);
              }}
            />

            {selectedCardName && (
              <>
                {scryfallPrintings.isLoading ? (
                  <Center p="lg">
                    <Loader />
                  </Center>
                ) : scryfallPrintings.error ? (
                  <Alert color="red">{errorMessage(scryfallPrintings.error)}</Alert>
                ) : scryfallPrintings.data && scryfallPrintings.data.length === 0 ? (
                  <Text size="sm" c="dimmed">
                    Aucune édition trouvée pour cette carte.
                  </Text>
                ) : (
                  <ScrollArea.Autosize mah={480} type="auto">
                    <SimpleGrid cols={{ base: 2, sm: 3 }} spacing="sm">
                      {(scryfallPrintings.data ?? []).map((card) => {
                        const art = scryfallArts.data?.[card.id];
                        if (!art) {
                          return null;
                        }
                        const selected = deck.background_scryfall_id === card.id;
                        return (
                          <UnstyledButton
                            key={card.id}
                            onClick={() => choose(card.id)}
                            disabled={update.isPending}
                          >
                            <Paper
                              withBorder
                              p={4}
                              radius="md"
                              style={selected ? { borderColor: 'var(--mantine-primary-color-filled)', borderWidth: 2 } : undefined}
                            >
                              <Image src={art.url} alt={card.name} radius="sm" loading="lazy" />
                              <Text size="xs" mt={4} lineClamp={1}>
                                {card.name}
                              </Text>
                              <Text size="xs" c="dimmed" lineClamp={1}>
                                {card.set_name} ({card.set})
                              </Text>
                              <Text size="xs" c="dimmed" lineClamp={1}>
                                {art.artist ?? ' '}
                              </Text>
                            </Paper>
                          </UnstyledButton>
                        );
                      })}
                    </SimpleGrid>
                  </ScrollArea.Autosize>
                )}
              </>
            )}
          </Stack>
        </Tabs.Panel>
      </Tabs>

      {update.error && <Alert color="red">{errorMessage(update.error)}</Alert>}

      <Group justify="space-between">
        {deck.background_scryfall_id ? (
          <Button variant="subtle" onClick={() => choose(null)} loading={update.isPending}>
            {deck.commander_scryfall_id ? "Revenir à l'illustration du commandant" : "Retirer l'illustration"}
          </Button>
        ) : (
          <span />
        )}
        <Button variant="default" onClick={onClose}>
          Fermer
        </Button>
      </Group>
    </Stack>
  );
}
