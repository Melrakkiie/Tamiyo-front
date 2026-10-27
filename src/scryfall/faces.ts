import { type CardArt, type CardFace, imageUrl, type ScryfallCard } from './client';

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
    name: card.name,
    images: { small: imageUrl(card, 'small'), normal: imageUrl(card, 'normal') },
    art: artUrl ? { url: artUrl, artist: card.artist ?? first?.artist ?? null } : null,
    manaCost: frontManaCost(card),
    deckArt: { scryfallId: card.id, face: 'front' },
  };
}

export function printingFaces(card: ScryfallCard): PrintingFaces {
  return { front: frontFace(card) };
}
