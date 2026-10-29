import { Button, Group, Modal, NumberInput, Stack } from '@mantine/core';
import { useState } from 'react';

import type { DeckBoard } from '../api/types';
import { useLastShown } from '../layout/useLastShown';
import type { HistoryChange } from './history';

/** A history action waiting for its copy count; the texts let each action ("Retirer", later "Remettre") reuse the modal. */
export interface HistoryCountRequest {
  change: HistoryChange;
  board: DeckBoard;
  title: string;
  label: string;
  confirm: string;
  max: number;
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
      {shown && <HistoryCountForm request={shown} onConfirm={onConfirm} />}
    </Modal>
  );
}

function HistoryCountForm({
  request,
  onConfirm,
}: {
  request: HistoryCountRequest;
  onConfirm: HistoryCountModalProps['onConfirm'];
}) {
  const [count, setCount] = useState<number | string>(request.max);

  function submit() {
    onConfirm(request, Number(count) || 1);
  }

  return (
    <Stack>
      <NumberInput
        label={`${request.label} (sur ${request.max})`}
        value={count}
        onChange={setCount}
        min={1}
        max={request.max}
        allowDecimal={false}
        clampBehavior="strict"
        onKeyDown={(event) => event.key === 'Enter' && submit()}
        data-autofocus
      />
      <Group justify="flex-end">
        <Button onClick={submit}>{request.confirm}</Button>
      </Group>
    </Stack>
  );
}
