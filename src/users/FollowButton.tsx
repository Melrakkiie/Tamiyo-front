import { Button } from '@mantine/core';

import { useFollow } from './api';

interface FollowButtonProps {
  userId: string;
  name: string;
  followed: boolean;
  size?: 'xs' | 'sm';
}

export function FollowButton({ userId, name, followed, size = 'sm' }: FollowButtonProps) {
  const follow = useFollow();
  return (
    <Button
      size={size}
      variant={followed ? 'default' : 'filled'}
      loading={follow.isPending}
      onClick={() => follow.mutate({ id: userId, follow: !followed, name })}
    >
      {followed ? 'Ne plus suivre' : 'Suivre'}
    </Button>
  );
}
