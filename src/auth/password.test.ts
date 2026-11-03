import { describe, expect, it } from 'vitest';

import { newPasswordRule } from './password';

const MESSAGE = '72 octets maximum : raccourcis ton mot de passe ou retire des accents';

// The three forms plug this rule into useForm({ validate }); a non-null result blocks onSubmit.
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
