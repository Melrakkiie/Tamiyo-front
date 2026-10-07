import type { components } from '../api/schema';

export type DeckVisibility = components['schemas']['DeckVisibility'];

export const visibilityOptions: { value: DeckVisibility; label: string; description: string; color: string }[] = [
  { value: 'private', label: 'Privé', description: 'Toi seul peux voir ce deck.', color: 'gray' },
  {
    value: 'unlisted',
    label: 'Non répertorié',
    description: 'Visible par toute personne qui a son lien.',
    color: 'blue',
  },
  {
    value: 'public',
    label: 'Public',
    description: 'Visible par tout le monde, et listé parmi les decks à découvrir.',
    color: 'green',
  },
];

export function visibilityOption(visibility: DeckVisibility | undefined) {
  return visibilityOptions.find((option) => option.value === (visibility ?? 'unlisted')) ?? visibilityOptions[1];
}
