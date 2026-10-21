import { describe, expect, it } from 'vitest';

import { cardLinks } from './cardLinks';

const printing = (name: string, set = 'cmm', collectorNumber = '1') => ({ name, set, collectorNumber });

describe('cardLinks scryfall', () => {
  it('points to the printing page', () => {
    expect(cardLinks(printing('Sol Ring', 'cmm', '400')).scryfall).toBe('https://scryfall.com/card/cmm/400');
  });

  it('lowercases the set code', () => {
    expect(cardLinks(printing('Sol Ring', 'CMM', '400')).scryfall).toBe('https://scryfall.com/card/cmm/400');
  });

  it('encodes collector numbers holding a star or a letter', () => {
    expect(cardLinks(printing('Sol Ring', 'plst', '12★')).scryfall).toBe('https://scryfall.com/card/plst/12%E2%98%85');
    expect(cardLinks(printing('Sol Ring', 'plst', '12a')).scryfall).toBe('https://scryfall.com/card/plst/12a');
  });
});

describe('cardLinks edhrec', () => {
  const edhrec = (name: string) => cardLinks(printing(name)).edhrec;

  it('slugs a plain name', () => {
    expect(edhrec('Sol Ring')).toBe('https://edhrec.com/cards/sol-ring');
  });

  it('drops apostrophes and commas', () => {
    expect(edhrec("Atraxa, Praetors' Voice")).toBe('https://edhrec.com/cards/atraxa-praetors-voice');
  });

  it('strips accents', () => {
    expect(edhrec('Lim-Dûl the Necromancer')).toBe('https://edhrec.com/cards/lim-dul-the-necromancer');
  });

  it('drops ampersands and collapses hyphens', () => {
    expect(edhrec('Fire & Ice')).toBe('https://edhrec.com/cards/fire-ice');
  });

  it('keeps the front face of a double-faced card', () => {
    expect(edhrec('Delver of Secrets // Insectile Aberration')).toBe('https://edhrec.com/cards/delver-of-secrets');
  });
});

describe('cardLinks commanderSpellbook', () => {
  const search = (name: string) => new URL(cardLinks(printing(name)).commanderSpellbook);

  it('searches the combos containing the card', () => {
    const url = search('Sol Ring');
    expect(url.origin + url.pathname).toBe('https://commanderspellbook.com/search/');
    expect(url.searchParams.get('q')).toBe('card="Sol Ring"');
  });

  it('keeps the front face of a double-faced card', () => {
    expect(search('Delver of Secrets // Insectile Aberration').searchParams.get('q')).toBe('card="Delver of Secrets"');
  });

  it('encodes characters that need it', () => {
    const link = cardLinks(printing('Fire & Ice')).commanderSpellbook;
    expect(link).not.toContain('&Ice');
    expect(new URL(link).searchParams.get('q')).toBe('card="Fire & Ice"');
  });
});
