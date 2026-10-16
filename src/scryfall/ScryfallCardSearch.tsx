import { Anchor, Autocomplete, Group, Loader, Stack, Text } from '@mantine/core';
import { useDebouncedValue } from '@mantine/hooks';
import { type ReactNode, useState } from 'react';

import { errorMessage } from '../api/errors';
import { InfoHint } from '../theme/InfoHint';
import { isAdvancedQuery } from './client';
import { useCardNameSuggestions } from './hooks';

interface ScryfallCardSearchProps {
  label: string;
  placeholder: string;
  onSelect: (name: string) => void;
  hiddenQuery?: string;
  hint?: ReactNode;
}

export function ScryfallCardSearch({ label, placeholder, onSelect, hiddenQuery, hint }: ScryfallCardSearchProps) {
  const [search, setSearch] = useState('');
  const [debouncedSearch] = useDebouncedValue(search, 300);
  const query = debouncedSearch.trim() && hiddenQuery ? `${debouncedSearch.trim()} ${hiddenQuery}` : debouncedSearch;
  const suggestions = useCardNameSuggestions(query);
  const typeLines = new Map((suggestions.data ?? []).map((suggestion) => [suggestion.name, suggestion.typeLine]));
  const names = [...new Set((suggestions.data ?? []).map((suggestion) => suggestion.name))];
  const advanced = isAdvancedQuery(query.trim());
  const noResult =
    advanced && !suggestions.isFetching && suggestions.isSuccess && names.length === 0
      ? 'Aucune carte ne correspond à cette recherche.'
      : undefined;

  return (
    <Autocomplete
      label={
        <Group gap={8} component="span" display="inline-flex" mb={6}>
          {label}
          <InfoHint label="Aide sur la recherche">
            <Stack gap="xs">
              <div>
                Un nom de carte, ou une recherche avec la{' '}
                <Anchor href="https://scryfall.com/docs/syntax" target="_blank" rel="noreferrer" inherit>
                  syntaxe Scryfall
                </Anchor>{' '}
                (ex. t:creature c:g mv&lt;=2).
              </div>
              {hint && <div>{hint}</div>}
            </Stack>
          </InfoHint>
        </Group>
      }
      placeholder={placeholder}
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
