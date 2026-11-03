import { hasLength } from '@mantine/form';

const MAX_PASSWORD_BYTES = 72;

const minLength = hasLength({ min: 8 }, '8 caractères minimum');

// The API hashes with bcrypt, which only reads the first 72 bytes.
export const newPasswordRule = (value: string) =>
  minLength(value) ??
  (new TextEncoder().encode(value).length > MAX_PASSWORD_BYTES
    ? `${MAX_PASSWORD_BYTES} octets maximum : raccourcis ton mot de passe ou retire des accents`
    : null);
