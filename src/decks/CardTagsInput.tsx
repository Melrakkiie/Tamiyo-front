import { TagsInput } from '@mantine/core';

import { errorMessage } from '../api/errors';
import { tagsByName, tagsOf, useDeckTags, useSetCardTags } from './tags';

const MAX_TAGS = 20;
const MAX_TAG_LENGTH = 40;

interface CardTagsInputProps {
  deckId: string;
  cardName: string;
}

export function CardTagsInput({ deckId, cardName }: CardTagsInputProps) {
  const deckTags = useDeckTags(deckId);
  const setTags = useSetCardTags();
  const value = tagsOf(tagsByName(deckTags.data?.cards ?? []), cardName);

  function change(next: string[]) {
    const cleaned = next.map((tag) => tag.trim().split(/\s+/).join(' ')).filter((tag) => tag.length > 0);
    if (cleaned.some((tag) => tag.length > MAX_TAG_LENGTH)) {
      return;
    }
    setTags.mutate({ deckId, name: cardName, tags: cleaned });
  }

  return (
    <TagsInput
      label="Tags"
      description="Partagés par tous les exemplaires de cette carte dans le deck. Entrée ou virgule pour valider."
      placeholder={value.length === 0 ? 'Ramp, Pioche, Removal…' : undefined}
      data={deckTags.data?.tags ?? []}
      value={value}
      onChange={change}
      maxTags={MAX_TAGS}
      splitChars={[',']}
      clearable
      disabled={deckTags.isLoading}
      error={
        setTags.error
          ? errorMessage(setTags.error, { 400: `Un tag fait au plus ${MAX_TAG_LENGTH} caractères.` })
          : undefined
      }
    />
  );
}
