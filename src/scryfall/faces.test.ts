import { describe, expect, it } from 'vitest';

import { frontManaCost, printingFaces } from './faces';
import {
  alrundGodOfTheCosmos,
  briselaVoiceOfNightmares,
  brunaTheFadingLight,
  commitMemory,
  delverOfSecrets,
  grizzlyBears,
  zndrspltReversible,
} from './fixtures';

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

  it('gives a split card one front showing both halves, and no back', () => {
    expect(printingFaces(commitMemory)).toEqual({
      front: {
        face: 'front',
        name: 'Commit // Memory',
        images: { small: 'commit-small', normal: 'commit-normal' },
        art: { url: 'commit-art', artist: 'Ryan Pancoast' },
        manaCost: '{3}{U} // {4}{U}{U}',
        deckArt: { scryfallId: 'fixture-commit-memory', face: 'front' },
      },
    });
  });

  it("gives a reversible card's back from its second face", () => {
    expect(printingFaces(zndrspltReversible)).toEqual({
      front: {
        face: 'front',
        name: 'Zndrsplt, Eye of Wisdom',
        images: { small: 'zndrsplt-small', normal: 'zndrsplt-normal' },
        art: { url: 'zndrsplt-art', artist: 'Alexis Ziritt' },
        manaCost: '{4}{U}',
        deckArt: { scryfallId: 'fixture-zndrsplt-reversible', face: 'front' },
      },
      back: {
        face: 'back',
        name: 'Zndrsplt, Eye of Wisdom',
        images: { small: 'zndrsplt-back-small', normal: 'zndrsplt-back-normal' },
        art: { url: 'zndrsplt-back-art', artist: 'Wizard of Barge' },
        manaCost: '{4}{U}',
        deckArt: { scryfallId: 'fixture-zndrsplt-reversible', face: 'back' },
      },
    });
  });

  const bruna = {
    face: 'front',
    name: 'Bruna, the Fading Light',
    images: { small: 'bruna-small', normal: 'bruna-normal' },
    art: { url: 'bruna-art', artist: 'Clint Cearley' },
    manaCost: '{5}{W}{W}',
    deckArt: { scryfallId: 'fixture-bruna-the-fading-light', face: 'front' },
  };

  it("gives a meld card's back as its melded card's front, stored as that printing's front (ADR-0010)", () => {
    expect(printingFaces(brunaTheFadingLight, briselaVoiceOfNightmares)).toEqual({
      front: bruna,
      back: {
        face: 'back',
        name: 'Brisela, Voice of Nightmares',
        images: { small: 'brisela-small', normal: 'brisela-normal' },
        art: { url: 'brisela-art', artist: 'Clint Cearley' },
        manaCost: '',
        deckArt: { scryfallId: 'fixture-brisela-voice-of-nightmares', face: 'front' },
      },
    });
  });

  it('gives a meld card no back until its melded card is loaded', () => {
    expect(printingFaces(brunaTheFadingLight)).toEqual({ front: bruna });
  });

  it('gives the melded card itself no back', () => {
    expect(printingFaces(briselaVoiceOfNightmares, briselaVoiceOfNightmares).back).toBeUndefined();
  });
});

describe('frontManaCost', () => {
  it("takes the card's own cost", () => {
    expect(frontManaCost(grizzlyBears)).toBe('{1}{G}');
  });

  it("takes the first face's cost when the card has none", () => {
    expect(frontManaCost(alrundGodOfTheCosmos)).toBe('{3}{U}');
  });

  it("takes the first face's cost when the card's own is empty", () => {
    expect(frontManaCost(delverOfSecrets)).toBe('{U}');
  });
});
