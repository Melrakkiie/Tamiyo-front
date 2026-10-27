import { describe, expect, it } from 'vitest';

import { deckArtChoice } from './art';

describe('deckArtChoice', () => {
  it('shows the chosen printing on its chosen face', () => {
    expect(
      deckArtChoice({ background_scryfall_id: 'chosen', background_face: 'back', commander_scryfall_id: 'commander' }),
    ).toEqual({ scryfallId: 'chosen', face: 'back' });
  });

  it("falls back to the commander's front face", () => {
    expect(
      deckArtChoice({ background_scryfall_id: null, background_face: 'front', commander_scryfall_id: 'commander' }),
    ).toEqual({ scryfallId: 'commander', face: 'front' });
  });

  it('has no art without a chosen printing nor a commander', () => {
    expect(
      deckArtChoice({ background_scryfall_id: null, background_face: 'front', commander_scryfall_id: null }),
    ).toBeNull();
  });
});
