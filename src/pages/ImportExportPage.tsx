import {
  Alert,
  Anchor,
  Autocomplete,
  Button,
  Divider,
  FileInput,
  Group,
  Paper,
  SegmentedControl,
  Select,
  Stack,
  Switch,
  Text,
  TextInput,
  Title,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useState } from 'react';
import { Link } from 'react-router';

import { errorMessage } from '../api/errors';
import type { ImportSummary } from '../api/types';
import {
  type CollectionExport,
  useExportCollection,
  useImportManaBox,
  useImportMoxfieldCollection,
  useImportMoxfieldDeck,
} from '../bulk/api';
import { ImportResult } from '../bulk/ImportResult';
import { useDeckFormats } from '../decks/api';
import { useStorageOptions } from '../storages/api';

type Source = 'manabox' | 'moxfield-collection' | 'moxfield-deck';

const sources: { value: Source; label: string }[] = [
  { value: 'manabox', label: 'Collection ManaBox' },
  { value: 'moxfield-collection', label: 'Collection Moxfield' },
  { value: 'moxfield-deck', label: 'Deck Moxfield' },
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
          <SegmentedControl data={sources} value={source} onChange={(value) => setSource(value as Source)} fullWidth />
          {source === 'manabox' && <ManaBoxImport key="manabox" />}
          {source === 'moxfield-collection' && <MoxfieldCollectionImport key="moxfield-collection" />}
          {source === 'moxfield-deck' && <MoxfieldDeckImport key="moxfield-deck" />}
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

function MoxfieldDeckImport() {
  const [file, setFile] = useState<File | null>(null);
  const [name, setName] = useState('');
  const [format, setFormat] = useState('commander');
  const [commanderFromFirstLine, setCommanderFromFirstLine] = useState(true);
  const [storageId, setStorageId] = useState<string | null>(null);
  const [summary, setSummary] = useState<ImportSummary | null>(null);
  const formats = useDeckFormats();
  const storageOptions = useStorageOptions();
  const mutation = useImportMoxfieldDeck();
  const ready = !!file && name.trim() !== '' && format.trim() !== '';

  function submit() {
    if (!file || !ready) {
      return;
    }
    setSummary(null);
    mutation.mutate(
      {
        file,
        name: name.trim(),
        format: format.trim().toLowerCase(),
        commanderFromFirstLine,
        storageId: storageId ? Number(storageId) : null,
      },
      {
        onSuccess: (result) => {
          setSummary(result);
          setFile(null);
          setName('');
        },
      },
    );
  }

  return (
    <Stack>
      <Text size="sm">
        Sur la page du deck dans Moxfield : <b>More → Export → Plain Text</b>, puis enregistre le texte dans un fichier
        .txt. Les cartes sont ajoutées à ta collection et rangées dans un nouveau deck.
      </Text>
      <FileInput
        label="Fichier texte du deck"
        placeholder="Choisis le fichier"
        accept=".txt,text/plain"
        value={file}
        onChange={setFile}
        clearable
      />
      <Group grow align="flex-start">
        <TextInput
          label="Nom du deck"
          placeholder="Atraxa superfriends…"
          value={name}
          onChange={(event) => setName(event.currentTarget.value)}
        />
        <Autocomplete label="Format" data={formats} value={format} onChange={setFormat} />
      </Group>
      <Select
        label="Rangement (facultatif)"
        placeholder="Aucun rangement"
        data={storageOptions}
        value={storageId}
        onChange={setStorageId}
        clearable
        searchable
      />
      <Switch
        label="La première ligne du fichier est le commandant"
        checked={commanderFromFirstLine}
        onChange={(event) => setCommanderFromFirstLine(event.currentTarget.checked)}
      />
      {mutation.error && (
        <Alert color="red">{importErrorMessage(mutation.error, "de l'export texte d'un deck Moxfield")}</Alert>
      )}
      {summary && (
        <>
          <ImportResult summary={summary} />
          <Anchor component={Link} to="/decks" size="sm">
            Voir mes decks
          </Anchor>
        </>
      )}
      <Group justify="flex-end">
        <Button onClick={submit} disabled={!ready} loading={mutation.isPending}>
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
