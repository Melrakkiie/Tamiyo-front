import { Badge, Button, Grid, Group, Modal, Paper, Select, Stack, Text, Title } from '@mantine/core';
import { type ReactNode, useRef, useState } from 'react';

import type { Card, DeckBoard } from '../api/types';
import { useSession } from '../auth/useSession';
import { AddCardModal, type AddTarget } from '../cards/AddCardModal';
import { CardImage } from '../cards/CardImage';
import { CardRulesText } from '../scryfall/CardRulesText';
import { useBackImage, useScryfallCard } from '../scryfall/hooks';
import { useAllDecks } from './api';
import { BoardPicker } from './BoardSection';

interface SharedCardModalProps {
  card: Card | null;
  imageUrl: string | undefined;
  details?: ReactNode;
  onClose: () => void;
}

export function SharedCardModal({ card, imageUrl, details, onClose }: SharedCardModalProps) {
  const lastShown = useRef<{ card: Card; imageUrl: string | undefined; details: ReactNode } | null>(null);
  if (card) {
    lastShown.current = { card, imageUrl, details };
  }
  const shown = lastShown.current;
  const signedIn = useSession().status === 'authenticated';
  const [adding, setAdding] = useState<{ card: Card; target: AddTarget } | null>(null);
  const printing = useScryfallCard(adding?.card.scryfall_id);

  return (
    <>
      <Modal opened={card !== null && adding === null} onClose={onClose} title={shown?.card.name} size="xl">
        {shown && (
          <SharedCardDetail
            key={shown.card.id}
            card={shown.card}
            imageUrl={shown.imageUrl}
            details={shown.details}
            onAdd={signedIn ? (target) => setAdding({ card: shown.card, target }) : undefined}
          />
        )}
      </Modal>
      <AddCardModal
        card={adding ? { name: adding.card.name, printing: printing.data ?? undefined } : null}
        onClose={() => setAdding(null)}
        defaultStorageId={undefined}
        target={adding?.target}
      />
    </>
  );
}

interface SharedCardDetailProps {
  card: Card;
  imageUrl: string | undefined;
  details: ReactNode;
  onAdd?: (target: AddTarget) => void;
}

function SharedCardDetail({ card, imageUrl, details, onAdd }: SharedCardDetailProps) {
  const backImage = useBackImage(card.scryfall_id);
  const quantity = card.quantity ?? 1;

  return (
    <Grid gutter="lg">
      <Grid.Col span={{ base: 12, sm: 5 }}>
        <CardImage name={card.name} url={imageUrl} backUrl={backImage} loading={false} />
      </Grid.Col>
      <Grid.Col span={{ base: 12, sm: 7 }}>
        <Stack>
          <div>
            <Title order={3} size="h4">
              {card.name}
            </Title>
            {details !== undefined ? (
              details
            ) : (
              <Group gap={6}>
                <Text size="sm" c="dimmed">
                  {card.set_code.toUpperCase()} · #{card.collector_number}
                  {quantity > 1 ? ` · ${quantity} exemplaires` : ''}
                </Text>
                {card.foil && (
                  <Badge size="xs" variant="light">
                    Foil
                  </Badge>
                )}
              </Group>
            )}
          </div>
          <CardRulesText scryfallId={card.scryfall_id} />
          {onAdd && <AddSharedCard onAdd={onAdd} />}
        </Stack>
      </Grid.Col>
    </Grid>
  );
}

function AddSharedCard({ onAdd }: { onAdd: (target: AddTarget) => void }) {
  const decks = useAllDecks();
  const [deckId, setDeckId] = useState<string | null>(null);
  const [board, setBoard] = useState<DeckBoard>('main');
  const deckOptions = [...(decks.data ?? [])]
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((deck) => ({ value: deck.id, label: deck.name }));

  return (
    <Paper withBorder radius="md" p="md">
      <Stack gap="sm">
        <Group justify="space-between">
          <Text size="sm" fw={500}>
            Ajouter cette carte
          </Text>
          <Button variant="light" size="xs" onClick={() => onAdd({ kind: 'collection' })}>
            À ma collection
          </Button>
        </Group>
        <Select
          label="Dans un de mes decks"
          placeholder={decks.isLoading ? 'Chargement…' : 'Choisis un deck'}
          data={deckOptions}
          value={deckId}
          onChange={setDeckId}
          searchable
          nothingFoundMessage="Aucun deck"
        />
        <BoardPicker value={board} onChange={setBoard} />
        <Group justify="flex-end">
          <Button
            variant="light"
            size="xs"
            disabled={!deckId}
            onClick={() => deckId && onAdd({ kind: 'pending', deckId, board })}
          >
            Ajouter au deck
          </Button>
        </Group>
        <Text size="xs" c="dimmed">
          Dans un deck, elle est ajoutée en attente, jusqu'à ce qu'elle soit dans ta collection.
        </Text>
      </Stack>
    </Paper>
  );
}
