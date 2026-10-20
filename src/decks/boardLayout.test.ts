import { describe, expect, it } from 'vitest';
import type { DeckCardSort } from '../api/types';
import type { CardGroup } from '../cards/grouping';
import type { ScryfallCard } from '../scryfall/client';
import {
  delverOfSecrets,
  forest,
  grizzlyBears,
  serraAngel,
  solRing,
  sproutingThrinax,
  tarmogoyf,
  westvaleAbbey,
} from '../scryfall/fixtures';
import { boardsInput, copies, deckCard, pendingCard } from './boardTestHelpers';
import { buildDeckBoards } from './boardLayout';
import type { DeckEntry } from './deckEntries';

function names(cards: { name: string }[]) {
  return cards.map((card) => card.name);
}

describe('buildDeckBoards boards', () => {
  it('splits the cards into main, sideboard and considering', () => {
    const cards = [
      deckCard(grizzlyBears),
      deckCard(solRing, { board: 'sideboard' }),
      deckCard(serraAngel, { board: 'considering' }),
      deckCard(forest),
      deckCard(tarmogoyf, { board: 'sideboard' }),
    ];
    const boards = buildDeckBoards(boardsInput(cards, [grizzlyBears, solRing, serraAngel, forest, tarmogoyf]));
    expect(names(boards.main.stacks)).toEqual(['Forest', 'Grizzly Bears']);
    expect(names(boards.sideboard.stacks)).toEqual(['Sol Ring', 'Tarmogoyf']);
    expect(names(boards.considering.stacks)).toEqual(['Serra Angel']);
  });

  it('counts the copies of each board', () => {
    const cards = [...copies(3, forest), deckCard(solRing, { board: 'sideboard', quantity: 2 })];
    const boards = buildDeckBoards(boardsInput(cards, [forest, solRing]));
    expect([boards.main.count, boards.sideboard.count, boards.considering.count]).toEqual([3, 2, 0]);
  });
});

function stackSummary(entries: DeckEntry[]) {
  return entries.map((entry) => [entry.name, entry.quantity]);
}

function stackKinds(entries: DeckEntry[]) {
  return entries.map((entry) => entry.kind);
}

describe('buildDeckBoards stacks', () => {
  it('stacks identical copies whatever their storage', () => {
    const cards = [
      ...copies(2, forest, { storage_id: 1 }),
      deckCard(forest, { storage_id: 2 }),
      deckCard(forest, { foil: true }),
      deckCard(grizzlyBears),
    ];
    const boards = buildDeckBoards(boardsInput(cards, [forest, grizzlyBears]));
    expect(stackSummary(boards.main.stacks)).toEqual([
      ['Forest', 3],
      ['Forest', 1],
      ['Grizzly Bears', 1],
    ]);
    expect(boards.main.stacks[0]).toMatchObject({ kind: 'owned', copy_ids: cards.slice(0, 3).map((card) => card.id) });
  });

  it('keeps copies from different storages apart when asked', () => {
    const cards = [...copies(2, forest, { storage_id: 1 }), deckCard(forest, { storage_id: 2 })];
    const boards = buildDeckBoards(boardsInput(cards, [forest], { separateByStorage: true }));
    expect(stackSummary(boards.main.stacks)).toEqual([
      ['Forest', 2],
      ['Forest', 1],
    ]);
  });

  it('adds up entries that already carry a quantity', () => {
    const cards = [deckCard(forest, { quantity: 3 }), deckCard(forest, { quantity: 2 })];
    const boards = buildDeckBoards(boardsInput(cards, [forest]));
    expect(stackSummary(boards.main.stacks)).toEqual([['Forest', 5]]);
    expect(boards.main.count).toBe(5);
  });

  it('stacks the copies of a pending card apart from the owned ones', () => {
    const cards = [...copies(2, forest), deckCard(grizzlyBears)];
    const pending = [pendingCard(forest, { id: 4, quantity: 2 })];
    const boards = buildDeckBoards(boardsInput(cards, [forest, grizzlyBears], { pending }));
    expect(stackSummary(boards.main.stacks)).toEqual([
      ['Forest', 2],
      ['Forest', 2],
      ['Grizzly Bears', 1],
    ]);
    expect(stackKinds(boards.main.stacks)).toEqual(['owned', 'pending', 'owned']);
  });

  it('keeps a pending card of 150 copies apart from the next pending card', () => {
    const pending = [pendingCard(forest, { id: 1, quantity: 150 }), pendingCard(forest, { id: 2, quantity: 3 })];
    const boards = buildDeckBoards(boardsInput([], [forest], { pending }));
    expect(stackSummary(boards.main.stacks)).toEqual([
      ['Forest', 150],
      ['Forest', 3],
    ]);
    expect(boards.main.stacks.map((entry) => entry.kind === 'pending' && entry.pending.id)).toEqual([1, 2]);
    expect(boards.main.count).toBe(153);
  });
});

