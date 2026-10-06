import { notifications } from '@mantine/notifications';
import { useEffect, useRef, useState } from 'react';

import { errorMessage } from '../api/errors';
import { fetchCard, type ScryfallCard } from './client';
import { scryfallRefFromDrop } from './dragDrop';

function carriesLink(event: DragEvent) {
  const types = Array.from(event.dataTransfer?.types ?? []);
  return types.some((type) => type.startsWith('text/') || type === 'Files');
}

export function useScryfallDrop(onCard: (card: ScryfallCard) => void) {
  const [dragging, setDragging] = useState(false);
  const [resolving, setResolving] = useState(false);
  const onCardRef = useRef(onCard);
  onCardRef.current = onCard;

  useEffect(() => {
    let depth = 0;
    let internalDrag = false;

    function onDragStart() {
      internalDrag = true;
    }
    function onDragEnd() {
      internalDrag = false;
    }
    function onDragEnter(event: DragEvent) {
      if (internalDrag || !carriesLink(event)) {
        return;
      }
      depth++;
      setDragging(true);
    }
    function onDragOver(event: DragEvent) {
      if (internalDrag || !carriesLink(event)) {
        return;
      }
      event.preventDefault();
      if (event.dataTransfer) {
        event.dataTransfer.dropEffect = 'copy';
      }
    }
    function onDragLeave(event: DragEvent) {
      if (internalDrag || !carriesLink(event)) {
        return;
      }
      depth = Math.max(0, depth - 1);
      if (depth === 0) {
        setDragging(false);
      }
    }
    async function onDrop(event: DragEvent) {
      depth = 0;
      setDragging(false);
      if (internalDrag || !event.dataTransfer) {
        return;
      }
      const ref = scryfallRefFromDrop(event.dataTransfer);
      if (!ref) {
        if (carriesLink(event)) {
          event.preventDefault();
          notifications.show({
            color: 'orange',
            message: "Ce n'est pas une carte Scryfall. Glisse l'image ou le lien d'une carte depuis scryfall.com.",
          });
        }
        return;
      }
      event.preventDefault();
      setResolving(true);
      try {
        const card = await fetchCard(ref);
        if (card) {
          onCardRef.current(card);
        } else {
          notifications.show({ color: 'red', message: 'Cette carte est introuvable sur Scryfall.' });
        }
      } catch (err) {
        notifications.show({ color: 'red', message: errorMessage(err) });
      } finally {
        setResolving(false);
      }
    }

    window.addEventListener('dragstart', onDragStart);
    window.addEventListener('dragend', onDragEnd);
    window.addEventListener('dragenter', onDragEnter);
    window.addEventListener('dragover', onDragOver);
    window.addEventListener('dragleave', onDragLeave);
    window.addEventListener('drop', onDrop);
    return () => {
      window.removeEventListener('dragstart', onDragStart);
      window.removeEventListener('dragend', onDragEnd);
      window.removeEventListener('dragenter', onDragEnter);
      window.removeEventListener('dragover', onDragOver);
      window.removeEventListener('dragleave', onDragLeave);
      window.removeEventListener('drop', onDrop);
    };
  }, []);

  return { dragging, resolving };
}
