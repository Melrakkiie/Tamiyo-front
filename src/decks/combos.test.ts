import { describe, expect, it } from 'vitest';

import { comboDeckList, commanderSpellbookUrl } from './combos';

describe('commanderSpellbookUrl', () => {
  it('pre-fills the decklist and the commanders, one name per line', () => {
    const url = new URL(
      commanderSpellbookUrl({
        main: ['Sol Ring', 'Delver of Secrets // Insectile Aberration'],
        commanders: ['Atraxa'],
      }),
    );

    expect(url.origin + url.pathname).toBe('https://commanderspellbook.com/find-my-combos/');
    expect(url.searchParams.get('decklist')).toBe('Sol Ring\nDelver of Secrets // Insectile Aberration');
    expect(url.searchParams.get('commanders')).toBe('Atraxa');
  });

  it('escapes names so they survive the query string', () => {
    const url = commanderSpellbookUrl({ main: ['Fire & Ice'], commanders: [] });

    expect(url).toBe('https://commanderspellbook.com/find-my-combos/?decklist=Fire%20%26%20Ice&commanders=');
  });
});

describe('comboDeckList', () => {
  it('keeps the main board only and puts the commanders apart', () => {
    expect(
      comboDeckList([
        { name: 'Atraxa', board: 'main', commander: true },
        { name: 'Sol Ring', board: 'main', commander: false },
        { name: 'Swords to Plowshares', board: 'sideboard', commander: false },
        { name: 'Craterhoof Behemoth', board: 'considering', commander: false },
      ]),
    ).toEqual({ main: ['Sol Ring'], commanders: ['Atraxa'] });
  });

  it('lists each name once', () => {
    expect(
      comboDeckList([
        { name: 'Island', board: 'main', commander: false },
        { name: 'Island', board: 'main', commander: false },
        { name: 'Tymna', board: 'main', commander: true },
        { name: 'Tymna', board: 'main', commander: false },
      ]),
    ).toEqual({ main: ['Island'], commanders: ['Tymna'] });
  });
});
