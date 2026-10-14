import { Alert, Anchor, Center, Loader, Stack } from '@mantine/core';
import { Link, useParams } from 'react-router';

import { ApiError, errorMessage } from '../api/errors';
import type { SharedDeck } from '../api/types';
import { useSession } from '../auth/useSession';
import { isCommanderFormat } from '../decks/api';
import { usePageTitle } from '../layout/usePageTitle';
import { usePlaytestDeck } from '../playtest/api';
import type { DeckEntry } from '../playtest/engine';
import { PlaytestTable } from '../playtest/PlaytestTable';
import { usePlaytestZoom } from '../playtest/zoom';
import { EmptyNote } from '../theme/EmptyNote';

function mainBoard(shared: SharedDeck): DeckEntry[] {
  return shared.cards
    .filter((card) => card.board === 'main')
    .map((card) => ({
      scryfallId: card.scryfall_id,
      name: card.name,
      quantity: card.quantity,
      commander: card.commander,
    }));
}

export function DeckPlaytestPage() {
  const id = useParams().id ?? '';
  const { status } = useSession();

  if (status === 'unknown') {
    return (
      <Center h="100dvh">
        <Loader />
      </Center>
    );
  }
  return <PlaytestLoader key={id} id={id} signedIn={status === 'authenticated'} />;
}

function PlaytestLoader({ id, signedIn }: { id: string; signedIn: boolean }) {
  const deck = usePlaytestDeck(id, signedIn);
  const zoom = usePlaytestZoom(signedIn);
  usePageTitle(deck.data ? `Playtest · ${deck.data.deck.name}` : 'Playtest');

  if (deck.isLoading || zoom.loading) {
    return (
      <Center h="100dvh">
        <Loader />
      </Center>
    );
  }

  if (!deck.data) {
    const notFound = deck.error instanceof ApiError && deck.error.status === 404;
    return (
      <Center h="100dvh" p="md">
        <Stack align="flex-start" maw={520}>
          <Alert color="orange">
            {!notFound
              ? errorMessage(deck.error)
              : signedIn
                ? "Ce deck n'existe pas, ou son propriétaire ne le partage pas."
                : "Ce deck n'existe pas, ou son propriétaire ne le partage pas. S'il est à toi, connecte-toi pour le tester."}
          </Alert>
          <Anchor component={Link} to={signedIn ? '/decks' : '/'}>
            {signedIn ? 'Retour à mes decks' : "Retour à l'accueil"}
          </Anchor>
        </Stack>
      </Center>
    );
  }

  const entries = mainBoard(deck.data);
  if (entries.length === 0) {
    return (
      <Center h="100dvh">
        <EmptyNote title="Rien à tester" note="Ce deck n'a encore aucune carte dans sa liste principale.">
          <Anchor component={Link} to={`/decks/${id}`}>
            Retour au deck
          </Anchor>
        </EmptyNote>
      </Center>
    );
  }

  return (
    <PlaytestTable
      deckId={id}
      deckName={deck.data.deck.name}
      deck={entries}
      commanderFormat={isCommanderFormat(deck.data.deck.format)}
      zoom={zoom}
    />
  );
}
