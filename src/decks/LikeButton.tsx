import { Button, Group, Text } from '@mantine/core';

import { useDeckLikes, useLikeDeck } from './likes';

export function HeartIcon({ filled = false, size = 16 }: { filled?: boolean; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={filled ? 'currentColor' : 'none'}
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      style={{ display: 'block', flexShrink: 0 }}
    >
      <path d="M19.5 12.572l-7.5 7.428l-7.5 -7.428a5 5 0 1 1 7.5 -6.566a5 5 0 1 1 7.5 6.572" />
    </svg>
  );
}

export function LikeCount({ count, onImage = false }: { count: number; onImage?: boolean }) {
  return (
    <Group gap={4} wrap="nowrap" c={onImage ? 'white' : 'dimmed'} title={`${count} j'aime`}>
      <HeartIcon size={14} filled={count > 0} />
      <Text size="sm" c="inherit">
        {count}
      </Text>
    </Group>
  );
}

interface LikeButtonProps {
  deckId: string;
  canLike: boolean;
  onImage?: boolean;
}

export function LikeButton({ deckId, canLike, onImage = false }: LikeButtonProps) {
  const likes = useDeckLikes(deckId);
  const like = useLikeDeck();
  if (!likes.data) {
    return null;
  }
  const { likes_count: count, liked_by_me: liked } = likes.data;
  if (!canLike) {
    return <LikeCount count={count} onImage={onImage} />;
  }
  return (
    <Button
      size="compact-sm"
      variant={liked ? 'filled' : onImage ? 'white' : 'default'}
      color={liked ? 'pink' : undefined}
      leftSection={<HeartIcon filled={liked} size={14} />}
      loading={like.isPending}
      onClick={() => like.mutate({ deckId, like: !liked })}
      aria-label={liked ? "Retirer mon j'aime" : "J'aime ce deck"}
      title={liked ? "Retirer mon j'aime" : "J'aime ce deck"}
    >
      {count}
    </Button>
  );
}
