import { Modal } from '@mantine/core';

import type { DeckBoard } from '../api/types';
import { useLastShown } from '../layout/useLastShown';
import { boardDestinations } from './boards';
import { CopyCountForm } from './CopyCountForm';
import type { DeckEntry } from './deckEntries';

export interface MoveRequest {
  entry: DeckEntry;
  board: DeckBoard;
  beforeMove?: () => void;
}

interface MoveCopiesModalProps {
  request: MoveRequest | null;
  onConfirm: (request: MoveRequest, count: number) => void;
  onClose: () => void;
}

export function MoveCopiesModal({ request, onConfirm, onClose }: MoveCopiesModalProps) {
  const shown = useLastShown(request);
  return (
    <Modal
      opened={request !== null}
      onClose={onClose}
      title={shown ? `Déplacer ${shown.entry.name} dans ${boardDestinations[shown.board]}` : undefined}
    >
      {shown && (
        <CopyCountForm
          label="Exemplaires à déplacer"
          max={shown.entry.quantity}
          confirm="Déplacer"
          onSubmit={(count) => onConfirm(shown, count)}
        />
      )}
    </Modal>
  );
}
