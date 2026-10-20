import { useCardBackImages, useCardImages, useManaCosts } from '../scryfall/hooks';
import type { CardDisplay } from './CardDisplay';

interface ScryfallPrinting {
  scryfall_id: string;
}

export interface CardVisuals {
  imageUrl: (card: ScryfallPrinting) => string | undefined;
  backImageUrl: (card: ScryfallPrinting) => string | undefined;
  manaCost: (card: ScryfallPrinting) => string | null | undefined;
  imageLoading: boolean;
  imagesFetching: boolean;
}

export function useCardVisuals(
  cards: readonly ScryfallPrinting[],
  display: Pick<CardDisplay, 'showManaCost'>,
): CardVisuals {
  const ids = cards.map((card) => card.scryfall_id);
  const images = useCardImages(ids);
  const backImages = useCardBackImages(ids);
  const manaCosts = useManaCosts(ids);
  const hideManaCost = !display.showManaCost || manaCosts.isLoading;
  return {
    imageUrl: (card) => images.data[card.scryfall_id],
    backImageUrl: (card) => backImages.data[card.scryfall_id],
    manaCost: (card) => (hideManaCost ? undefined : (manaCosts.data?.[card.scryfall_id] ?? null)),
    imageLoading: images.isLoading,
    imagesFetching: images.isFetching,
  };
}
