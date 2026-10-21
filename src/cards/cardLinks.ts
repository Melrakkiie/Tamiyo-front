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

export function cardLinks({ set, collectorNumber }: CardPrinting): CardLinks {
  return {
    scryfall: `https://scryfall.com/card/${set.toLowerCase()}/${encodeURIComponent(collectorNumber)}`,
    edhrec: '',
    commanderSpellbook: '',
  };
}
