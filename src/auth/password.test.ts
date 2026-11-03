import { describe, expect, it } from 'vitest';

import { newPasswordRule } from './password';

const MESSAGE = '72 octets maximum (les lettres accentuées comptent double) : raccourcis ton mot de passe';

describe('newPasswordRule', () => {
  it('accepts 72 bytes', () => {
    expect(newPasswordRule('a'.repeat(72))).toBeNull();
  });

  it('rejects 73 bytes, so the form does not submit', () => {
    expect(newPasswordRule('a'.repeat(73))).toBe(MESSAGE);
  });

  it('counts bytes, not characters: 40 accented characters are 80 bytes', () => {
    expect(newPasswordRule('é'.repeat(40))).toBe(MESSAGE);
  });

  it('still requires 8 characters', () => {
    expect(newPasswordRule('court')).toBe('8 caractères minimum');
  });
});
