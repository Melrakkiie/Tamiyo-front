import { type AdvancedFilters, COLORLESS, type ComparisonOp } from '../cards/advancedFilters';
import { cardColors, cardManaValue, type ScryfallCard } from '../scryfall/client';

export type LibraryFilters = Pick<
  AdvancedFilters,
  | 'colors'
  | 'colorMode'
  | 'manaValue'
  | 'manaValueOp'
  | 'power'
  | 'powerOp'
  | 'toughness'
  | 'toughnessOp'
  | 'type'
  | 'subtype'
>;

export const emptyLibraryFilters: LibraryFilters = {
  colors: '',
  colorMode: 'exact',
  manaValue: null,
  manaValueOp: 'eq',
  power: null,
  powerOp: 'eq',
  toughness: null,
  toughnessOp: 'eq',
  type: null,
  subtype: '',
};

export function activeLibraryFilterCount(filters: LibraryFilters) {
  return [
    filters.colors !== '',
    filters.manaValue !== null,
    filters.power !== null,
    filters.toughness !== null,
    filters.type !== null,
    filters.subtype.trim() !== '',
  ].filter(Boolean).length;
}

export function normalized(text: string) {
  return text
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase();
}

const NUMERIC_STAT = /^-?[0-9]*\.?[0-9]+$/;

function compare(value: number, op: ComparisonOp, target: number) {
  switch (op) {
    case 'lt':
      return value < target;
    case 'lte':
      return value <= target;
    case 'gt':
      return value > target;
    case 'gte':
      return value >= target;
    default:
      return value === target;
  }
}

function statMatches(stats: (string | undefined)[], op: ComparisonOp, target: number) {
  return stats.some((stat) => stat !== undefined && NUMERIC_STAT.test(stat) && compare(Number(stat), op, target));
}

function colorsMatch(card: ScryfallCard, filters: LibraryFilters) {
  const colors = new Set(cardColors(card));
  if (filters.colors === COLORLESS) {
    return colors.size === 0;
  }
  const wanted = [...filters.colors];
  switch (filters.colorMode) {
    case 'include':
      return wanted.every((color) => colors.has(color));
    case 'within':
      return [...colors].every((color) => wanted.includes(color));
    default:
      return colors.size === wanted.length && wanted.every((color) => colors.has(color));
  }
}

function typeLines(card: ScryfallCard) {
  const faces = (card.card_faces ?? []).map((face) => face.type_line).filter((line): line is string => !!line);
  return faces.length > 0 ? faces : (card.type_line ?? '').split('//');
}

function escaped(text: string) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function matchesLibraryFilters(card: ScryfallCard | undefined, filters: LibraryFilters) {
  if (activeLibraryFilterCount(filters) === 0) {
    return true;
  }
  if (!card) {
    return false;
  }
  if (filters.colors !== '' && !colorsMatch(card, filters)) {
    return false;
  }
  if (filters.manaValue !== null && !compare(cardManaValue(card), filters.manaValueOp, filters.manaValue)) {
    return false;
  }
  const faces = card.card_faces ?? [];
  if (
    filters.power !== null &&
    !statMatches([card.power, ...faces.map((face) => face.power)], filters.powerOp, filters.power)
  ) {
    return false;
  }
  if (
    filters.toughness !== null &&
    !statMatches([card.toughness, ...faces.map((face) => face.toughness)], filters.toughnessOp, filters.toughness)
  ) {
    return false;
  }
  const lines = typeLines(card).map((line) => {
    const [types, subtypes = ''] = line.split('—');
    return { types, subtypes };
  });
  if (filters.type !== null) {
    const word = new RegExp(`\\b${escaped(filters.type)}\\b`, 'i');
    if (!lines.some((line) => word.test(line.types))) {
      return false;
    }
  }
  const subtype = normalized(filters.subtype.trim());
  if (subtype !== '' && !lines.some((line) => normalized(line.subtypes).includes(subtype))) {
    return false;
  }
  return true;
}
