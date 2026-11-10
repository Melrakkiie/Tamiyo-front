import { Tabs, type TabsListProps } from '@mantine/core';
import { useEffect, useRef, useState } from 'react';

interface Props extends TabsListProps {
  /** The active tab value, so the list can scroll it into view. */
  value: string | null;
}

/** The deck pages' tab list: one line that scrolls sideways on small screens, with edge fades. */
export function DeckTabsList({ value, ...props }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [edges, setEdges] = useState({ start: false, end: false });

  useEffect(() => {
    const list = ref.current;
    if (!list) return;
    const update = () =>
      setEdges({
        start: list.scrollLeft > 1,
        end: list.scrollLeft + list.clientWidth < list.scrollWidth - 1,
      });
    update();
    list.addEventListener('scroll', update, { passive: true });
    const observer = new ResizeObserver(update);
    observer.observe(list);
    return () => {
      list.removeEventListener('scroll', update);
      observer.disconnect();
    };
  }, []);

  useEffect(() => {
    ref.current?.querySelector('[data-active]')?.scrollIntoView({ inline: 'nearest', block: 'nearest' });
  }, [value]);

  return (
    <Tabs.List
      ref={ref}
      className="tamiyo-deck-tabs"
      data-fade-start={edges.start || undefined}
      data-fade-end={edges.end || undefined}
      {...props}
    />
  );
}
