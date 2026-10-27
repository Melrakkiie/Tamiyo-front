import { describe, expect, it } from 'vitest';

import { printingFaces } from './faces';
import { alrundGodOfTheCosmos, delverOfSecrets, grizzlyBears } from './fixtures';

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

  it("gives a modal double-faced card's back from its second face", () => {
    expect(printingFaces(alrundGodOfTheCosmos)).toEqual({
      front: {
        face: 'front',
        name: 'Alrund, God of the Cosmos',
        images: { small: 'alrund-small', normal: 'alrund-normal' },
        art: { url: 'alrund-art', artist: 'Kieran Yanner' },
        manaCost: '{3}{U}',
        deckArt: { scryfallId: 'fixture-alrund-god-of-the-cosmos', face: 'front' },
      },
      back: {
        face: 'back',
        name: 'Hakka, Whispering Raven',
        images: { small: 'hakka-small', normal: 'hakka-normal' },
        art: { url: 'hakka-art', artist: 'Aaron Miller' },
        manaCost: '{1}{U}',
        deckArt: { scryfallId: 'fixture-alrund-god-of-the-cosmos', face: 'back' },
      },
    });
  });

  it("gives a transform card's back from its second face, credited to the card's artist", () => {
    expect(printingFaces(delverOfSecrets)).toEqual({
      front: {
        face: 'front',
        name: 'Delver of Secrets',
        images: { small: 'delver-small', normal: 'delver-normal' },
        art: { url: 'delver-art', artist: 'Nils Hamm' },
        manaCost: '{U}',
        deckArt: { scryfallId: 'fixture-delver-of-secrets', face: 'front' },
      },
      back: {
        face: 'back',
        name: 'Insectile Aberration',
        images: { small: 'aberration-small', normal: 'aberration-normal' },
        art: { url: 'aberration-art', artist: 'Nils Hamm' },
        manaCost: '',
        deckArt: { scryfallId: 'fixture-delver-of-secrets', face: 'back' },
      },
    });
  });
});
