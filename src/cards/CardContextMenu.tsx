import { Box, Menu } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { type ReactNode, useState } from 'react';

import type { Card } from '../api/types';
import { useScryfallCard } from '../scryfall/hooks';
import { canBeFoil, canBeNonFoil } from '../scryfall/printing';

interface OpenedMenu {
  key: number;
  x: number;
  y: number;
  content: ReactNode;
}

export interface ContextMenuEvent {
  clientX: number;
  clientY: number;
  shiftKey: boolean;
  nativeEvent: Event;
  preventDefault: () => void;
}

export type OpenCardMenu = (event: ContextMenuEvent, content: ReactNode) => void;

function fromTouch(event: ContextMenuEvent) {
  return (event.nativeEvent as Partial<PointerEvent>).pointerType === 'touch';
}

export function useCardContextMenu() {
  const [opened, setOpened] = useState<OpenedMenu | null>(null);

  const open: OpenCardMenu = (event, content) => {
    if (event.shiftKey || fromTouch(event)) {
      return;
    }
    event.preventDefault();
    setOpened((current) => ({ key: (current?.key ?? 0) + 1, x: event.clientX, y: event.clientY, content }));
  };

  const element = opened && (
    <Menu
      key={opened.key}
      opened
      onChange={(next) => !next && setOpened(null)}
      position="bottom-start"
      offset={2}
      width={260}
      withinPortal
      shadow="md"
    >
      <Menu.Target>
        <Box component="span" pos="fixed" left={opened.x} top={opened.y} w={0} h={0} />
      </Menu.Target>
      <Menu.Dropdown onContextMenu={(event) => event.preventDefault()}>{opened.content}</Menu.Dropdown>
    </Menu>
  );

  return { open, element };
}

function pngFrom(url: string): Promise<Blob> {
  return fetch(url, { mode: 'cors' })
    .then((response) => {
      if (!response.ok) {
        throw new Error(`image request failed with ${response.status}`);
      }
      return response.blob();
    })
    .then((blob) => createImageBitmap(blob))
    .then(
      (bitmap) =>
        new Promise<Blob>((resolve, reject) => {
          const canvas = document.createElement('canvas');
          canvas.width = bitmap.width;
          canvas.height = bitmap.height;
          canvas.getContext('2d')?.drawImage(bitmap, 0, 0);
          canvas.toBlob((png) => (png ? resolve(png) : reject(new Error('could not encode the image'))), 'image/png');
        }),
    );
}

function copyText(text: string, message: string) {
  navigator.clipboard.writeText(text).then(
    () => notifications.show({ color: 'green', message }),
    () => notifications.show({ color: 'red', message: "Le presse-papier n'est pas accessible depuis ce navigateur." }),
  );
}

function copyImage(name: string, url: string) {
  const fallback = () =>
    navigator.clipboard.writeText(url).then(
      () =>
        notifications.show({
          color: 'orange',
          message: "Ce navigateur ne peut pas copier l'image : son lien a été copié à la place.",
        }),
      () =>
        notifications.show({ color: 'red', message: "Le presse-papier n'est pas accessible depuis ce navigateur." }),
    );
  if (typeof ClipboardItem === 'undefined' || !navigator.clipboard?.write) {
    void fallback();
    return;
  }
  navigator.clipboard.write([new ClipboardItem({ 'image/png': pngFrom(url) })]).then(
    () => notifications.show({ color: 'green', message: `Image de ${name} copiée.` }),
    () => void fallback(),
  );
}

export function CardCopyItems({ card, imageUrl }: { card: Card; imageUrl: string | undefined }) {
  return (
    <>
      <Menu.Item onClick={() => copyText(card.name, `« ${card.name} » copié.`)}>Copier le nom</Menu.Item>
      <Menu.Item disabled={!imageUrl} onClick={() => imageUrl && copyImage(card.name, imageUrl)}>
        Copier l'image
      </Menu.Item>
      <Menu.Item disabled={!imageUrl} onClick={() => imageUrl && copyText(imageUrl, "Lien de l'image copié.")}>
        Copier le lien de l'image
      </Menu.Item>
    </>
  );
}

export function FoilToggleItem({ card, onToggle }: { card: Card; onToggle: (foil: boolean) => void }) {
  const printing = useScryfallCard(card.scryfall_id);
  if (printing.isLoading) {
    return <Menu.Item disabled>{card.foil ? 'Passer en non-foil' : 'Passer en foil'}</Menu.Item>;
  }
  if (!printing.data) {
    return null;
  }
  const possible = card.foil ? canBeNonFoil(printing.data) : canBeFoil(printing.data);
  if (!possible) {
    return null;
  }
  return (
    <>
      <Menu.Item onClick={() => onToggle(!card.foil)}>{card.foil ? 'Passer en non-foil' : 'Passer en foil'}</Menu.Item>
      <Menu.Divider />
    </>
  );
}
