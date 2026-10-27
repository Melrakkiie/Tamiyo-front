import { describe, expect, it } from 'vitest';

import { printingFaces } from './faces';
import { grizzlyBears } from './fixtures';

describe('printingFaces', () => {
  it('gives a single-faced card a front and no back', () => {
    expect(printingFaces(grizzlyBears)).toEqual({
      front: {
        face: 'front',
        name: 'Grizzly Bears',
        images: { small: 'bears-small', normal: 'bears-normal' },
        art: { url: 'bears-art', artist: 'Jeff A. Menges' },
        manaCost: '{1}{G}',
        deckArt: { scryfallId: 'fixture-grizzly-bears', face: 'front' },
      },
    });
  });
});