describe('buildDeckBoards commanders', () => {
  it('puts the commanders first, each alone in its stack', () => {
    const partner = deckCard(tarmogoyf);
    const commander = deckCard(serraAngel);
    const cards = [deckCard(forest), deckCard(serraAngel), commander, partner, deckCard(tarmogoyf)];
    const boards = buildDeckBoards(
      boardsInput(cards, [forest, serraAngel, tarmogoyf], {
        commanders: [{ cardId: commander.id }, { cardId: partner.id }],
      }),
    );
    expect(boards.main.stacks.map((entry) => entry.key)).toEqual(
      [commander, partner, cards[0], cards[1], cards[4]].map((card) => `owned-${card.id}`),
    );
    expect(boards.main.stacks.slice(0, 2).map((card) => card.quantity)).toEqual([1, 1]);
  });

  it('marks the commander stacks of each board', () => {
    const commander = deckCard(serraAngel, { board: 'sideboard' });
    const cards = [deckCard(serraAngel), commander, deckCard(forest)];
    const boards = buildDeckBoards(
      boardsInput(cards, [serraAngel, forest], { commanders: [{ cardId: commander.id }] }),
    );
    expect([...boards.main.commanders]).toEqual([]);
    expect([...boards.sideboard.commanders]).toEqual([`owned-${commander.id}`]);
  });

  it('puts a pending commander first', () => {
    const pending = [pendingCard(serraAngel, { id: 7, quantity: 1 })];
    const boards = buildDeckBoards(
      boardsInput([deckCard(forest)], [forest, serraAngel], { pending, commanders: [{ pendingId: 7 }] }),
    );
    expect(names(boards.main.stacks)).toEqual(['Serra Angel', 'Forest']);
  });
});

const valakutAwakening: ScryfallCard = {
  id: 'fixture-valakut-awakening',
  layout: 'modal_dfc',
  name: 'Valakut Awakening // Valakut Stoneforge',
  set: 'znr',
  set_name: 'Zendikar Rising',
  collector_number: '174',
  released_at: '2020-09-25',
  cmc: 3,
  type_line: 'Instant // Land',
  rarity: 'uncommon',
  color_identity: ['R'],
  card_faces: [
    { name: 'Valakut Awakening', mana_cost: '{2}{R}', type_line: 'Instant', colors: ['R'] },
    { name: 'Valakut Stoneforge', mana_cost: '', type_line: 'Land', colors: [] },
  ],
};

function groupSummary(groups: CardGroup<{ name: string }>[] | null) {
  return groups?.map((group) => [group.label, names(group.cards)]) ?? null;
}

