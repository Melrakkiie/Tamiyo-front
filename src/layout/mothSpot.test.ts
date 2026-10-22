import { describe, expect, it } from 'vitest';

import { flightPose, isRendered, mothSize, pickPerch, restingOffset, splitLastSymbol } from './mothSpot';

describe('flightPose', () => {
  const growing = { dx: 100, dy: -50, fromHeight: 16, toHeight: 32 };

  it('starts at the old size, with the old belly point where the old moth was', () => {
    const pose = flightPose(growing, 0);
    expect(pose.scale).toBeCloseTo(0.5, 5);
    expect(pose.x).toBeCloseTo(93.143, 3);
    expect(pose.y).toBeCloseTo(-58.48, 3);
  });

  it('grows halfway at half progress', () => {
    const pose = flightPose(growing, 0.5);
    expect(pose.scale).toBeCloseTo(0.75, 5);
    expect(pose.x).toBeCloseTo(46.571, 3);
    expect(pose.y).toBeCloseTo(-29.24, 3);
  });

  it('ends at full size exactly on the perch', () => {
    const pose = flightPose(growing, 1);
    expect(pose.x).toBeCloseTo(0, 5);
    expect(pose.y).toBeCloseTo(0, 5);
    expect(pose.scale).toBe(1);
  });

  it('shrinks from a bigger moth', () => {
    const pose = flightPose({ dx: 0, dy: 0, fromHeight: 32, toHeight: 16 }, 0);
    expect(pose.scale).toBeCloseTo(2, 5);
    expect(pose.x).toBeCloseTo(6.857, 3);
    expect(pose.y).toBeCloseTo(8.48, 3);
  });

  it('keeps a same-size flight a pure translation', () => {
    expect(flightPose({ dx: 30, dy: 10, fromHeight: 16, toHeight: 16 }, 0.25)).toEqual({ x: 22.5, y: 7.5, scale: 1 });
  });
});

describe('isRendered', () => {
  it('rejects the zero box of a hidden element', () => {
    expect(isRendered({ width: 0, height: 0 })).toBe(false);
  });

  it('accepts a laid out element', () => {
    expect(isRendered({ width: 40, height: 18 })).toBe(true);
  });
});

describe('splitLastSymbol', () => {
  it('splits a title before its last letter', () => {
    expect(splitLastSymbol("Le carnet d'Aurore")).toEqual({ head: "Le carnet d'Auror", last: 'e', tail: '' });
  });

  it('keeps a combining accent with its letter', () => {
    expect(splitLastSymbol('Le carnet de Zoë')).toEqual({ head: 'Le carnet de Zo', last: 'ë', tail: '' });
  });

  it('keeps an emoji whole', () => {
    expect(splitLastSymbol('Le carnet de Lune 🌙')).toEqual({ head: 'Le carnet de Lune ', last: '🌙', tail: '' });
  });

  it('perches a single letter on itself', () => {
    expect(splitLastSymbol('A')).toEqual({ head: '', last: 'A', tail: '' });
  });

  it('perches on a question mark', () => {
    expect(splitLastSymbol('par quelle page on commence ?')).toEqual({
      head: 'par quelle page on commence ',
      last: '?',
      tail: '',
    });
  });

  it('perches on a closing guillemet', () => {
    expect(splitLastSymbol('on reprend « Krark »')).toEqual({ head: 'on reprend « Krark ', last: '»', tail: '' });
  });

  it('skips trailing spaces and keeps them after the perch', () => {
    expect(splitLastSymbol('Decks récents  ')).toEqual({ head: 'Decks récent', last: 's', tail: '  ' });
  });

  it('skips a trailing non-breaking space', () => {
    expect(splitLastSymbol('on commence ? ')).toEqual({ head: 'on commence ', last: '?', tail: ' ' });
  });

  it('yields no symbol for an empty text', () => {
    expect(splitLastSymbol('')).toEqual({ head: '', last: '', tail: '' });
  });

  it('yields no symbol for an all-whitespace text', () => {
    expect(splitLastSymbol('  ')).toEqual({ head: '', last: '', tail: '  ' });
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

describe('pickPerch', () => {
  const title = { id: 'title', visible: true, title: true };
  const subtitle = { id: 'subtitle', visible: true, title: false };

  it('never picks the perch just left', () => {
    expect(pickPerch([title, subtitle], 'title', () => 0)).toBe('subtitle');
  });

  it('lets the random source pick uniformly, the title included', () => {
    const note = { id: 'note', visible: true, title: false };
    expect(pickPerch([title, subtitle, note], 'note', () => 0)).toBe('title');
    expect(pickPerch([title, subtitle, note], 'note', () => 0.49)).toBe('title');
    expect(pickPerch([title, subtitle, note], 'note', () => 0.5)).toBe('subtitle');
    expect(pickPerch([title, subtitle, note], 'note', () => 0.99)).toBe('subtitle');
  });

  it('ignores the perches out of sight', () => {
    const hidden = { id: 'hidden', visible: false, title: false };
    expect(pickPerch([hidden, title, subtitle], 'title', () => 0)).toBe('subtitle');
  });
});
