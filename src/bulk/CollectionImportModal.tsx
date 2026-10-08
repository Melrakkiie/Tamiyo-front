import { Alert, Anchor, Button, FileInput, Group, Modal, SegmentedControl, Select, Stack, Text } from '@mantine/core';
import { useState } from 'react';
import { Link } from 'react-router';

import { errorMessage } from '../api/errors';
import type { ImportSummary } from '../api/types';
import { useStorageOptions } from '../storages/api';
import { useImportManaBox, useImportMoxfieldCollection } from './api';
import { ImportResult } from './ImportResult';

type Source = 'manabox' | 'moxfield';

const sources: { value: Source; label: string }[] = [
  { value: 'manabox', label: 'ManaBox' },
  { value: 'moxfield', label: 'Moxfield' },
];

interface ImportTarget {
  id: number;
  name: string;
}

interface CollectionImportModalProps {
  opened: boolean;
  onClose: () => void;
  storage?: ImportTarget;
}

const longImportNote =
  "Un gros fichier peut prendre une à deux minutes : Tamiyo interroge Scryfall pour chaque lot de 75 cartes, à son rythme. Garde cette fenêtre ouverte jusqu'à la fin.";

function importErrorMessage(err: unknown, expected: string) {
  return errorMessage(err, {
    400: `Le fichier n'a pas pu être lu. Vérifie qu'il s'agit bien ${expected}.`,
    502: "Scryfall n'a pas répondu, l'import n'a pas eu lieu. Réessaie dans un moment.",
  });
}

export function CollectionImportModal({ opened, onClose, storage }: CollectionImportModalProps) {
  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={storage ? `Importer dans « ${storage.name} »` : 'Importer une collection'}
      size="lg"
    >
      {opened && <ImportForm storage={storage} onClose={onClose} />}
    </Modal>
  );
}

function ImportForm({ storage, onClose }: { storage?: ImportTarget; onClose: () => void }) {
  const [source, setSource] = useState<Source>('manabox');

  return (
    <Stack>
      <SegmentedControl data={sources} value={source} onChange={(value) => setSource(value as Source)} fullWidth />
      {source === 'manabox' ? (
        <ManaBoxImport key="manabox" storage={storage} onClose={onClose} />
      ) : (
        <MoxfieldImport key="moxfield" storage={storage} onClose={onClose} />
      )}
    </Stack>
  );
}

interface ImportFormProps {
  storage?: ImportTarget;
  onClose: () => void;
}

function ManaBoxImport({ storage, onClose }: ImportFormProps) {
  const [file, setFile] = useState<File | null>(null);
  const [summary, setSummary] = useState<ImportSummary | null>(null);
  const mutation = useImportManaBox();

  function submit() {
    if (!file) {
      return;
    }
    setSummary(null);
    mutation.mutate(
      { file, storageId: storage?.id },
      {
        onSuccess: (result) => {
          setSummary(result);
          setFile(null);
        },
      },
    );
  }

  return (
    <Stack>
      <Text size="sm">
        Dans ManaBox : <b>Collection → Export → CSV</b>.{' '}
        {storage
          ? 'Toutes les cartes du fichier iront dans ce rangement : les classeurs de ManaBox sont ignorés.'
          : 'Les classeurs deviennent des rangements, et les classeurs de type « deck » deviennent aussi des decks (au format commander par défaut, à corriger ensuite si besoin).'}
      </Text>
      <FileInput
        label="Fichier ManaBox_Collection.csv"
        placeholder="Choisis le fichier"
        accept=".csv,text/csv"
        value={file}
        onChange={setFile}
        clearable
      />
      <Text size="xs" c="dimmed">
        {longImportNote}
      </Text>
      {mutation.error && <Alert color="red">{importErrorMessage(mutation.error, "de l'export CSV de ManaBox")}</Alert>}
      {summary && <ImportResult summary={summary} />}
      <Group justify="flex-end">
        <Button variant="default" onClick={onClose}>
          Fermer
        </Button>
        <Button onClick={submit} disabled={!file} loading={mutation.isPending}>
          Importer
        </Button>
      </Group>
    </Stack>
  );
}

function MoxfieldImport({ storage, onClose }: ImportFormProps) {
  const [file, setFile] = useState<File | null>(null);
  const [chosenStorageId, setChosenStorageId] = useState<string | null>(null);
  const [summary, setSummary] = useState<ImportSummary | null>(null);
  const storageOptions = useStorageOptions();
  const mutation = useImportMoxfieldCollection();
  const storageId = storage ? storage.id : chosenStorageId ? Number(chosenStorageId) : null;

  function submit() {
    if (!file || storageId === null) {
      return;
    }
    setSummary(null);
    mutation.mutate(
      { file, storageId },
      {
        onSuccess: (result) => {
          setSummary(result);
          setFile(null);
        },
      },
    );
  }

  return (
    <Stack>
      <Text size="sm">
        Dans Moxfield : <b>Collection → More → Export CSV</b>.{' '}
        {storage
          ? 'Toutes les cartes du fichier iront dans ce rangement.'
          : 'Moxfield ne connaît pas les rangements : toutes les cartes iront dans le rangement choisi ci-dessous.'}
      </Text>
      <FileInput
        label="Fichier CSV Moxfield"
        placeholder="Choisis le fichier"
        accept=".csv,text/csv"
        value={file}
        onChange={setFile}
        clearable
      />
      {!storage && (
        <>
          <Select
            label="Rangement de destination"
            placeholder={storageOptions.length === 0 ? "Crée d'abord un rangement" : 'Choisis un rangement'}
            data={storageOptions}
            value={chosenStorageId}
            onChange={setChosenStorageId}
            searchable
          />
          {storageOptions.length === 0 && (
            <Text size="xs" c="dimmed">
              Aucun rangement pour le moment : crée-en un depuis la page{' '}
              <Anchor component={Link} to="/storages" size="xs" onClick={onClose}>
                Rangements
              </Anchor>
              .
            </Text>
          )}
        </>
      )}
      <Text size="xs" c="dimmed">
        {longImportNote}
      </Text>
      {mutation.error && (
        <Alert color="red">{importErrorMessage(mutation.error, "de l'export CSV de la collection Moxfield")}</Alert>
      )}
      {summary && <ImportResult summary={summary} />}
      <Group justify="flex-end">
        <Button variant="default" onClick={onClose}>
          Fermer
        </Button>
        <Button onClick={submit} disabled={!file || storageId === null} loading={mutation.isPending}>
          Importer
        </Button>
      </Group>
    </Stack>
  );
}
