import { Box, Portal } from '@mantine/core';
import { createContext, type ReactNode, useCallback, useContext, useEffect, useRef, useState } from 'react';

export interface DropHandler<T> {
  accepts: (item: T) => boolean;
  onDrop: (item: T) => void;
}

interface DragPosition<T> {
  item: T;
  x: number;
  y: number;
}

interface PointerStart {
  pointerId: number;
  pointerType: string;
  button: number;
  clientX: number;
  clientY: number;
}

interface DragContextValue<T> {
  drag: DragPosition<T> | null;
  overId: string | null;
  begin: (event: PointerStart, item: T) => void;
  register: (id: string, handler: DropHandler<T>) => () => void;
}

const MOUSE_THRESHOLD = 6;
const TOUCH_HOLD_MS = 350;
const SCROLL_EDGE = 80;
const CLICK_AFTER_RELEASE_MS = 60;

interface DragDropOptions<T> {
  sameItem: (a: T, b: T) => boolean;
  Ghost: (props: { item: T }) => ReactNode;
}

export function createDragDrop<T>({ sameItem, Ghost }: DragDropOptions<T>) {
  const DragContext = createContext<DragContextValue<T> | null>(null);

  function DragProvider({ children }: { children: ReactNode }) {
    const [drag, setDrag] = useState<DragPosition<T> | null>(null);
    const [overId, setOverId] = useState<string | null>(null);
    const handlers = useRef(new Map<string, DropHandler<T>>());
    const cleanupRef = useRef<(() => void) | null>(null);

    useEffect(() => () => cleanupRef.current?.(), []);

    const register = useCallback((id: string, handler: DropHandler<T>) => {
      handlers.current.set(id, handler);
      return () => {
        if (handlers.current.get(id) === handler) {
          handlers.current.delete(id);
        }
      };
    }, []);

    const begin = useCallback((event: PointerStart, item: T) => {
      const touch = event.pointerType === 'touch';
      const mouse = event.pointerType === 'mouse';
      if ((!touch && event.button !== 0) || cleanupRef.current) {
        return;
      }
      const pointerId = event.pointerId;
      const start = { x: event.clientX, y: event.clientY };
      let position = start;
      let started = false;
      let scrollSpeed = 0;
      let scrollFrame = 0;
      let holdTimer = 0;

      const targetAt = (x: number, y: number) => {
        const element = document.elementFromPoint(x, y)?.closest('[data-drop-target]');
        const id = element?.getAttribute('data-drop-target') ?? null;
        return id && handlers.current.get(id)?.accepts(item) ? id : null;
      };

      const refresh = () => {
        setDrag({ item, x: position.x, y: position.y });
        setOverId(targetAt(position.x, position.y));
      };

      const scroll = () => {
        if (scrollSpeed === 0) {
          scrollFrame = 0;
          return;
        }
        window.scrollBy(0, scrollSpeed);
        setOverId(targetAt(position.x, position.y));
        scrollFrame = window.requestAnimationFrame(scroll);
      };

      const updateScroll = () => {
        let overBar = false;
        let topEdge = 0;
        document.querySelectorAll('[data-no-autoscroll]').forEach((panel) => {
          const rect = panel.getBoundingClientRect();
          const inColumn = position.x >= rect.left && position.x <= rect.right;
          if (inColumn && position.y >= rect.top && position.y <= rect.bottom) {
            overBar = true;
          }
          if (inColumn && panel.getAttribute('data-no-autoscroll') === 'top') {
            topEdge = Math.max(topEdge, rect.bottom);
          }
        });
        const fromTop = position.y - topEdge;
        const fromBottom = window.innerHeight - position.y;
        scrollSpeed = overBar
          ? 0
          : fromTop < SCROLL_EDGE
            ? -Math.ceil((SCROLL_EDGE - Math.max(fromTop, 0)) / 4)
            : fromBottom < SCROLL_EDGE
              ? Math.ceil((SCROLL_EDGE - fromBottom) / 4)
              : 0;
        if (scrollSpeed !== 0 && scrollFrame === 0) {
          scrollFrame = window.requestAnimationFrame(scroll);
        }
      };

      const startDrag = () => {
        started = true;
        window.getSelection()?.removeAllRanges();
        document.body.style.userSelect = 'none';
        document.body.style.cursor = 'grabbing';
        document.body.dataset.cardDragging = 'true';
        refresh();
      };

      const onMove = (moveEvent: PointerEvent) => {
        if (moveEvent.pointerId !== pointerId) {
          return;
        }
        if (mouse && moveEvent.buttons === 0) {
          cancel();
          return;
        }
        position = { x: moveEvent.clientX, y: moveEvent.clientY };
        if (!started) {
          const distance = Math.hypot(position.x - start.x, position.y - start.y);
          if (distance <= MOUSE_THRESHOLD) {
            return;
          }
          if (touch) {
            cleanup();
            return;
          }
          startDrag();
          return;
        }
        refresh();
        updateScroll();
      };

      const swallowNextClick = (releasedAt: number) => {
        const swallow = (clickEvent: MouseEvent) => {
          if (clickEvent.timeStamp - releasedAt < CLICK_AFTER_RELEASE_MS) {
            clickEvent.preventDefault();
            clickEvent.stopPropagation();
          }
        };
        window.addEventListener('click', swallow, { capture: true });
        window.setTimeout(() => window.removeEventListener('click', swallow, { capture: true }), 300);
      };

      const onUp = (upEvent: PointerEvent) => {
        if (upEvent.pointerId !== pointerId) {
          return;
        }
        if (!started) {
          cleanup();
          return;
        }
        position = { x: upEvent.clientX, y: upEvent.clientY };
        const id = targetAt(position.x, position.y);
        swallowNextClick(upEvent.timeStamp);
        cleanup();
        if (id) {
          handlers.current.get(id)?.onDrop(item);
        }
      };

      const onCancelEvent = (cancelEvent: PointerEvent) => {
        if (cancelEvent.pointerId === pointerId) {
          cancel();
        }
      };

      function cancel() {
        if (started) {
          const releaseAfterCancel = (upEvent: PointerEvent) => {
            if (upEvent.pointerId === pointerId) {
              swallowNextClick(upEvent.timeStamp);
            }
          };
          window.addEventListener('pointerup', releaseAfterCancel, { once: true });
          window.setTimeout(() => window.removeEventListener('pointerup', releaseAfterCancel), 10_000);
        }
        cleanup();
      }

      const onTouchMove = (touchEvent: TouchEvent) => {
        if (started) {
          touchEvent.preventDefault();
        }
      };

      const onKey = (keyEvent: KeyboardEvent) => {
        if (keyEvent.key === 'Escape') {
          cancel();
        }
      };

      const onContextMenu = (menuEvent: Event) => {
        if (touch) {
          menuEvent.preventDefault();
        } else {
          cancel();
        }
      };

      const onVisibility = () => {
        if (document.visibilityState === 'hidden') {
          cancel();
        }
      };

      function cleanup() {
        window.removeEventListener('pointermove', onMove);
        window.removeEventListener('pointerup', onUp);
        window.removeEventListener('pointercancel', onCancelEvent);
        window.removeEventListener('touchmove', onTouchMove);
        window.removeEventListener('keydown', onKey);
        window.removeEventListener('contextmenu', onContextMenu);
        window.removeEventListener('blur', cancel);
        document.removeEventListener('visibilitychange', onVisibility);
        window.clearTimeout(holdTimer);
        if (scrollFrame) {
          window.cancelAnimationFrame(scrollFrame);
        }
        if (started) {
          document.body.style.userSelect = '';
          document.body.style.cursor = '';
          delete document.body.dataset.cardDragging;
        }
        cleanupRef.current = null;
        setDrag(null);
        setOverId(null);
      }

      window.addEventListener('pointermove', onMove);
      window.addEventListener('pointerup', onUp);
      window.addEventListener('pointercancel', onCancelEvent);
      window.addEventListener('touchmove', onTouchMove, { passive: false });
      window.addEventListener('keydown', onKey);
      window.addEventListener('contextmenu', onContextMenu);
      window.addEventListener('blur', cancel);
      document.addEventListener('visibilitychange', onVisibility);
      if (touch) {
        holdTimer = window.setTimeout(startDrag, TOUCH_HOLD_MS);
      }
      cleanupRef.current = cleanup;
    }, []);

    return (
      <DragContext.Provider value={{ drag, overId, begin, register }}>
        {children}
        {drag && <DragGhost drag={drag} />}
      </DragContext.Provider>
    );
  }

  function DragGhost({ drag }: { drag: DragPosition<T> }) {
    return (
      <Portal>
        <Box
          pos="fixed"
          left={drag.x + 14}
          top={drag.y + 14}
          style={{ zIndex: 1000, pointerEvents: 'none', transform: 'rotate(-3deg)' }}
        >
          <Ghost item={drag.item} />
        </Box>
      </Portal>
    );
  }

  function useDraggedItem(): T | null {
    return useContext(DragContext)?.drag?.item ?? null;
  }

  function useDropTarget(id: string | null, handler: DropHandler<T>) {
    const context = useContext(DragContext);
    const handlerRef = useRef(handler);
    handlerRef.current = handler;
    const register = context?.register;

    useEffect(() => {
      if (!register || id === null) {
        return;
      }
      return register(id, {
        accepts: (item) => handlerRef.current.accepts(item),
        onDrop: (item) => handlerRef.current.onDrop(item),
      });
    }, [register, id]);

    const item = context?.drag?.item ?? null;
    const active = id !== null && item !== null && handler.accepts(item);
    return {
      active,
      over: active && context?.overId === id,
      targetProps: id === null ? {} : { 'data-drop-target': id },
    };
  }

  function Draggable({ item, children }: { item: T; children: ReactNode }) {
    const context = useContext(DragContext);
    if (!context) {
      return <>{children}</>;
    }
    const dragging = context.drag !== null && sameItem(context.drag.item, item);
    return (
      <div
        onPointerDown={(event) => context.begin(event, item)}
        onDragStart={(event) => event.preventDefault()}
        style={{
          opacity: dragging ? 0.35 : undefined,
          cursor: 'grab',
          userSelect: 'none',
          WebkitUserSelect: 'none',
          WebkitTouchCallout: 'none',
          transition: 'opacity 120ms ease',
        }}
      >
        {children}
      </div>
    );
  }

  return { DragProvider, useDraggedItem, useDropTarget, Draggable };
}
