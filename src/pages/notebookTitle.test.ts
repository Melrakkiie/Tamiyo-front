import { describe, expect, it } from 'vitest';
import { notebookTitle } from './notebookTitle';

describe('notebookTitle', () => {
  it('uses « de » before a consonant', () => {
    expect(notebookTitle('Hugo')).toBe('Le carnet de Hugo');
  });

  it('elides before a vowel', () => {
    expect(notebookTitle('Aurore')).toBe("Le carnet d'Aurore");
  });
});
