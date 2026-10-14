import { Text, TextInput } from '@mantine/core';

interface EditionSearchInputProps {
  value: string;
  onChange: (value: string) => void;
}

export function EditionSearchInput({ value, onChange }: EditionSearchInputProps) {
  return (
    <TextInput
      size="xs"
      placeholder="Nom ou code d'édition…"
      aria-label="Rechercher une édition"
      value={value}
      onChange={(event) => onChange(event.currentTarget.value)}
    />
  );
}

export function NoEditionMatch() {
  return (
    <Text size="sm" c="dimmed">
      Aucune édition ne correspond.
    </Text>
  );
}
