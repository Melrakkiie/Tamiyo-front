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
  Textarea,
  TextInput,
  Title,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useState } from 'react';
import { Link } from 'react-router';

import { ApiError, errorMessage } from '../api/errors';
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
  { value: 'moxfield-deck', label: 'Deck' },
];

const longImportNote =
  "Un gros fichier peut prendre une à deux minutes : Tamiyo interroge Scryfall pour chaque lot de 75 cartes, à son rythme. Reste sur la page jusqu'à la fin.";

function importErrorMessage(err: unknown, expected: string) {
  const unreadLine =
    err instanceof ApiError && err.status === 400 ? /line (\d+): unrecognized format "(.*)"/.exec(err.message) : null;
  if (unreadLine) {
    return `La ligne ${unreadLine[1]} n'a pas pu être lue : « ${unreadLine[2]} ». Vérifie qu'il s'agit bien ${expected}.`;
  }
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

type DeckInput = 'text' | 'file';

const deckInputs: { value: DeckInput; label: string }[] = [
  { value: 'text', label: 'Coller la liste' },
  { value: 'file', label: 'Fichier texte' },
];

function MoxfieldDeckImport() {
  const [input, setInput] = useState<DeckInput>('text');
  const [text, setText] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [name, setName] = useState('');
  const [format, setFormat] = useState('commander');
  const [commanderFromFirstLine, setCommanderFromFirstLine] = useState(true);
  const [summary, setSummary] = useState<ImportSummary | null>(null);
  const formats = useDeckFormats();
  const mutation = useImportMoxfieldDeck();
  const source = input === 'file' ? file : text.trim() ? new File([text], 'deck.txt', { type: 'text/plain' }) : null;
  const ready = !!source && name.trim() !== '' && format.trim() !== '';

  function submit() {
    if (!source || !ready) {
      return;
    }
    setSummary(null);
    mutation.mutate(
      {
        file: source,
        name: name.trim(),
        format: format.trim().toLowerCase(),
        commanderFromFirstLine,
      },
      {
        onSuccess: (result) => {
          setSummary(result);
          setFile(null);
          setText('');
          setName('');
        },
      },
    );
  }

  return (
    <Stack>
      <Text size="sm">
        Une carte par ligne : l'export d'un deck Moxfield (sur la page du deck : <b>More → Export → Plain Text</b>) ou
        une simple liste comme « 4 Lightning Bolt ». Un nouveau deck est créé sans rien ajouter à ta collection : les
        cartes que tu possèdes y sont mises (dans l'édition indiquée quand la ligne la précise), les autres y
        apparaissent en orange, à ajouter à ta collection plus tard.
      </Text>
      <SegmentedControl
        data={deckInputs}
        value={input}
        onChange={(value) => setInput(value as DeckInput)}
        w="fit-content"
      />
      {input === 'text' ? (
        <Textarea
          label="Liste du deck"
          placeholder={"1 Atraxa, Praetors' Voice\n4 Lightning Bolt\n1 Sol Ring (SLD) 1011"}
          value={text}
          onChange={(event) => setText(event.currentTarget.value)}
          autosize
          minRows={8}
          maxRows={20}
          styles={{ input: { fontFamily: 'var(--mantine-font-family-monospace)' } }}
        />
      ) : (
        <FileInput
          label="Fichier texte du deck"
          placeholder="Choisis le fichier"
          accept=".txt,text/plain"
          value={file}
          onChange={setFile}
          clearable
        />
      )}
      <Group grow align="flex-start">
        <TextInput
          label="Nom du deck"
          placeholder="Atraxa superfriends…"
          value={name}
          onChange={(event) => setName(event.currentTarget.value)}
        />
        <Autocomplete label="Format" data={formats} value={format} onChange={setFormat} />
      </Group>
      <Switch
        label="La première ligne est le commandant"
        checked={commanderFromFirstLine}
        onChange={(event) => setCommanderFromFirstLine(event.currentTarget.checked)}
      />
      {mutation.error && (
        <Alert color="red">
          {importErrorMessage(mutation.error, "d'un export Moxfield ou d'une liste « 4 Lightning Bolt »")}
        </Alert>
      )}
      {summary && (
        <>
          <ImportResult summary={summary} kind="deck" />
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
