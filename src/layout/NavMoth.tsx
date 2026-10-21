import { useLayoutEffect, useRef, useState, type CSSProperties } from 'react';

import { LunaMoth } from '../theme/LunaMoth';
import { mothSize, restingOffset } from './mothSpot';

type Phase = 'land' | 'travel' | 'perched' | 'flown';

const restAngle = -20;
const scale = 4;

let lastSpot: { x: number; y: number; leftAt: number; flown: boolean } | null = null;

function restingSpot(perch: HTMLElement) {
  const style = getComputedStyle(perch);
  const fontSize = parseFloat(style.fontSize);
  return { ...restingOffset(fontSize, letterTip(style, fontSize, perch.firstChild?.textContent ?? '')), fontSize };
}

function letterTip(style: CSSStyleDeclaration, fontSize: number, letter: string) {
  const size = Math.ceil(fontSize * scale * 2);
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const context = canvas.getContext('2d', { willReadFrequently: true });
  if (!context || !size) return null;

  context.font = `${style.fontStyle} ${style.fontWeight} ${fontSize * scale}px ${style.fontFamily}`;
  const origin = { x: size / 4, y: (size * 3) / 4 };
  context.fillText(letter, origin.x, origin.y);
  const { data } = context.getImageData(0, 0, size, size);
  const inked = (x: number, y: number) => data[(y * size + x) * 4 + 3] > 127;

  let top = -1;
  for (let y = 0; y < size && top < 0; y++) {
    for (let x = 0; x < size; x++) {
      if (inked(x, y)) {
        top = y;
        break;
      }
    }
  }
  if (top < 0) return null;

  let tip = { x: -1, y: top };
  for (let y = top; y <= top + scale / 2 && y < size; y++) {
    for (let x = size - 1; x > tip.x; x--) {
      if (inked(x, y)) {
        tip = { x, y };
        break;
      }
    }
  }

  const ascent = context.measureText(letter).fontBoundingBoxAscent / scale;
  return { x: (tip.x + 0.5 - origin.x) / scale, y: ascent + (tip.y - origin.y) / scale };
}

function journeyFrames(dx: number, dy: number, duration: number): Keyframe[] {
  const lift = Math.min(22, 10 + Math.abs(dx) * 0.06);
  const bobs = Math.max(2, Math.round(duration / 300));
  const lean = -Math.sign(dx) * 14;
  const steps = Math.ceil(duration / 16);
  return Array.from({ length: steps + 1 }, (_, i) => {
    const t = i / steps;
    const progress = (1 - Math.cos(Math.PI * t)) / 2;
    const airborne = Math.sin(Math.PI * t);
    const flutter = Math.sin(2 * Math.PI * bobs * t) + 0.5 * Math.sin(2 * Math.PI * bobs * 1.7 * t + 0.5);
    const x = dx * (1 - progress);
    const y = dy * (1 - progress) - lift * Math.sin(Math.PI * progress) - 2 * flutter * airborne;
    const angle = restAngle * (1 - airborne) + (lean + 6 * flutter) * airborne;
    return { transform: `translate(${x}px, ${y}px) rotate(${angle}deg)` };
  });
}

function spotStyle(spot: { left: number; top: number }) {
  return { '--tamiyo-moth-left': `${spot.left}px`, '--tamiyo-moth-top': `${spot.top}px` } as CSSProperties;
}

export interface NavMothProps {
  // CSS selector of the element whose hover (closest ancestor of the moth) makes it take off; none, no take-off.
  trigger?: string;
  // Also take off when the trigger gets keyboard focus.
  focusTakeOff?: boolean;
  // Drop shadow, for perches over an illustration.
  shadow?: boolean;
}

// Perches on the last letter of its parent element, sized by that element's font.
export function NavMoth({ trigger, focusTakeOff = false, shadow = false }: NavMothProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const [phase, setPhase] = useState<Phase>('land');
  const [style, setStyle] = useState<CSSProperties>();
  const [height, setHeight] = useState(0);
  const journey = useRef<{ dx: number; dy: number } | null>(undefined);

  useLayoutEffect(() => {
    const moth = ref.current;
    const perch = moth?.parentElement;
    if (!moth || !perch) return;
    const link = trigger ? moth.closest<HTMLElement>(trigger) : null;
    const still = matchMedia('(prefers-reduced-motion: reduce)').matches;

    let spot = restingSpot(perch);
    setHeight(mothSize(spot.fontSize).height);
    const locate = () => {
      const box = perch.getBoundingClientRect();
      return { x: box.left + spot.left, y: box.top + spot.top };
    };
    let here = locate();
    if (journey.current === undefined) {
      journey.current = null;
      if (lastSpot && !lastSpot.flown && performance.now() - lastSpot.leftAt < 500) {
        const dx = lastSpot.x - here.x;
        const dy = lastSpot.y - here.y;
        if ((dx || dy) && !still) journey.current = { dx, dy };
      }
    }
    const trip = journey.current;
    let flight: Animation | null = null;
    if (trip) {
      const duration = Math.min(1800, 900 + Math.hypot(trip.dx, trip.dy) * 2.5);
      setStyle({ ...spotStyle(spot), '--tamiyo-moth-duration': `${duration}ms` } as CSSProperties);
      setPhase((current) => (current === 'land' ? 'travel' : current));
      flight = moth.animate(journeyFrames(trip.dx, trip.dy, duration), duration);
      flight.finished.then(
        () => setPhase((current) => (current === 'travel' ? 'perched' : current)),
        () => {},
      );
    } else {
      setStyle(spotStyle(spot));
    }

    // The perch's font can change with the web font loading or a breakpoint.
    const refresh = () => {
      spot = restingSpot(perch);
      here = locate();
      setHeight(mothSize(spot.fontSize).height);
      setStyle((current) => ({ ...current, ...spotStyle(spot) }));
    };
    let mounted = true;
    void document.fonts.ready.then(() => {
      if (mounted) refresh();
    });
    let resizing = 0;
    const onResize = () => {
      cancelAnimationFrame(resizing);
      resizing = requestAnimationFrame(refresh);
    };
    window.addEventListener('resize', onResize);

    let armed = !!link && !still && !link.matches(':hover') && !(focusTakeOff && link.matches(':focus-visible'));
    let flown = false;
    const takeOff = () => {
      if (!armed) return;
      flown = true;
      flight?.cancel();
      setPhase('flown');
    };
    const takeOffOnFocus = () => {
      if (focusTakeOff && link?.matches(':focus-visible')) takeOff();
    };
    const arm = () => {
      armed = !still;
    };
    link?.addEventListener('mouseenter', takeOff);
    link?.addEventListener('focus', takeOffOnFocus);
    link?.addEventListener('mouseleave', arm);
    link?.addEventListener('blur', arm);
    return () => {
      mounted = false;
      flight?.cancel();
      cancelAnimationFrame(resizing);
      link?.removeEventListener('mouseenter', takeOff);
      link?.removeEventListener('focus', takeOffOnFocus);
      link?.removeEventListener('mouseleave', arm);
      link?.removeEventListener('blur', arm);
      window.removeEventListener('resize', onResize);
      lastSpot = { ...here, leftAt: performance.now(), flown };
    };
  }, []);

  return (
    <span
      ref={ref}
      className="tamiyo-nav-moth"
      data-phase={phase}
      data-shadow={shadow || undefined}
      style={style}
      aria-hidden
      onAnimationEnd={(event) => {
        if (event.target === event.currentTarget && phase !== 'flown') setPhase('perched');
      }}
    >
      <span className="tamiyo-nav-moth-wings">
        <LunaMoth size={height} />
      </span>
    </span>
  );
}
