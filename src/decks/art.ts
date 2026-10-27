import type { Deck } from '../api/types';
import { type CardArt, type CardFace, meldResultId, type ScryfallCard } from '../scryfall/client';
import type { PrintingFaces } from '../scryfall/faces';
import { usePrintingFaces } from '../scryfall/hooks';

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

// A meld card's back is the melded card, a printing of its own shown on its front.
export function backArtChoice(card: ScryfallCard): ArtChoice & { name: string } {
  const meldId = meldResultId(card);
  if (meldId) {
    const melded = card.all_parts?.find((part) => part.id === meldId);
    return { scryfallId: meldId, face: 'front', name: melded?.name ?? card.name };
  }
  return { scryfallId: card.id, face: 'back', name: card.card_faces?.[1]?.name ?? card.name };
}

// A printing without art on the chosen face shows its front art.
export function choiceArt(faces: PrintingFaces, face: CardFace): CardArt | null {
  return (face === 'back' ? faces.back?.art : null) ?? faces.front.art;
}

export function useDeckArts(decks: ArtDeck[]) {
  const choices = decks.map(deckArtChoice).filter((choice) => choice !== null);
  const faces = usePrintingFaces(choices.map((choice) => choice.scryfallId));
  return (deck: ArtDeck): CardArt | null => {
    const choice = deckArtChoice(deck);
    const printing = choice ? faces.data[choice.scryfallId] : undefined;
    return choice && printing ? choiceArt(printing, choice.face) : null;
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
