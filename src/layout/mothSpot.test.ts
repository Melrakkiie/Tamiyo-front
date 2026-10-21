import { describe, expect, it } from 'vitest';

import { mothSize, restingOffset, splitLastLetter } from './mothSpot';

describe('splitLastLetter', () => {
  it('splits a title before its last letter', () => {
    expect(splitLastLetter("Le carnet d'Aurore")).toEqual({ head: "Le carnet d'Auror", last: 'e' });
  });

  it('keeps a combining accent with its letter', () => {
    expect(splitLastLetter('Le carnet de Zoë')).toEqual({ head: 'Le carnet de Zo', last: 'ë' });
  });

  it('keeps an emoji whole', () => {
    expect(splitLastLetter('Le carnet de Lune 🌙')).toEqual({ head: 'Le carnet de Lune ', last: '🌙' });
  });

  it('perches a single letter on itself', () => {
    expect(splitLastLetter('A')).toEqual({ head: '', last: 'A' });
  });
});

describe('mothSize', () => {
  it('keeps the nav moth at 16px on a 16px perch', () => {
    expect(mothSize(16).height).toBe(16);
    expect(mothSize(16).width).toBeCloseTo(13.714, 3);
  });

  it('grows with the perch font', () => {
    expect(mothSize(40).height).toBe(40);
    expect(mothSize(40).width).toBeCloseTo(34.286, 3);
  });
});

describe('restingOffset', () => {
  it('sets the belly on the letter tip of a 16px perch', () => {
    const spot = restingOffset(16, { x: 10, y: 3 });
    expect(spot.left).toBeCloseTo(4.143, 3);
    expect(spot.top).toBeCloseTo(-4.48, 3);
  });

  it('scales the nudge with the perch font', () => {
    const spot = restingOffset(32, { x: 20, y: 6 });
    expect(spot.left).toBeCloseTo(8.286, 3);
    expect(spot.top).toBeCloseTo(-8.96, 3);
  });

  it('centres on the perch corner when no tip was found', () => {
    const spot = restingOffset(16, null);
    expect(spot.left).toBeCloseTo(-6.857, 3);
    expect(spot.top).toBeCloseTo(-8.48, 3);
  });
});
