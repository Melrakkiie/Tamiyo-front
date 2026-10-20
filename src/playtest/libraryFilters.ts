import { type AdvancedFilters, COLORLESS, type ColorMode, type ComparisonOp } from '../cards/advancedFilters';
import { allOf, type Op, type QueryNode, term } from '../scryfall/query';

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

const operators = { eq: '=', lt: '<', lte: '<=', gt: '>', gte: '>=' } as const satisfies Record<ComparisonOp, Op>;
const colorOperators = { exact: '=', include: '>=', within: '<=' } as const satisfies Record<ColorMode, Op>;

export function libraryFiltersToQuery(filters: LibraryFilters): QueryNode | null {
  const nodes: QueryNode[] = [];
  if (filters.colors === COLORLESS) {
    nodes.push(term('color', '=', ''));
  } else if (filters.colors !== '') {
    nodes.push(term('color', colorOperators[filters.colorMode], filters.colors));
  }
  if (filters.manaValue !== null) {
    nodes.push(term('manaValue', operators[filters.manaValueOp], '', filters.manaValue));
  }
  if (filters.power !== null) {
    nodes.push(term('power', operators[filters.powerOp], '', filters.power));
  }
  if (filters.toughness !== null) {
    nodes.push(term('toughness', operators[filters.toughnessOp], '', filters.toughness));
  }
  if (filters.type !== null) {
    nodes.push(term('type', '=', filters.type));
  }
  if (filters.subtype.trim() !== '') {
    nodes.push(term('subtype', '=', filters.subtype.trim()));
  }
  return allOf(nodes);
}
