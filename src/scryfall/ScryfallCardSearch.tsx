import { Autocomplete, Loader } from '@mantine/core';
import { useDebouncedValue } from '@mantine/hooks';
import { useState } from 'react';

import { errorMessage } from '../api/errors';
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

  return (
    <Autocomplete
      label={label}
      placeholder={placeholder}
      value={search}
      onChange={setSearch}
      onOptionSubmit={onSelect}
      data={suggestions.data ?? []}
      filter={({ options }) => options}
      rightSection={suggestions.isFetching ? <Loader size="xs" /> : null}
      error={suggestions.error ? errorMessage(suggestions.error) : undefined}
    />
  );
}
