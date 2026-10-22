import { describe, expect, it } from 'vitest';
import { cardTileLabel } from './cardTileLabel';

describe('cardTileLabel', () => {
  it('names a single regular copy by its name', () => {
    expect(cardTileLabel({ name: 'Sol Ring', quantity: 1, foil: false })).toBe('Sol Ring');
  });

  it('says foil for a single foil copy', () => {
    expect(cardTileLabel({ name: 'Sol Ring', quantity: 1, foil: true })).toBe('Sol Ring, foil');
  });

  it('counts a stack of regular copies', () => {
    expect(cardTileLabel({ name: 'Sol Ring', quantity: 3, foil: false })).toBe('Sol Ring, 3 exemplaires');
  });

  it('says foil then the count for a stack of foils', () => {
    expect(cardTileLabel({ name: 'Sol Ring', quantity: 2, foil: true })).toBe('Sol Ring, foil, 2 exemplaires');
  });
});
