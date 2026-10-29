import { Button, Group, NumberInput, Stack } from '@mantine/core';
import { useState } from 'react';

interface CopyCountFormProps {
  label: string;
  max: number;
  confirm: string;
  onSubmit: (count: number) => void;
}

export function CopyCountForm({ label, max, confirm, onSubmit }: CopyCountFormProps) {
  const [count, setCount] = useState<number | string>(max);

  function submit() {
    onSubmit(Number(count) || 1);
  }

  return (
    <Stack>
      <NumberInput
        label={`${label} (sur ${max})`}
        value={count}
        onChange={setCount}
        min={1}
        max={max}
        allowDecimal={false}
        clampBehavior="strict"
        onKeyDown={(event) => event.key === 'Enter' && submit()}
        data-autofocus
      />
      <Group justify="flex-end">
        <Button onClick={submit}>{confirm}</Button>
      </Group>
    </Stack>
  );
}
