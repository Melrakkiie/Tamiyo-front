import {
  Alert,
  Anchor,
  Button,
  Divider,
  FileInput,
  Group,
  Paper,
  SegmentedControl,
  Select,
  Stack,
  Text,
  Title,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useState } from 'react';
import { Link } from 'react-router';

import { errorMessage } from '../api/errors';
import type { ImportSummary } from '../api/types';
import { type CollectionExport, useExportCollection, useImportManaBox, useImportMoxfieldCollection } from '../bulk/api';
import { ImportResult } from '../bulk/ImportResult';
import { useStorageOptions } from '../storages/api';

type Source = 'manabox' | 'moxfield-collection';

const sources: { value: Source; label: string }[] = [
  { value: 'manabox', label: 'Collection ManaBox' },
  { value: 'moxfield-collection', label: 'Collection Moxfield' },
];

const longImportNote =
  "Un gros fichier peut prendre une à deux minutes : Tamiyo interroge Scryfall pour chaque lot de 75 cartes, à son rythme. Reste sur la page jusqu'à la fin.";

function importErrorMessage(err: unknown, expected: string) {
  return errorMessage(err, {
    400: `Le fichier n'a pas pu être lu. Vérifie qu'il s'agit bien ${expected}.`,
    502: "Scryfall n'a pas répondu, l'import n'a pas eu lieu. Réessaie dans un moment.",
  });
}

export function ImportExportPage() {
  const [source, setSource] = useState<Source>('manabox');

  return (
    <Stack gap="xl">
      <Title order={2}>Import / export</Title>

      <Paper withBorder p="md" radius="md">
        <Stack>
          <Title order={3} size="h4">
            Importer
          </Title>
          <Text size="sm" c="dimmed">
            Pour importer un deck, colle sa liste en le créant depuis la page{' '}
            <Anchor component={Link} to="/decks" size="sm">
              Decks
            </Anchor>
            , ou avec « Importer une liste » sur la page d'un deck existant.
          </Text>
          <SegmentedControl data={sources} value={source} onChange={(value) => setSource(value as Source)} fullWidth />
          {source === 'manabox' && <ManaBoxImport key="manabox" />}
          {source === 'moxfield-collection' && <MoxfieldCollectionImport key="moxfield-collection" />}
        </Stack>
      </Paper>

      <Paper withBorder p="md" radius="md">
        <CollectionExportSection />
      </Paper>
    </Stack>
  );
}

function ManaBoxImport() {
  const [file, setFile] = useState<File | null>(null);
  const [summary, setSummary] = useState<ImportSummary | null>(null);
  const mutation = useImportManaBox();

  function submit() {
    if (!file) {
      return;
    }
    setSummary(null);
    mutation.mutate(file, {
      onSuccess: (result) => {
        setSummary(result);
        setFile(null);
      },
    });
  }

  return (
    <Stack>
      <Text size="sm">
        Dans ManaBox : <b>Collection → Export → CSV</b>. Les classeurs deviennent des rangements, et les classeurs de
        type « deck » deviennent aussi des decks (au format commander par défaut, à corriger ensuite si besoin).
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
        <Button onClick={submit} disabled={!file} loading={mutation.isPending}>
          Importer
        </Button>
      </Group>
    </Stack>
  );
}

function MoxfieldCollectionImport() {
  const [file, setFile] = useState<File | null>(null);
  const [storageId, setStorageId] = useState<string | null>(null);
  const [summary, setSummary] = useState<ImportSummary | null>(null);
  const storageOptions = useStorageOptions();
  const mutation = useImportMoxfieldCollection();

  function submit() {
    if (!file || !storageId) {
      return;
    }
    setSummary(null);
    mutation.mutate(
      { file, storageId: Number(storageId) },
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
        Dans Moxfield : <b>Collection → More → Export CSV</b>. Moxfield ne connaît pas les rangements : toutes les
        cartes iront dans le rangement choisi ci-dessous.
      </Text>
      <FileInput
        label="Fichier CSV Moxfield"
        placeholder="Choisis le fichier"
        accept=".csv,text/csv"
        value={file}
        onChange={setFile}
        clearable
      />
      <Select
        label="Rangement de destination"
        placeholder={storageOptions.length === 0 ? "Crée d'abord un rangement" : 'Choisis un rangement'}
        data={storageOptions}
        value={storageId}
        onChange={setStorageId}
        searchable
      />
      {storageOptions.length === 0 && (
        <Text size="xs" c="dimmed">
          Aucun rangement pour le moment : crée-en un depuis la page{' '}
          <Anchor component={Link} to="/storages" size="xs">
            Rangements
          </Anchor>
          .
        </Text>
      )}
      <Text size="xs" c="dimmed">
        {longImportNote}
      </Text>
      {mutation.error && (
        <Alert color="red">{importErrorMessage(mutation.error, "de l'export CSV de la collection Moxfield")}</Alert>
      )}
      {summary && <ImportResult summary={summary} />}
      <Group justify="flex-end">
        <Button onClick={submit} disabled={!file || !storageId} loading={mutation.isPending}>
          Importer
        </Button>
      </Group>
    </Stack>
  );
}

function CollectionExportSection() {
  const exportCollection = useExportCollection();

  function run(kind: CollectionExport) {
    exportCollection.mutate(kind, {
      onError: (err) => notifications.show({ color: 'red', message: errorMessage(err) }),
    });
  }

  const pendingKind = exportCollection.isPending ? exportCollection.variables : null;

  return (
    <Stack>
      <Title order={3} size="h4">
        Exporter
      </Title>
      <Text size="sm">
        Toute ta collection, dans le format que ManaBox ou Moxfield savent importer. Pour exporter un seul deck, utilise
        le bouton « Exporter » sur la page du deck.
      </Text>
      <Divider />
      <Group>
        <Button variant="light" onClick={() => run('manabox')} loading={pendingKind === 'manabox'}>
          Exporter pour ManaBox (CSV)
        </Button>
        <Button variant="light" onClick={() => run('moxfield')} loading={pendingKind === 'moxfield'}>
          Exporter pour Moxfield (CSV)
        </Button>
      </Group>
      <Text size="xs" c="dimmed">
        L'export ManaBox garde les rangements (les cartes sans rangement vont dans « Unsorted ») ; l'export Moxfield
        regroupe tout, Moxfield ne connaissant pas les rangements.
      </Text>
    </Stack>
  );
}
