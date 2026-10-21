import { describe, expect, it } from 'vitest';

import { commanderSpellbookUrl } from './combos';

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
