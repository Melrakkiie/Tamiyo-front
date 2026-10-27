import { describe, expect, it } from 'vitest';

import type { PrintingFaces } from '../scryfall/faces';
import { choiceArt, deckArtChoice } from './art';

const face = (face: 'front' | 'back', art: PrintingFaces['front']['art']): PrintingFaces['front'] => ({
  face,
  name: 'n',
  images: { small: undefined, normal: undefined },
  art,
  manaCost: '',
  deckArt: { scryfallId: 'id', face },
});
const frontArt = { url: 'front-art', artist: 'A' };
const backArt = { url: 'back-art', artist: 'B' };

describe('choiceArt', () => {
  it('reads the chosen face', () => {
    const faces = { front: face('front', frontArt), back: face('back', backArt) };
    expect(choiceArt(faces, 'front')).toEqual(frontArt);
    expect(choiceArt(faces, 'back')).toEqual(backArt);
  });

  it('falls back to the front art when the back has none', () => {
    expect(choiceArt({ front: face('front', frontArt) }, 'back')).toEqual(frontArt);
    expect(choiceArt({ front: face('front', frontArt), back: face('back', null) }, 'back')).toEqual(frontArt);
  });
});

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
