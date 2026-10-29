import { Button, Group, Modal, NumberInput, Stack } from '@mantine/core';
import { useState } from 'react';

import type { DeckBoard } from '../api/types';
import { useLastShown } from '../layout/useLastShown';
import { boardDestinations } from './boards';
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
      {shown && <MoveCopiesForm request={shown} onConfirm={onConfirm} />}
    </Modal>
  );
}

function MoveCopiesForm({
  request,
  onConfirm,
}: {
  request: MoveRequest;
  onConfirm: MoveCopiesModalProps['onConfirm'];
}) {
  const { quantity } = request.entry;
  const [count, setCount] = useState<number | string>(quantity);

  function submit() {
    onConfirm(request, Number(count) || 1);
  }

  return (
    <Stack>
      <NumberInput
        label={`Exemplaires à déplacer (sur ${quantity})`}
        value={count}
        onChange={setCount}
        min={1}
        max={quantity}
        allowDecimal={false}
        clampBehavior="strict"
        onKeyDown={(event) => event.key === 'Enter' && submit()}
        data-autofocus
      />
      <Group justify="flex-end">
        <Button onClick={submit}>Déplacer</Button>
      </Group>
    </Stack>
  );
}
