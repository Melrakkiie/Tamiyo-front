import { type AdvancedFilters, COLORLESS, type ColorMode, type ComparisonOp } from '../cards/advancedFilters';
import {
  allOf,
  colorlessTerm,
  colorTerm,
  type Op,
  type QueryNode,
  statTerm,
  subtypeTerm,
  typeTerm,
} from '../scryfall/query';

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

const comparisonOperators = { eq: '=', lt: '<', lte: '<=', gt: '>', gte: '>=' } as const satisfies Record<
  ComparisonOp,
  Op
>;
const colorOperators = { exact: '=', include: '>=', within: '<=' } as const satisfies Record<ColorMode, Op>;

export function libraryFiltersToQuery(filters: LibraryFilters): QueryNode | null {
  const subtype = filters.subtype.trim();
  return allOf([
    filters.colors === ''
      ? null
      : filters.colors === COLORLESS
        ? colorlessTerm()
        : colorTerm(colorOperators[filters.colorMode], filters.colors),
    filters.manaValue === null
      ? null
      : statTerm('manaValue', comparisonOperators[filters.manaValueOp], filters.manaValue),
    filters.power === null ? null : statTerm('power', comparisonOperators[filters.powerOp], filters.power),
    filters.toughness === null
      ? null
      : statTerm('toughness', comparisonOperators[filters.toughnessOp], filters.toughness),
    filters.type === null ? null : typeTerm(filters.type),
    subtype === '' ? null : subtypeTerm(subtype),
  ]);
}
