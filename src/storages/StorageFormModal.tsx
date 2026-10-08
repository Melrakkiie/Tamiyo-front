import { Alert, Autocomplete, Button, Group, Modal, Stack, TextInput } from '@mantine/core';
import { isNotEmpty, useForm } from '@mantine/form';

import { errorMessage } from '../api/errors';
import type { Storage } from '../api/types';
import { useStorageTypes, type StorageInput } from './api';

interface StorageFormModalProps {
  opened: boolean;
  onClose: () => void;
  title: string;
  submitLabel: string;
  initial?: Storage;
  pending: boolean;
  error: unknown;
  onSubmit: (values: StorageInput) => void;
}

export function StorageFormModal({ opened, onClose, title, ...formProps }: StorageFormModalProps) {
  return (
    <Modal opened={opened} onClose={onClose} title={title}>
      {opened && <StorageForm onClose={onClose} {...formProps} />}
    </Modal>
  );
}

function StorageForm({
  onClose,
  submitLabel,
  initial,
  pending,
  error,
  onSubmit,
}: Omit<StorageFormModalProps, 'opened' | 'title'>) {
  const types = useStorageTypes();
  const form = useForm<StorageInput>({
    mode: 'uncontrolled',
    initialValues: { name: initial?.name ?? '', type: initial?.type ?? 'binder' },
    validate: {
      name: isNotEmpty('Nom requis'),
      type: isNotEmpty('Type requis'),
    },
    transformValues: (values) => ({ name: values.name.trim(), type: values.type.trim().toLowerCase() }),
  });

  return (
    <form onSubmit={form.onSubmit(onSubmit)}>
      <Stack>
        {error !== null && error !== undefined && <Alert color="red">{errorMessage(error)}</Alert>}
        <TextInput
          label="Nom"
          placeholder="Classeur rouge, boîte des doubles…"
          data-autofocus
          key={form.key('name')}
          {...form.getInputProps('name')}
        />
        <Autocomplete
          label="Type"
          description="Choisis un type existant ou saisis-en un nouveau. Un « deckbox » devient un classeur de type « deck » à l'export ManaBox."
          data={types}
          key={form.key('type')}
          {...form.getInputProps('type')}
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
