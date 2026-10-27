import type { Deck } from '../api/types';
import { type CardArt, type CardFace, cardArt } from '../scryfall/client';
import { useScryfallCards } from '../scryfall/hooks';

type ArtDeck = Pick<Deck, 'background_scryfall_id' | 'background_face' | 'commander_scryfall_id'>;

export interface ArtChoice {
  scryfallId: string;
  face: CardFace;
}

export function deckArtChoice(deck: ArtDeck): ArtChoice | null {
  if (deck.background_scryfall_id) {
    return { scryfallId: deck.background_scryfall_id, face: deck.background_face };
  }
  return deck.commander_scryfall_id ? { scryfallId: deck.commander_scryfall_id, face: 'front' } : null;
}

export function useDeckArts(decks: ArtDeck[]) {
  const choices = decks.map(deckArtChoice).filter((choice) => choice !== null);
  const cards = useScryfallCards(choices.map((choice) => choice.scryfallId));
  return (deck: ArtDeck): CardArt | null => {
    const choice = deckArtChoice(deck);
    const card = choice ? cards.data?.[choice.scryfallId] : undefined;
    return choice && card ? cardArt(card, choice.face) : null;
  };
}

export function artBackground(url: string, strength: 'light' | 'strong' = 'strong') {
  const [top, bottom] = strength === 'strong' ? [0.45, 0.85] : [0.25, 0.75];
  return {
    backgroundImage: `linear-gradient(rgba(0, 0, 0, ${top}), rgba(0, 0, 0, ${bottom})), url("${url}")`,
    backgroundSize: 'cover',
    backgroundPosition: 'center 30%',
  };
}

export function artCredit(artist: string | null) {
  return artist ? `Illustration : ${artist} · © Wizards of the Coast` : 'Illustration © Wizards of the Coast';
}
