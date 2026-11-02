import { describe, expect, it } from 'vitest';

import { ApiError } from './errors';
import { quantityErrorMessage } from './quantityError';

const prefix = 'could not parse the uploaded file: ';
const bad = (message: string, status = 400) => quantityErrorMessage(new ApiError(status, message));

describe('quantityErrorMessage', () => {
  it.each(['Quantity', 'Count', 'quantity'])('names the line for an invalid %s', (field) => {
    expect(bad(`${prefix}line 12: invalid ${field} "100000"`)).toBe(
      'La ligne 12 a une quantité invalide : « 100000 ». Une ligne accepte de 1 à 1000 exemplaires.',
    );
  });

  it('names the card for the Tamiyo JSON import', () => {
    expect(bad('invalid Tamiyo file: card 3 (Sol Ring): quantity must be between 1 and 1000')).toBe(
      'La carte n° 3 (Sol Ring) a une quantité invalide. Une carte accepte de 1 à 1000 exemplaires.',
    );
  });

  it('ignores other errors', () => {
    expect(bad(`${prefix}line 2: unrecognized format "x"`)).toBeNull();
    expect(bad(`${prefix}line 12: invalid quantity "5"`, 500)).toBeNull();
    expect(quantityErrorMessage(new Error('line 1: invalid quantity "5"'))).toBeNull();
  });
});
