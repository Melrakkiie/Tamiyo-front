import { Loader, TextInput, type TextInputProps } from '@mantine/core';
import { useDebouncedValue } from '@mantine/hooks';
import { useEffect, useRef, useState } from 'react';

interface CollectionSearchInputProps extends Omit<TextInputProps, 'value' | 'onChange' | 'error'> {
  value: string;
  onSearch: (query: string) => void;
  error: string | null;
  loading: boolean;
}

export function CollectionSearchInput({
  value,
  onSearch,
  error,
  loading,
  rightSection,
  onKeyDown,
  ...props
}: CollectionSearchInputProps) {
  const [search, setSearch] = useState(value);
  const [debounced] = useDebouncedValue(search.trim(), 300);
  const current = useRef(value);
  const sent = useRef<string[]>([]);

  function commit(query: string) {
    if (query === (sent.current.at(-1) ?? current.current)) {
      return;
    }
    sent.current.push(query);
    onSearch(query);
  }

  useEffect(() => commit(debounced), [debounced]);

  useEffect(() => {
    current.current = value;
    const echoed = sent.current.indexOf(value);
    if (echoed >= 0) {
      sent.current = sent.current.slice(echoed + 1);
      return;
    }
    sent.current = [];
    setSearch(value);
  }, [value]);

  return (
    <TextInput
      {...props}
      value={search}
      onChange={(event) => setSearch(event.currentTarget.value)}
      onKeyDown={(event) => {
        if (event.key === 'Enter') {
          commit(search.trim());
        }
        onKeyDown?.(event);
      }}
      error={search.trim() === value ? error : null}
      rightSection={loading ? <Loader size="xs" /> : rightSection}
    />
  );
}
