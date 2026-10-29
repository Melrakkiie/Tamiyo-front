import { Modal } from '@mantine/core';

import type { DeckBoard } from '../api/types';
import { useLastShown } from '../layout/useLastShown';
import { CopyCountForm } from './CopyCountForm';
import type { HistoryChange } from './history';

export interface HistoryCountRequest {
  change: HistoryChange;
  board: DeckBoard;
  title: string;
  label: string;
  confirm: string;
  max: number;
  run: (change: HistoryChange, board: DeckBoard, count: number) => Promise<void>;
}

interface HistoryCountModalProps {
  request: HistoryCountRequest | null;
  onConfirm: (request: HistoryCountRequest, count: number) => void;
  onClose: () => void;
}

export function HistoryCountModal({ request, onConfirm, onClose }: HistoryCountModalProps) {
  const shown = useLastShown(request);
  return (
    <Modal opened={request !== null} onClose={onClose} title={shown?.title}>
      {shown && (
        <CopyCountForm
          label={shown.label}
          max={shown.max}
          confirm={shown.confirm}
          onSubmit={(count) => onConfirm(shown, count)}
        />
      )}
    </Modal>
  );
}
