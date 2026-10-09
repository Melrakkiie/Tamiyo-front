import { TextInput } from '@mantine/core';
import { useDebouncedValue } from '@mantine/hooks';
import { type CSSProperties, useEffect, useState } from 'react';

interface DebouncedTextInputProps {
  label: string;
  placeholder?: string;
  maxLength?: number;
  style?: CSSProperties;
  value: string;
  onChange: (value: string) => void;
}

export function DebouncedTextInput({ value, onChange, ...props }: DebouncedTextInputProps) {
  const [text, setText] = useState(value);
  const [debounced] = useDebouncedValue(text.trim(), 300);

  useEffect(() => {
    if (debounced !== value) {
      onChange(debounced);
    }
  }, [debounced]);

  useEffect(() => {
    setText((current) => (current.trim() === value ? current : value));
  }, [value]);

  return <TextInput {...props} value={text} onChange={(event) => setText(event.currentTarget.value)} />;
}
