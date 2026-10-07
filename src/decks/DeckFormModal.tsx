import { Alert, Autocomplete, Button, Group, Modal, Select, Stack, TextInput } from '@mantine/core';
import { isNotEmpty, useForm } from '@mantine/form';
import { useState } from 'react';

import { errorMessage } from '../api/errors';
import type { Deck } from '../api/types';
import { useDeckFormats, type DeckInput } from './api';
import { visibilityOption, visibilityOptions } from './visibility';

interface DeckFormModalProps {
  opened: boolean;
  onClose: () => void;
  title: string;
  submitLabel: string;
  initial?: Deck;
  pending: boolean;
  error: unknown;
  onSubmit: (values: DeckInput) => void;
}

export function DeckFormModal({ opened, onClose, title, ...formProps }: DeckFormModalProps) {
  return (
    <Modal opened={opened} onClose={onClose} title={title}>
      {opened && <DeckForm onClose={onClose} {...formProps} />}
    </Modal>
  );
}

function DeckForm({ onClose, submitLabel, initial, pending, error, onSubmit }: Omit<DeckFormModalProps, 'opened' | 'title'>) {
  const formats = useDeckFormats();
  const form = useForm<DeckInput>({
    mode: 'uncontrolled',
    initialValues: {
      name: initial?.name ?? '',
      format: initial?.format ?? 'commander',
      visibility: initial?.visibility ?? 'unlisted',
    },
    validate: {
      name: isNotEmpty('Nom requis'),
      format: isNotEmpty('Format requis'),
    },
    transformValues: (values) => ({
      name: values.name.trim(),
      format: values.format.trim().toLowerCase(),
      visibility: values.visibility,
    }),
  });
  const [visibility, setVisibility] = useState(form.getValues().visibility);
  form.watch('visibility', ({ value }) => setVisibility(value));

  return (
    <form onSubmit={form.onSubmit(onSubmit)}>
      <Stack>
        {error !== null && error !== undefined && <Alert color="red">{errorMessage(error)}</Alert>}
        <TextInput label="Nom" placeholder="Atraxa superfriends…" data-autofocus key={form.key('name')} {...form.getInputProps('name')} />
        <Autocomplete
          label="Format"
          description="Le nom du format chez Scryfall (commander, modern, pauper…), utilisé pour vérifier la légalité."
          data={formats}
          key={form.key('format')}
          {...form.getInputProps('format')}
        />
        <Select
          label="Visibilité"
          description={visibilityOption(visibility).description}
          data={visibilityOptions.map(({ value, label }) => ({ value, label }))}
          allowDeselect={false}
          key={form.key('visibility')}
          {...form.getInputProps('visibility')}
        />
        <Group justify="flex-end">
          <Button variant="default" onClick={onClose}>
            Annuler
          </Button>
          <Button type="submit" loading={pending}>
            {submitLabel}
          </Button>
        </Group>
      </Stack>
    </form>
  );
}
