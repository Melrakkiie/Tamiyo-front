import type { Deck } from '../api/types';

export function deckArtId(deck: Deck): string | null {
  return deck.background_scryfall_id ?? deck.commander_scryfall_id ?? null;
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
