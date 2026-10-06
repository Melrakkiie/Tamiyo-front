import { Anchor, Autocomplete, Group, Loader, Text } from '@mantine/core';
import { useDebouncedValue } from '@mantine/hooks';
import { useState } from 'react';

import { errorMessage } from '../api/errors';
import { isAdvancedQuery } from './client';
import { useCardNameSuggestions } from './hooks';

interface ScryfallCardSearchProps {
  label: string;
  placeholder: string;
  onSelect: (name: string) => void;
}

export function ScryfallCardSearch({ label, placeholder, onSelect }: ScryfallCardSearchProps) {
  const [search, setSearch] = useState('');
  const [debouncedSearch] = useDebouncedValue(search, 300);
  const suggestions = useCardNameSuggestions(debouncedSearch);
  const typeLines = new Map((suggestions.data ?? []).map((suggestion) => [suggestion.name, suggestion.typeLine]));
  const names = [...new Set((suggestions.data ?? []).map((suggestion) => suggestion.name))];
  const advanced = isAdvancedQuery(debouncedSearch.trim());
  const noResult =
    advanced && !suggestions.isFetching && suggestions.isSuccess && names.length === 0
      ? 'Aucune carte ne correspond à cette recherche.'
      : undefined;

  return (
    <Autocomplete
      label={label}
      placeholder={placeholder}
      description={
        <>
          Un nom de carte, ou une recherche avec la{' '}
          <Anchor href="https://scryfall.com/docs/syntax" target="_blank" rel="noreferrer" size="xs">
            syntaxe Scryfall
          </Anchor>{' '}
          (ex. t:creature c:g mv&lt;=2).
        </>
      }
      value={search}
      onChange={setSearch}
      onOptionSubmit={onSelect}
      data={names}
      filter={({ options }) => options}
      limit={30}
      maxDropdownHeight={360}
      renderOption={({ option }) => {
        const typeLine = typeLines.get(option.value);
        return (
          <Group justify="space-between" wrap="nowrap" w="100%" gap="sm">
            <Text size="sm">{option.value}</Text>
            {typeLine && (
              <Text size="xs" c="dimmed" lineClamp={1} ta="right">
                {typeLine}
              </Text>
            )}
          </Group>
        );
      }}
      rightSection={suggestions.isFetching ? <Loader size="xs" /> : null}
      error={
        suggestions.error
          ? errorMessage(suggestions.error, {
              400: 'Scryfall ne comprend pas cette recherche : vérifie la syntaxe.',
              422: 'Scryfall ne comprend pas cette recherche : vérifie la syntaxe.',
            })
          : noResult
      }
    />
  );
}
