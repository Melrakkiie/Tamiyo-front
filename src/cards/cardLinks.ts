import { normalized } from '../scryfall/query';

export interface CardPrinting {
  name: string;
  set: string;
  collectorNumber: string;
}

export interface CardLinks {
  scryfall: string;
  edhrec: string;
  commanderSpellbook: string;
}

function frontFace(name: string) {
  return name.split(' // ')[0];
}

const transliterations: Record<string, string> = { æ: 'ae', ø: 'o', ß: 'ss' };

function edhrecSlug(name: string) {
  return normalized(frontFace(name))
    .replace(/[æøß]/g, (letter) => transliterations[letter])
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/[\s-]+/g, '-');
}

export function cardLinks({ name, set, collectorNumber }: CardPrinting): CardLinks {
  return {
    scryfall: `https://scryfall.com/card/${set.toLowerCase()}/${encodeURIComponent(collectorNumber)}`,
    edhrec: `https://edhrec.com/cards/${edhrecSlug(name)}`,
    commanderSpellbook: `https://commanderspellbook.com/search/?q=${encodeURIComponent(`card="${frontFace(name)}"`)}`,
  };
}
