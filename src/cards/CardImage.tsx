import { AspectRatio, Center, Image, Paper, Skeleton, Text } from '@mantine/core';

const CARD_RATIO = 488 / 680;

interface CardImageProps {
  name: string;
  url: string | undefined;
  loading: boolean;
}

export function CardImage({ name, url, loading }: CardImageProps) {
  return (
    <AspectRatio ratio={CARD_RATIO}>
      {url ? (
        <Image src={url} alt={name} radius="md" loading="lazy" />
      ) : loading ? (
        <Skeleton radius="md" />
      ) : (
        <Paper withBorder radius="md">
          <Center h="100%" p="xs">
            <Text size="sm" c="dimmed" ta="center">
              {name}
            </Text>
          </Center>
        </Paper>
      )}
    </AspectRatio>
  );
}
