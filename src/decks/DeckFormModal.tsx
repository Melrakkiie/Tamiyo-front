import {
  Alert,
  Anchor,
  Autocomplete,
  Button,
  CloseButton,
  Collapse,
  Group,
  Modal,
  Select,
  Stack,
  Switch,
  Text,
  TextInput,
} from '@mantine/core';
import { isNotEmpty, useForm } from '@mantine/form';
import { useEffect, useState } from 'react';

import { errorMessage } from '../api/errors';
import type { Deck } from '../api/types';
import { ScryfallCardSearch } from '../scryfall/ScryfallCardSearch';
import { isCommanderFormat, useDeckFormats, type DeckInput } from './api';
import { bracketOptions, GaugeIcon } from './bracket';
import { FolderIcon } from './DeckFolderTree';
import { DeckListInput, deckListErrorMessage, useDeckList, useTamiyoDeckFile } from './DeckListInput';
import { useFolderOptions } from './folders';
import { visibilityOption, visibilityOptions } from './visibility';

interface DeckFormModalProps {
  opened: boolean;
  onClose: () => void;
  title: string;
  submitLabel: string;
  initial?: Deck;
  pending: boolean;
  error: unknown;
  withList?: boolean;
  listError?: unknown;
  onSubmit: (values: DeckInput, list?: DeckListSubmission) => void;
}

export interface DeckListSubmission {
  file: File;
  commanderFromFirstLine: boolean;
}

export function DeckFormModal({ opened, onClose, title, ...formProps }: DeckFormModalProps) {
  return (
    <Modal opened={opened} onClose={onClose} title={title} size={formProps.withList ? 'lg' : 'md'}>
      {opened && <DeckForm onClose={onClose} {...formProps} />}
    </Modal>
  );
}

function DeckForm({
  onClose,
  submitLabel,
  initial,
  pending,
  error,
  withList = false,
  listError,
  onSubmit,
}: Omit<DeckFormModalProps, 'opened' | 'title'>) {
  const formats = useDeckFormats();
  const list = useDeckList();
  const [listOpened, setListOpened] = useState(false);
  const [commanderFromFirstLine, setCommanderFromFirstLine] = useState(true);
  const [commanderName, setCommanderName] = useState<string | null>(null);
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
  const [format, setFormat] = useState(form.getValues().format);
  form.watch('format', ({ value }) => setFormat(value));
  const [bracket, setBracket] = useState<string | null>(initial?.bracket ? String(initial.bracket) : null);
  const [folderId, setFolderId] = useState<string | null>(null);
  const folderOptions = useFolderOptions();
  const commander = isCommanderFormat(format.trim().toLowerCase());
  const tamiyoFile = useTamiyoDeckFile(withList ? list.source : null);
  const commanderPicker = withList && commander && !listOpened;

  function listSubmission(): DeckListSubmission | undefined {
    if (listOpened && list.source) {
      return { file: list.source, commanderFromFirstLine };
    }
    if (commanderPicker && commanderName) {
      return {
        file: new File([`1 ${commanderName}\n`], 'commander.txt', { type: 'text/plain' }),
        commanderFromFirstLine: true,
      };
    }
    return undefined;
  }

  useEffect(() => {
    if (!tamiyoFile) {
      return;
    }
    if (tamiyoFile.name && form.getValues().name.trim() === '') {
      form.setFieldValue('name', tamiyoFile.name);
    }
    if (tamiyoFile.format) {
      form.setFieldValue('format', tamiyoFile.format);
    }
  }, [tamiyoFile]);

  return (
    <form
      onSubmit={form.onSubmit((values) =>
        onSubmit(
          {
            ...values,
            bracket: commander && bracket ? Number(bracket) : undefined,
            folder_id: !initial && folderId ? Number(folderId) : undefined,
          },
          listSubmission(),
        ),
      )}
    >
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
        {commanderPicker && (
          <Stack gap={4}>
            {commanderName ? (
              <Group gap="xs" wrap="nowrap">
                <Text size="sm">
                  Commandant : <b>{commanderName}</b>
                </Text>
                <CloseButton size="sm" aria-label="Changer de commandant" onClick={() => setCommanderName(null)} />
              </Group>
            ) : (
              <ScryfallCardSearch
                label="Commandant"
                placeholder="Cherche ton commandant (ex. Atraxa)"
                hiddenQuery="is:commander"
                onSelect={setCommanderName}
              />
            )}
            <Text size="xs" c="dimmed">
              Facultatif. Si tu ne l'as pas dans ta collection, il est ajouté aux cartes en attente.
            </Text>
          </Stack>
        )}
        {commander && (
          <Select
            label={
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                <GaugeIcon />
                Bracket
              </span>
            }
            description="Le niveau de puissance Commander du deck, de 1 (Exhibition) à 5 (cEDH)."
            placeholder="Non défini"
            data={bracketOptions}
            value={bracket}
            onChange={setBracket}
            clearable
          />
        )}
        <Select
          label="Visibilité"
          description={visibilityOption(visibility).description}
          data={visibilityOptions.map(({ value, label }) => ({ value, label }))}
          allowDeselect={false}
          key={form.key('visibility')}
          {...form.getInputProps('visibility')}
        />
        {!initial && folderOptions.length > 0 && (
          <Select
            label={
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                <FolderIcon size={14} />
                Dossier
              </span>
            }
            placeholder="Aucun dossier"
            data={folderOptions}
            value={folderId}
            onChange={setFolderId}
            clearable
            searchable
            nothingFoundMessage="Aucun dossier"
          />
        )}
        {withList && (
          <Stack gap="xs">
            <Anchor component="button" type="button" size="sm" ta="left" onClick={() => setListOpened((o) => !o)}>
              {listOpened ? 'Ne pas importer de liste' : 'Importer une liste de cartes (facultatif)'}
            </Anchor>
            <Collapse in={listOpened}>
              <Stack gap="xs">
                <DeckListInput list={list} minRows={6} />
                {tamiyoFile ? (
                  <Text size="xs" c="dimmed">
                    Fichier Tamiyo : le deck reprend ses éditions, ses sections, son commandant et ses tags.
                  </Text>
                ) : (
                  <Switch
                    label="La première ligne est le commandant"
                    checked={commanderFromFirstLine}
                    onChange={(event) => setCommanderFromFirstLine(event.currentTarget.checked)}
                  />
                )}
                {listError !== null && listError !== undefined && (
                  <Alert color="red">{deckListErrorMessage(listError)}</Alert>
                )}
              </Stack>
            </Collapse>
          </Stack>
        )}
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
