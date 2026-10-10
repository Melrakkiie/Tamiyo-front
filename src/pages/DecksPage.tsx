import { ActionIcon, Alert, Button, Center, Group, Loader, Menu, SimpleGrid, Stack, Text, Title } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useState } from 'react';
import { useNavigate } from 'react-router';

import { errorMessage } from '../api/errors';
import type { Deck, DeckFolder } from '../api/types';
import { deckArtId } from '../decks/art';
import { useImportIntoDeck } from '../bulk/api';
import { type DeckInput, useAllDecks, useCreateDeck, useDeleteDeck } from '../decks/api';
import { DeckFormModal, type DeckListSubmission } from '../decks/DeckFormModal';
import { deckListSummary } from '../decks/DeckListInput';
import { DraggableDeck, FolderDragProvider, type FolderMoves, FolderTreeView } from '../decks/DeckFolderTree';
import { DeckTile } from '../decks/DeckTile';
import { type FolderEdit, FolderEditModal } from '../decks/FolderModals';
import {
  buildFolderTree,
  useDeckFolders,
  useMoveDeckToFolder,
  useSetFavorite,
  useUpdateFolder,
} from '../decks/folders';
import { useCardArts } from '../scryfall/hooks';

export function DecksPage() {
  const navigate = useNavigate();
  const decks = useAllDecks();
  const folders = useDeckFolders();
  const arts = useCardArts((decks.data ?? []).map(deckArtId));
  const updateFolder = useUpdateFolder();
  const moveDeck = useMoveDeckToFolder();
  const setFavorite = useSetFavorite();
  const [folderEdit, setFolderEdit] = useState<FolderEdit | null>(null);
  const create = useCreateDeck();
  const importList = useImportIntoDeck();
  const remove = useDeleteDeck();
  const [createOpened, setCreateOpened] = useState(false);
  const [listError, setListError] = useState<unknown>(null);

  function closeCreate() {
    setCreateOpened(false);
    setListError(null);
    create.reset();
    importList.reset();
  }

  function createDeck(values: DeckInput, list?: DeckListSubmission) {
    setListError(null);
    create.mutate(values, {
      onSuccess: (created) => {
        if (!list) {
          notifications.show({ color: 'green', message: `${created.name} a été créé.` });
          closeCreate();
          navigate(`/decks/${created.id}`);
          return;
        }
        importList.mutate(
          { deckId: created.id, ...list },
          {
            onSuccess: (summary) => {
              const skipped = (summary.cards_skipped ?? 0) > 0;
              notifications.show({
                color: skipped ? 'yellow' : 'green',
                autoClose: skipped ? false : undefined,
                title: `${created.name} a été créé`,
                message: `Cartes : ${deckListSummary(summary)}.`,
              });
              closeCreate();
              navigate(`/decks/${created.id}`);
            },
            onError: (err) => {
              setListError(err);
              remove.mutate(created.id);
            },
          },
        );
      },
    });
  }

  const allDecks = decks.data ?? [];
  const allFolders = folders.data ?? [];
  const tree = buildFolderTree(allFolders, allDecks);
  const favorites = allDecks.filter((deck) => deck.favorite).sort((a, b) => b.updated.localeCompare(a.updated));
  const moves: FolderMoves = {
    folders: allFolders,
    moveDeck: (deck, folderId) => moveDeck.mutate({ deckId: deck.id, folderId }),
    moveFolder: (folder, parentId) =>
      updateFolder.mutate({
        id: folder.id,
        changes: parentId === null ? { clear_parent: true } : { parent_id: parentId },
      }),
  };

  const tile = (deck: Deck) => {
    const artId = deckArtId(deck);
    return (
      <DeckTile
        deck={deck}
        art={artId ? (arts.data?.[artId] ?? null) : null}
        onToggleFavorite={() => setFavorite.mutate({ deckId: deck.id, favorite: !deck.favorite })}
      />
    );
  };

  const folderMenu = (folder: DeckFolder) => (
    <Menu position="bottom-end" withinPortal>
      <Menu.Target>
        <ActionIcon variant="subtle" color="gray" aria-label={`Actions du dossier ${folder.name}`}>
          <DotsIcon />
        </ActionIcon>
      </Menu.Target>
      <Menu.Dropdown>
        <Menu.Item onClick={() => setFolderEdit({ kind: 'create', parent: folder })}>Nouveau sous-dossier</Menu.Item>
        <Menu.Item onClick={() => setFolderEdit({ kind: 'rename', folder })}>Renommer</Menu.Item>
        <Menu.Item color="red" onClick={() => setFolderEdit({ kind: 'delete', folder })}>
          Supprimer
        </Menu.Item>
      </Menu.Dropdown>
    </Menu>
  );

  return (
    <Stack>
      <Group justify="space-between">
        <div>
          <Title order={2}>Decks</Title>
          {decks.data && (
            <Text size="sm" c="dimmed">
              {decks.data.length} deck{decks.data.length > 1 ? 's' : ''}
            </Text>
          )}
        </div>
        <Group gap="xs">
          <Button variant="default" onClick={() => setFolderEdit({ kind: 'create', parent: null })}>
            Nouveau dossier
          </Button>
          <Button onClick={() => setCreateOpened(true)}>Nouveau deck</Button>
        </Group>
      </Group>

      {decks.error && <Alert color="red">{errorMessage(decks.error)}</Alert>}
      {folders.error && <Alert color="red">{errorMessage(folders.error)}</Alert>}

      {decks.isLoading || folders.isLoading ? (
        <Center p="xl">
          <Loader />
        </Center>
      ) : allDecks.length === 0 && allFolders.length === 0 ? (
        <Center p="xl">
          <Text c="dimmed">Aucun deck pour le moment.</Text>
        </Center>
      ) : (
        <Stack gap="xl">
          {favorites.length > 0 && (
            <Stack gap="sm">
              <Title order={3} size="h4">
                Favoris{' '}
                <Text span size="sm" c="dimmed">
                  ({favorites.length})
                </Text>
              </Title>
              <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }}>
                {favorites.map((deck) => (
                  <div key={deck.id}>{tile(deck)}</div>
                ))}
              </SimpleGrid>
            </Stack>
          )}
          <Stack gap="sm">
            {favorites.length > 0 && (
              <Title order={3} size="h4">
                Tous les decks
              </Title>
            )}
            <FolderDragProvider>
              <FolderTreeView
                tree={tree}
                renderDeck={(deck) => (
                  <DraggableDeck key={deck.id} deck={deck}>
                    {tile(deck)}
                  </DraggableDeck>
                )}
                isCollapsed={(folder) => folder.collapsed}
                onToggle={(folder) => updateFolder.mutate({ id: folder.id, changes: { collapsed: !folder.collapsed } })}
                menu={folderMenu}
                moves={moves}
              />
            </FolderDragProvider>
          </Stack>
        </Stack>
      )}

      <DeckFormModal
        opened={createOpened}
        onClose={closeCreate}
        title="Nouveau deck"
        submitLabel="Créer"
        pending={create.isPending || importList.isPending}
        error={create.error}
        withList
        listError={listError}
        onSubmit={createDeck}
      />
      <FolderEditModal edit={folderEdit} onClose={() => setFolderEdit(null)} />
    </Stack>
  );
}

function DotsIcon() {
  return (
    <svg width={18} height={18} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <circle cx={5} cy={12} r={1.8} />
      <circle cx={12} cy={12} r={1.8} />
      <circle cx={19} cy={12} r={1.8} />
    </svg>
  );
}
