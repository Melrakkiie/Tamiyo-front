import { hasLength } from '@mantine/form';

const MAX_PASSWORD_BYTES = 72;

const minLength = hasLength({ min: 8 }, '8 caractères minimum');

// The API hashes with bcrypt, which refuses passwords over 72 bytes (the API answers 400).
export const newPasswordRule = (value: string) =>
  minLength(value) ??
  (new TextEncoder().encode(value).length > MAX_PASSWORD_BYTES
    ? `${MAX_PASSWORD_BYTES} octets maximum (les lettres accentuées comptent double) : raccourcis ton mot de passe`
    : null);
