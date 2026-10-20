import { describe, expect, it } from 'vitest';
import type { ScryfallCard } from '../scryfall/client';
import * as fixtures from '../scryfall/fixtures';
import { matchesScryfallQuery, type QueryNode } from '../scryfall/query';
import { parsedQuery } from '../scryfall/queryTestHelpers';
import {
  activeLibraryFilterCount,
  emptyLibraryFilters,
  type LibraryFilters,
  libraryFiltersToQuery,
} from './libraryFilters';

const cards: ScryfallCard[] = Object.values(fixtures);

function namesMatching(node: QueryNode | null) {
  return cards.filter((card) => matchesScryfallQuery(node, card, card.name)).map((card) => card.name);
}

function namesMatchingSearch(search: string) {
  return namesMatching(parsedQuery(search));
}

function namesMatchingFilters(changes: Partial<LibraryFilters>) {
  return namesMatching(libraryFiltersToQuery({ ...emptyLibraryFilters, ...changes }));
}

const equivalents: [string, Partial<LibraryFilters>, string][] = [
  ['colors exact', { colors: 'G', colorMode: 'exact' }, 'c=g'],
  ['colors exact, several', { colors: 'BRG', colorMode: 'exact' }, 'c=brg'],
  ['colors include', { colors: 'G', colorMode: 'include' }, 'c>=g'],
  ['colors include, several', { colors: 'RG', colorMode: 'include' }, 'c>=rg'],
  ['colors within', { colors: 'GU', colorMode: 'within' }, 'c<=gu'],
  ['colorless', { colors: 'C', colorMode: 'include' }, 'c=c'],
  ['mana value =', { manaValue: 2, manaValueOp: 'eq' }, 'mv=2'],
  ['mana value <', { manaValue: 2, manaValueOp: 'lt' }, 'mv<2'],
  ['mana value <=', { manaValue: 2, manaValueOp: 'lte' }, 'mv<=2'],
  ['mana value >', { manaValue: 2, manaValueOp: 'gt' }, 'mv>2'],
  ['mana value >=', { manaValue: 2, manaValueOp: 'gte' }, 'mv>=2'],
  ['power at least 3', { power: 3, powerOp: 'gte' }, 'pow>=3'],
  ['power =', { power: 2, powerOp: 'eq' }, 'pow=2'],
  ['power <', { power: 3, powerOp: 'lt' }, 'pow<3'],
  ['toughness at most 2', { toughness: 2, toughnessOp: 'lte' }, 'tou<=2'],
  ['toughness >', { toughness: 1, toughnessOp: 'gt' }, 'tou>1'],
  ['type creature', { type: 'Creature' }, 't:creature'],
  ['type land', { type: 'Land' }, 't:land'],
  ['type instant', { type: 'Instant' }, 't:instant'],
  ['type artifact', { type: 'Artifact' }, 't:artifact'],
  [
    'all filters at once',
    { colors: 'G', colorMode: 'include', power: 2, powerOp: 'gte', type: 'Creature' },
    'c>=g pow>=2 t:creature',
  ],
];

describe('libraryFiltersToQuery', () => {
  it('gives nothing when no filter is set', () => {
    expect(libraryFiltersToQuery(emptyLibraryFilters)).toBeNull();
  });

  it('gives nothing for a blank subtype', () => {
    expect(libraryFiltersToQuery({ ...emptyLibraryFilters, subtype: '   ' })).toBeNull();
  });

  it.each(equivalents)('%s matches the same cards as its typed search', (_label, changes, search) => {
    const expected = namesMatchingSearch(search);
    expect(expected.length).toBeGreaterThan(0);
    expect(namesMatchingFilters(changes)).toEqual(expected);
  });

  it('finds colorless cards only for the colorless choice', () => {
    expect(namesMatchingFilters({ colors: 'C' })).toEqual(['Sol Ring', 'Forest']);
  });

  it('ignores non-numeric power', () => {
    expect(namesMatchingFilters({ power: 0, powerOp: 'gte' })).not.toContain('Tarmogoyf');
  });

  it('finds a creature on a back face with the type filter', () => {
    expect(namesMatchingFilters({ type: 'Creature' })).toContain('Westvale Abbey // Ormendahl, Profane Prince');
  });

  describe('subtype', () => {
    it('matches the part after the dash, ignoring case and accents', () => {
      expect(namesMatchingFilters({ subtype: ' bear ' })).toEqual(['Grizzly Bears']);
    });

    it('matches either face of a double-faced card', () => {
      expect(namesMatchingFilters({ subtype: 'Bird' })).toEqual([fixtures.alrundGodOfTheCosmos.name]);
      expect(namesMatchingFilters({ subtype: 'Demon' })).toEqual([fixtures.westvaleAbbey.name]);
      expect(namesMatchingFilters({ subtype: 'Insect' })).toEqual([fixtures.delverOfSecrets.name]);
    });

    it('does not match types before the dash', () => {
      expect(namesMatchingFilters({ subtype: 'Creature' })).toEqual([]);
    });
  });

  it('joins several filters with AND', () => {
    expect(namesMatchingFilters({ subtype: 'Human', type: 'Artifact' })).toEqual(['Esper Sentinel']);
  });
});

describe('activeLibraryFilterCount', () => {
  it('counts each active filter once', () => {
    expect(activeLibraryFilterCount(emptyLibraryFilters)).toBe(0);
    expect(activeLibraryFilterCount({ ...emptyLibraryFilters, colors: 'G', power: 1, subtype: 'Elf' })).toBe(3);
  });
});
