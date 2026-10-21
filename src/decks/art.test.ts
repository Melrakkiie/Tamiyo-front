import { describe, expect, it } from 'vitest';

import { cardArt, type ScryfallCard } from '../scryfall/client';
import { delverOfSecrets, grizzlyBears } from '../scryfall/fixtures';
import { backArtChoice, deckArtChoice } from './art';

const delver: ScryfallCard = {
  ...delverOfSecrets,
  card_faces: [
    {
      ...delverOfSecrets.card_faces![0],
      artist: 'Nils Hamm',
      image_uris: { small: 's1', normal: 'n1', art_crop: 'front-art' },
    },
    {
      ...delverOfSecrets.card_faces![1],
      artist: 'Nils Hamm',
      image_uris: { small: 's2', normal: 'n2', art_crop: 'back-art' },
    },
  ],
};

const brisela = { id: 'fixture-brisela', component: 'meld_result', name: 'Brisela, Voice of Nightmares' };
const bruna: ScryfallCard = {
  ...grizzlyBears,
  id: 'fixture-bruna',
  layout: 'meld',
  name: 'Bruna, the Fading Light',
  all_parts: [{ id: 'fixture-bruna', component: 'meld_part', name: 'Bruna, the Fading Light' }, brisela],
};

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

describe('backArtChoice', () => {
  it("picks a double-faced card's back face, named after it", () => {
    expect(backArtChoice(delver)).toEqual({ scryfallId: delver.id, face: 'back', name: 'Insectile Aberration' });
  });

  it("picks a meld card's melded card, on its front", () => {
    expect(backArtChoice(bruna)).toEqual({ scryfallId: brisela.id, face: 'front', name: brisela.name });
  });
});

describe('cardArt', () => {
  it('shows the back face art when asked', () => {
    expect(cardArt(delver, 'back')).toEqual({ url: 'back-art', artist: 'Nils Hamm' });
  });

  it('falls back to the front art when the printing has no back face', () => {
    const bears = { ...grizzlyBears, image_uris: { small: 's', normal: 'n', art_crop: 'bears-art' } };
    expect(cardArt(bears, 'back')).toEqual(cardArt(bears, 'front'));
  });
});