describe('buildDeckBoards groups', () => {
  it('groups by the type of the front face and notes the back faces of another type', () => {
    const cards = [
      ...copies(2, valakutAwakening),
      deckCard(westvaleAbbey),
      deckCard(grizzlyBears, { card_type: null }),
      deckCard(forest),
      deckCard(solRing),
    ];
    const printings = [valakutAwakening, westvaleAbbey, grizzlyBears, forest, solRing];
    const boards = buildDeckBoards(boardsInput(cards, printings, { grouping: 'type' }));
    expect(groupSummary(boards.main.groups)).toEqual([
      ['Créatures', ['Grizzly Bears']],
      ['Éphémères', ['Valakut Awakening // Valakut Stoneforge']],
      ['Artefacts', ['Sol Ring']],
      ['Terrains', ['Forest', 'Westvale Abbey // Ormendahl, Profane Prince']],
    ]);
    expect(Object.fromEntries(boards.main.backFaces)).toEqual({
      Terrains: [{ name: 'Valakut Awakening // Valakut Stoneforge', quantity: 2 }],
      Créatures: [{ name: 'Westvale Abbey // Ormendahl, Profane Prince', quantity: 1 }],
    });
  });

  it('groups by colour', () => {
    const cards = [
      deckCard(forest),
      deckCard(sproutingThrinax),
      deckCard(solRing),
      deckCard(grizzlyBears),
      deckCard(serraAngel),
    ];
    const printings = [forest, sproutingThrinax, solRing, grizzlyBears, serraAngel];
    const boards = buildDeckBoards(boardsInput(cards, printings, { grouping: 'color' }));
    expect(groupSummary(boards.main.groups)).toEqual([
      ['Blanc', ['Serra Angel']],
      ['Vert', ['Grizzly Bears']],
      ['Multicolore', ['Sprouting Thrinax']],
      ['Incolore', ['Sol Ring']],
      ['Terrains', ['Forest']],
    ]);
  });

  it('groups by mana value', () => {
    const cards = [deckCard(serraAngel), deckCard(grizzlyBears), deckCard(solRing), deckCard(tarmogoyf)];
    const printings = [serraAngel, grizzlyBears, solRing, tarmogoyf];
    const boards = buildDeckBoards(boardsInput(cards, printings, { grouping: 'mana' }));
    expect(groupSummary(boards.main.groups)).toEqual([
      ['Coût de mana 1', ['Sol Ring']],
      ['Coût de mana 2', ['Grizzly Bears', 'Tarmogoyf']],
      ['Coût de mana 5', ['Serra Angel']],
    ]);
  });

  it('groups by subtype, listing a card under each of its subtypes', () => {
    const cards = [deckCard(delverOfSecrets), deckCard(grizzlyBears), deckCard(solRing)];
    const printings = [delverOfSecrets, grizzlyBears, solRing];
    const boards = buildDeckBoards(boardsInput(cards, printings, { grouping: 'subtype' }));
    expect(groupSummary(boards.main.groups)).toEqual([
      ['Bear', ['Grizzly Bears']],
      ['Human', ['Delver of Secrets // Insectile Aberration']],
      ['Insect', ['Delver of Secrets // Insectile Aberration']],
      ['Wizard', ['Delver of Secrets // Insectile Aberration']],
      ['Sans sous-type', ['Sol Ring']],
    ]);
  });

  it('groups by storage, the pending cards first', () => {
    const cards = [
      deckCard(forest, { storage_id: 2 }),
      deckCard(grizzlyBears, { storage_id: 1 }),
      deckCard(serraAngel, { storage_id: 9 }),
      deckCard(solRing),
    ];
    const storageNames = new Map([
      [1, 'Classeur'],
      [2, 'Boîte à terrains'],
    ]);
    const boards = buildDeckBoards(
      boardsInput(cards, [forest, grizzlyBears, serraAngel, solRing, tarmogoyf], {
        pending: [pendingCard(tarmogoyf)],
        grouping: 'storage',
        separateByStorage: true,
        storageNames,
      }),
    );
    expect(groupSummary(boards.main.groups)).toEqual([
      ['Pas encore dans ta collection', ['Tarmogoyf']],
      ['Boîte à terrains', ['Forest']],
      ['Classeur', ['Grizzly Bears']],
      ['Rangement inconnu', ['Serra Angel']],
      ['Sans rangement', ['Sol Ring']],
    ]);
  });

  it('groups by tag, the untagged cards last', () => {
    const tags: Record<string, string[]> = {
      'Grizzly Bears': ['rampe', 'Élan'],
      Tarmogoyf: ['défense'],
    };
    const cards = [deckCard(grizzlyBears), deckCard(tarmogoyf), deckCard(solRing)];
    const boards = buildDeckBoards(
      boardsInput(cards, [grizzlyBears, tarmogoyf, solRing], {
        grouping: 'tag',
        tagsOf: (card) => tags[card.name] ?? [],
      }),
    );
    expect(groupSummary(boards.main.groups)).toEqual([
      ['défense', ['Tarmogoyf']],
      ['Élan', ['Grizzly Bears']],
      ['rampe', ['Grizzly Bears']],
      ['Sans tag', ['Sol Ring']],
    ]);
    expect(boards.main.groups?.map((group) => group.tag)).toEqual(['défense', 'Élan', 'rampe', null]);
  });

  it('leaves the stacks ungrouped without a grouping', () => {
    const boards = buildDeckBoards(boardsInput([deckCard(forest)], [forest]));
    expect(boards.main.groups).toBeNull();
  });
});

