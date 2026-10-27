import { type CardArt, type CardFace, imageUrl, isDoubleFaced, type ScryfallCard } from './client';

export interface PrintingFace {
  face: CardFace;
  name: string;
  images: { small: string | undefined; normal: string | undefined };
  art: CardArt | null;
  manaCost: string;
  // The printing and face a deck stores to show this face as its art (ADR-0010).
  deckArt: { scryfallId: string; face: CardFace };
}

export interface PrintingFaces {
  front: PrintingFace;
  back?: PrintingFace;
}

// An empty top-level cost counts as missing: double-faced cards carry theirs on their faces.
export function frontManaCost(card: ScryfallCard): string {
  return card.mana_cost || card.card_faces?.[0]?.mana_cost || '';
}

function frontFace(card: ScryfallCard): PrintingFace {
  const first = card.card_faces?.[0];
  const artUrl = card.image_uris?.art_crop ?? first?.image_uris?.art_crop;
  return {
    face: 'front',
    name: (isDoubleFaced(card) && first?.name) || card.name,
    images: { small: imageUrl(card, 'small'), normal: imageUrl(card, 'normal') },
    art: artUrl ? { url: artUrl, artist: card.artist ?? first?.artist ?? null } : null,
    manaCost: frontManaCost(card),
    deckArt: { scryfallId: card.id, face: 'front' },
  };
}

function backFace(card: ScryfallCard): PrintingFace | undefined {
  const second = isDoubleFaced(card) ? card.card_faces?.[1] : undefined;
  if (!second) {
    return undefined;
  }
  const artUrl = second.image_uris?.art_crop;
  return {
    face: 'back',
    name: second.name ?? card.name,
    images: { small: second.image_uris?.small, normal: second.image_uris?.normal },
    art: artUrl ? { url: artUrl, artist: second.artist ?? card.artist ?? null } : null,
    manaCost: second.mana_cost ?? '',
    deckArt: { scryfallId: card.id, face: 'back' },
  };
}

export function printingFaces(card: ScryfallCard): PrintingFaces {
  return { front: frontFace(card), back: backFace(card) };
}
