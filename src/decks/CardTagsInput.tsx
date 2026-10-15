import { Combobox, Pill, PillsInput, useCombobox } from '@mantine/core';
import { type ReactNode, useState } from 'react';

import { errorMessage } from '../api/errors';
import { TagSticker } from '../theme/Sticker';
import { tagsByName, tagsOf, useDeckTags, useSetCardTags } from './tags';

const MAX_TAGS = 20;
const MAX_TAG_LENGTH = 40;

export const ADDED_TAGS_DESCRIPTION =
  'Ajoutés aux tags que la carte a déjà dans le deck. Entrée ou virgule pour valider.';

interface CardTagsInputProps {
  deckId: string;
  cardName: string;
}

export function CardTagsInput({ deckId, cardName }: CardTagsInputProps) {
  const deckTags = useDeckTags(deckId);
  const setTags = useSetCardTags();

  return (
    <TagsField
      value={tagsOf(tagsByName(deckTags.data?.cards ?? []), cardName)}
      onChange={(tags) => setTags.mutate({ deckId, name: cardName, tags })}
      suggestions={deckTags.data?.tags ?? []}
      description="Partagés par tous les exemplaires de cette carte dans le deck. Entrée ou virgule pour valider."
      disabled={deckTags.isLoading}
      error={
        setTags.error
          ? errorMessage(setTags.error, { 400: `Un tag fait au plus ${MAX_TAG_LENGTH} caractères.` })
          : undefined
      }
    />
  );
}

interface TagsFieldProps {
  value: string[];
  onChange: (tags: string[]) => void;
  suggestions: string[];
  label?: ReactNode;
  description?: ReactNode;
  disabled?: boolean;
  error?: ReactNode;
}

export function TagsField({
  value,
  onChange,
  suggestions,
  label = 'Tags',
  description,
  disabled = false,
  error,
}: TagsFieldProps) {
  const [search, setSearch] = useState('');
  const [tooLong, setTooLong] = useState(false);
  const combobox = useCombobox({
    onDropdownClose: () => combobox.resetSelectedOption(),
  });

  function change(next: string[]) {
    const cleaned = next.map((tag) => tag.trim().split(/\s+/).join(' ')).filter((tag) => tag.length > 0);
    if (cleaned.some((tag) => tag.length > MAX_TAG_LENGTH)) {
      return;
    }
    onChange(cleaned);
  }

  function add(candidates: string[]): boolean {
    const next = [...value];
    for (const candidate of candidates) {
      const tag = candidate.trim().split(/\s+/).join(' ');
      if (tag.length > MAX_TAG_LENGTH) {
        setTooLong(true);
        return false;
      }
      const lower = tag.toLocaleLowerCase('fr');
      if (tag && next.length < MAX_TAGS && !next.some((other) => other.toLocaleLowerCase('fr') === lower)) {
        next.push(tag);
      }
    }
    setTooLong(false);
    if (next.length !== value.length) {
      change(next);
    }
    return true;
  }

  function submit(text: string) {
    if (add(text.split(','))) {
      setSearch('');
    }
  }

  function remove(tag: string) {
    change(value.filter((other) => other !== tag));
  }

  function typed(text: string) {
    combobox.updateSelectedOptionIndex();
    combobox.openDropdown();
    const parts = text.split(',');
    if (parts.length > 1) {
      const last = parts.pop()!;
      if (add(parts)) {
        setSearch(last.trimStart());
        return;
      }
    }
    setSearch(text);
  }

  const query = search.trim().toLocaleLowerCase('fr');
  const picked = new Set(value.map((tag) => tag.toLocaleLowerCase('fr')));
  const options = suggestions.filter(
    (tag) => !picked.has(tag.toLocaleLowerCase('fr')) && tag.toLocaleLowerCase('fr').includes(query),
  );

  return (
    <Combobox
      store={combobox}
      onOptionSubmit={(tag) => {
        submit(tag);
        combobox.resetSelectedOption();
      }}
      disabled={disabled}
    >
      <Combobox.DropdownTarget>
        <PillsInput
          label={label}
          description={description}
          disabled={disabled}
          error={tooLong ? `Un tag fait au plus ${MAX_TAG_LENGTH} caractères.` : error}
          onClick={() => combobox.openDropdown()}
          rightSection={
            value.length > 0 && !disabled ? (
              <Combobox.ClearButton onClear={() => change([])} aria-label="Retirer tous les tags" />
            ) : undefined
          }
        >
          <Pill.Group>
            {value.map((tag) => (
              <TagSticker key={tag} tag={tag} size="xs" onRemove={() => remove(tag)} disabled={disabled} />
            ))}
            <Combobox.EventsTarget>
              <PillsInput.Field
                value={search}
                placeholder={value.length === 0 ? 'Ramp, Pioche, Removal…' : undefined}
                onFocus={() => combobox.openDropdown()}
                onBlur={() => combobox.closeDropdown()}
                onChange={(event) => typed(event.currentTarget.value)}
                onPaste={(event) => {
                  const pasted = event.clipboardData.getData('text');
                  if (pasted.includes(',')) {
                    event.preventDefault();
                    submit(search + pasted);
                  }
                }}
                onKeyDown={(event) => {
                  if (event.nativeEvent.isComposing) {
                    return;
                  }
                  if (event.key === 'Enter' && !(combobox.dropdownOpened && combobox.getSelectedOptionIndex() !== -1)) {
                    event.preventDefault();
                    if (search.trim()) {
                      submit(search);
                    }
                  }
                  if (event.key === 'Backspace' && search.length === 0 && value.length > 0) {
                    event.preventDefault();
                    remove(value[value.length - 1]);
                  }
                }}
              />
            </Combobox.EventsTarget>
          </Pill.Group>
        </PillsInput>
      </Combobox.DropdownTarget>

      <Combobox.Dropdown hidden={options.length === 0}>
        <Combobox.Options>
          {options.map((tag) => (
            <Combobox.Option value={tag} key={tag}>
              {tag}
            </Combobox.Option>
          ))}
        </Combobox.Options>
      </Combobox.Dropdown>
    </Combobox>
  );
}