describe('buildDeckBoards sorts', () => {
  const cards = [
    deckCard(serraAngel, { price: 0.5, added: '2026-03-01', updated: '2026-03-05' }),
    deckCard(grizzlyBears, { price: null, added: '2026-01-01', updated: '2026-03-09' }),
    deckCard(solRing, { price: 2, added: '2026-02-01', updated: '2026-03-01' }),
    deckCard(tarmogoyf, { price: 20, added: '2026-04-01', updated: '2026-03-02' }),
  ];
  const printings = [serraAngel, grizzlyBears, solRing, tarmogoyf];

  it.each<[DeckCardSort, string[]]>([
    ['name', ['Grizzly Bears', 'Serra Angel', 'Sol Ring', 'Tarmogoyf']],
    ['-name', ['Tarmogoyf', 'Sol Ring', 'Serra Angel', 'Grizzly Bears']],
    ['mana_value', ['Sol Ring', 'Grizzly Bears', 'Tarmogoyf', 'Serra Angel']],
    ['-mana_value', ['Serra Angel', 'Grizzly Bears', 'Tarmogoyf', 'Sol Ring']],
    ['price', ['Serra Angel', 'Sol Ring', 'Tarmogoyf', 'Grizzly Bears']],
    ['-price', ['Tarmogoyf', 'Sol Ring', 'Serra Angel', 'Grizzly Bears']],
    ['added', ['Grizzly Bears', 'Sol Ring', 'Serra Angel', 'Tarmogoyf']],
    ['-added', ['Tarmogoyf', 'Serra Angel', 'Sol Ring', 'Grizzly Bears']],
    ['updated', ['Sol Ring', 'Tarmogoyf', 'Serra Angel', 'Grizzly Bears']],
    ['-updated', ['Grizzly Bears', 'Serra Angel', 'Tarmogoyf', 'Sol Ring']],
  ])('sorts by %s', (sort, expected) => {
    expect(names(buildDeckBoards(boardsInput(cards, printings, { sort })).main.stacks)).toEqual(expected);
  });

  it('sorts the cards inside each group', () => {
    const boards = buildDeckBoards(boardsInput(cards, printings, { sort: '-mana_value', grouping: 'type' }));
    expect(groupSummary(boards.main.groups)).toEqual([
      ['Créatures', ['Serra Angel', 'Grizzly Bears', 'Tarmogoyf']],
      ['Artefacts', ['Sol Ring']],
    ]);
  });
});

describe('buildDeckBoards empty boards', () => {
  it('returns every board, empty when it has no card', () => {
    const boards = buildDeckBoards(
      boardsInput([deckCard(forest, { board: 'considering' })], [forest], { grouping: 'type' }),
    );
    expect([boards.main, boards.sideboard].map(({ stacks, groups, count }) => ({ stacks, groups, count }))).toEqual([
      { stacks: [], groups: [], count: 0 },
      { stacks: [], groups: [], count: 0 },
    ]);
    expect(boards.considering.count).toBe(1);
  });

  it('returns empty boards for an empty deck', () => {
    const boards = buildDeckBoards(boardsInput([], []));
    expect(Object.values(boards).map((board) => [board.board, board.count, board.stacks.length])).toEqual([
      ['main', 0, 0],
      ['sideboard', 0, 0],
      ['considering', 0, 0],
    ]);
  });
});
