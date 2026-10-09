import { Menu } from '@mantine/core';
import { useState } from 'react';

import type { Card } from '../api/types';
import { AddCardModal } from '../cards/AddCardModal';
import { CardCopyItems } from '../cards/CardContextMenu';
import { useScryfallCard } from '../scryfall/hooks';
import { AddCopiesToDeckModal } from './AddCopiesToDeckModal';

export function useSharedCardMenu(signedIn: boolean) {
  const [deckCard, setDeckCard] = useState<Card | null>(null);
  const [collectionCard, setCollectionCard] = useState<Card | null>(null);
  const printing = useScryfallCard(collectionCard?.scryfall_id);

  function menuFor(card: Card, imageUrl: string | undefined) {
    return (
      <>
        {signedIn && (
          <>
            <Menu.Item onClick={() => setDeckCard(card)}>Ajouter à un de mes decks</Menu.Item>
            <Menu.Item onClick={() => setCollectionCard(card)}>Ajouter à ma collection</Menu.Item>
            <Menu.Divider />
          </>
        )}
        <CardCopyItems card={card} imageUrl={imageUrl} />
      </>
    );
  }

  const modals = signedIn && (
    <>
      <AddCopiesToDeckModal card={deckCard} onClose={() => setDeckCard(null)} />
      <AddCardModal
        card={collectionCard ? { name: collectionCard.name, printing: printing.data ?? undefined } : null}
        onClose={() => setCollectionCard(null)}
        defaultStorageId={undefined}
      />
    </>
  );

  return { menuFor, modals };
}
