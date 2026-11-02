import { describe, expect, it } from 'vitest';

import { ApiError } from '../api/errors';
import { deckListErrorMessage, tamiyoFileErrorMessage } from './DeckListInput';

const prefix = 'could not parse the uploaded file: ';
const bad = (message: string) => new ApiError(400, prefix + message);

describe('import error messages', () => {
  it('shows the card of a refused Tamiyo quantity, not the generic Tamiyo message', () => {
    const err = bad('invalid Tamiyo file: card 3 (Sol Ring): quantity must be between 1 and 1000');
    const message = 'La carte n° 3 (Sol Ring) a une quantité invalide. Une carte accepte de 1 à 1000 exemplaires.';
    expect(tamiyoFileErrorMessage(err)).toBe(message);
    expect(deckListErrorMessage(err)).toBe(message);
  });

  it('keeps the generic message for another invalid Tamiyo file', () => {
    expect(tamiyoFileErrorMessage(bad('invalid Tamiyo file: unexpected end of JSON input'))).toContain(
      "n'a pas pu être lu",
    );
  });

  it('shows the line of a refused list quantity', () => {
    expect(deckListErrorMessage(bad('line 12: invalid quantity "100000"'))).toBe(
      'La ligne 12 a une quantité invalide : « 100000 ». Une ligne accepte de 1 à 1000 exemplaires.',
    );
  });

  it('leaves the unrecognized format message unchanged', () => {
    expect(deckListErrorMessage(bad('line 4: unrecognized format "abc"'))).toBe(
      "La ligne 4 n'a pas pu être lue : « abc ».",
    );
  });
});
