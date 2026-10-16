import { colorCode, primaryType } from './classify';
import { cardColors, cardManaValue, type ScryfallCard } from './client';

export function canBeNonFoil(printing: ScryfallCard) {
  return printing.finishes ? printing.finishes.includes('nonfoil') : true;
}

export function canBeFoil(printing: ScryfallCard) {
  return printing.finishes ? printing.finishes.some((finish) => finish === 'foil' || finish === 'etched') : true;
}

export function foilFor(printing: ScryfallCard, wanted: boolean) {
  if (wanted) {
    return canBeFoil(printing) || !canBeNonFoil(printing);
  }
  return !canBeNonFoil(printing) && canBeFoil(printing);
}

export function printingDetails(printing: ScryfallCard) {
  const typeLine = printing.type_line ?? printing.card_faces?.[0]?.type_line;
  return {
    name: printing.name,
    scryfall_id: printing.id,
    set_code: printing.set,
    collector_number: printing.collector_number,
    mana_value: cardManaValue(printing),
    colors: colorCode(cardColors(printing)),
    card_type: typeLine ? primaryType(typeLine) : null,
    color_identity: printing.color_identity ? colorCode(printing.color_identity) : null,
  };
}

function normalize(text: string) {
  return text
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase();
}

export function matchesEdition(query: string, setName: string | undefined, setCode: string) {
  const wanted = normalize(query.trim());
  if (!wanted) {
    return true;
  }
  return normalize(setName ?? '').includes(wanted) || normalize(setCode).includes(wanted);
}
