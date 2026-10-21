import { describe, expect, it } from 'vitest';
import { notebookTitle } from './notebookTitle';

describe('notebookTitle', () => {
  it('uses « de » before a consonant', () => {
    expect(notebookTitle('Hugo')).toBe('Le carnet de Hugo');
  });

  it('elides before a vowel', () => {
    expect(notebookTitle('Aurore')).toBe("Le carnet d'Aurore");
  });

  it('elides before an accented vowel', () => {
    expect(notebookTitle('Élise')).toBe("Le carnet d'Élise");
  });

  it('elides before a lowercase vowel', () => {
    expect(notebookTitle('inès')).toBe("Le carnet d'inès");
  });

  it('never elides before H', () => {
    expect(notebookTitle('Hélène')).toBe('Le carnet de Hélène');
  });
});
