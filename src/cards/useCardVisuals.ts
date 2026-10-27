import type { PrintingFaces } from '../scryfall/faces';
import { useManaCosts, usePrintingFaces } from '../scryfall/hooks';
import type { CardDisplay } from './CardDisplay';

interface ScryfallPrinting {
  scryfall_id: string;
}

export interface CardVisuals {
  faces: (card: ScryfallPrinting) => PrintingFaces | undefined;
  imageUrl: (card: ScryfallPrinting) => string | undefined;
  manaCost: (card: ScryfallPrinting) => string | null | undefined;
  imageLoading: boolean;
  imagesFetching: boolean;
}

export function useCardVisuals(
  cards: readonly ScryfallPrinting[],
  display: Pick<CardDisplay, 'showManaCost'>,
): CardVisuals {
  const ids = cards.map((card) => card.scryfall_id);
  const faces = usePrintingFaces(ids);
  const manaCosts = useManaCosts(ids);
  const hideManaCost = !display.showManaCost || manaCosts.isLoading;
  return {
    faces: (card) => faces.data[card.scryfall_id],
    imageUrl: (card) => faces.data[card.scryfall_id]?.front.images.normal,
    manaCost: (card) => (hideManaCost ? undefined : (manaCosts.data?.[card.scryfall_id] ?? null)),
    imageLoading: faces.isLoading,
    imagesFetching: faces.isFetching,
  };
}
