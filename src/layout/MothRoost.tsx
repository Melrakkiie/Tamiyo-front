import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';

import { MothPerch } from './MothPerch';
import { isRendered, pickPerch } from './mothSpot';

const returnAfter = 6000;

interface Perch {
  element: HTMLElement;
  title: boolean;
}

interface Roost {
  // null until the first chase: the title holds the moth.
  holder: string | null;
  // Bumped on every landing, so landing back on the perch just left still replays the landing.
  landings: number;
  perches: Map<string, Perch>;
  fly: (from: string) => void;
  // The holder is gone: after the return delay the moth lands elsewhere, as if chased.
  abandon: (from: string) => void;
}

const RoostContext = createContext<Roost | null>(null);

function inSight(element: HTMLElement) {
  const box = element.getBoundingClientRect();
  return isRendered(box) && box.bottom > 0 && box.right > 0 && box.top < innerHeight && box.left < innerWidth;
}

// One moth shared by every RoamingPerch inside; only the perch holding it renders it.
export function MothRoost({ children }: { children: ReactNode }) {
  const [perches] = useState(() => new Map<string, Perch>());
  const [landing, setLanding] = useState<{ holder: string | null; count: number }>({ holder: null, count: 0 });
  const fly = useCallback(
    (from: string) => {
      const candidates = [...perches].map(([id, perch]) => ({
        id,
        title: perch.title,
        visible: inSight(perch.element),
      }));
      const holder = pickPerch(candidates, from, Math.random) ?? null;
      setLanding(({ count }) => ({ holder, count: count + 1 }));
    },
    [perches],
  );
  const timers = useRef(new Set<number>());
  useEffect(() => {
    const pending = timers.current;
    return () => pending.forEach(clearTimeout);
  }, []);
  const abandon = useCallback(
    (from: string) => {
      const timer = window.setTimeout(() => {
        timers.current.delete(timer);
        // Still registered: a StrictMode remount, not a departure.
        if (!perches.has(from)) fly(from);
      }, returnAfter);
      timers.current.add(timer);
    },
    [perches, fly],
  );
  return (
    <RoostContext.Provider value={{ holder: landing.holder, landings: landing.count, perches, fly, abandon }}>
      {children}
    </RoostContext.Provider>
  );
}

export function RoamingPerch({ text, title = false, shadow }: { text: string; title?: boolean; shadow?: boolean }) {
  const roost = useContext(RoostContext)!;
  const id = useId();
  const ref = useRef<HTMLSpanElement>(null);
  const { perches } = roost;
  const holding = roost.holder === null ? title : roost.holder === id;
  const holdingNow = useRef(holding);
  holdingNow.current = holding;
  const { abandon } = roost;
  useLayoutEffect(() => {
    perches.set(id, { element: ref.current!, title });
    return () => {
      perches.delete(id);
      if (holdingNow.current) abandon(id);
    };
  }, [perches, id, title, abandon]);

  return (
    <span ref={ref} className="tamiyo-roaming-perch">
      {holding ? (
        <MothPerch
          key={roost.landings}
          text={text}
          shadow={shadow}
          trigger=".tamiyo-roaming-perch"
          returnAfter={returnAfter}
          onReturn={() => roost.fly(id)}
        />
      ) : (
        text
      )}
    </span>
  );
}
