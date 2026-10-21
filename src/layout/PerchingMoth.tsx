import { useLayoutEffect, useRef, useState, type CSSProperties } from 'react';

import { LunaMoth } from '../theme/LunaMoth';
import { flightPose, isRendered, restingOffset, type Trip } from './mothSpot';

type Phase = 'land' | 'travel' | 'perched' | 'flown';

const restAngle = -20;
const oversample = 4;

let lastSpot: { x: number; y: number; height: number; leftAt: number; flown: boolean } | null = null;

function restingSpot(perch: HTMLElement) {
  const style = getComputedStyle(perch);
  const fontSize = parseFloat(style.fontSize);
  return { ...restingOffset(fontSize, letterTip(style, fontSize, perch.firstChild?.textContent ?? '')), fontSize };
}

function letterTip(style: CSSStyleDeclaration, fontSize: number, letter: string) {
  const size = Math.ceil(fontSize * oversample * 2);
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const context = canvas.getContext('2d', { willReadFrequently: true });
  if (!context || !size) return null;

  context.font = `${style.fontStyle} ${style.fontWeight} ${fontSize * oversample}px ${style.fontFamily}`;
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
  for (let y = top; y <= top + oversample / 2 && y < size; y++) {
    for (let x = size - 1; x > tip.x; x--) {
      if (inked(x, y)) {
        tip = { x, y };
        break;
      }
    }
  }

  const ascent = context.measureText(letter).fontBoundingBoxAscent / oversample;
  return { x: (tip.x + 0.5 - origin.x) / oversample, y: ascent + (tip.y - origin.y) / oversample };
}

function transitionsAround(element: HTMLElement) {
  return document
    .getAnimations()
    .filter(
      (animation): animation is CSSTransition =>
        animation instanceof CSSTransition &&
        animation.effect instanceof KeyframeEffect &&
        !!animation.effect.target?.contains(element),
    );
}

function rectAfterTransitions(element: HTMLElement, running = transitionsAround(element)) {
  const times = running.map((animation) => animation.currentTime);
  running.forEach((animation) => {
    animation.currentTime = animation.effect?.getComputedTiming().endTime ?? 0;
  });
  const box = element.getBoundingClientRect();
  running.forEach((animation, i) => {
    animation.currentTime = times[i];
  });
  return box;
}

function journeyFrames(trip: Trip, duration: number): Keyframe[] {
  const lift = Math.min(22, 10 + Math.abs(trip.dx) * 0.06);
  const bobs = Math.max(2, Math.round(duration / 300));
  const lean = -Math.sign(trip.dx) * 14;
  const steps = Math.ceil(duration / 16);
  return Array.from({ length: steps + 1 }, (_, i) => {
    const t = i / steps;
    const progress = (1 - Math.cos(Math.PI * t)) / 2;
    const airborne = Math.sin(Math.PI * t);
    const flutter = Math.sin(2 * Math.PI * bobs * t) + 0.5 * Math.sin(2 * Math.PI * bobs * 1.7 * t + 0.5);
    const pose = flightPose(trip, progress);
    const y = pose.y - lift * Math.sin(Math.PI * progress) - 2 * flutter * airborne;
    const angle = restAngle * (1 - airborne) + (lean + 6 * flutter) * airborne;
    return { transform: `translate(${pose.x}px, ${y}px) rotate(${angle}deg) scale(${pose.scale})` };
  });
}

function spotStyle(spot: { left: number; top: number }) {
  return { '--tamiyo-moth-left': `${spot.left}px`, '--tamiyo-moth-top': `${spot.top}px` } as CSSProperties;
}

export interface PerchingMothProps {
  // No trigger, no take-off.
  trigger?: string;
  focusTakeOff?: boolean;
  shadow?: boolean;
  // Without it, a moth that took off stays flown.
  returnAfter?: number;
}

export function PerchingMoth({ trigger, focusTakeOff = false, shadow = false, returnAfter }: PerchingMothProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const [phase, setPhase] = useState<Phase>('land');
  const [style, setStyle] = useState<CSSProperties>();
  const [height, setHeight] = useState(0);
  const journey = useRef<Trip | null>(undefined);
  const landing = useRef(false);

  useLayoutEffect(() => {
    const moth = ref.current;
    const perch = moth?.parentElement;
    if (!moth || !perch) return;
    const link = trigger ? moth.closest<HTMLElement>(trigger) : null;
    const still = matchMedia('(prefers-reduced-motion: reduce)').matches;

    let spot = restingSpot(perch);
    setHeight(spot.fontSize);
    // A perch behind display: none (the header links on mobile) has no position to fly from or to.
    const locate = (settled = false) => {
      const box = settled ? rectAfterTransitions(perch) : perch.getBoundingClientRect();
      return { x: box.left + spot.left, y: box.top + spot.top, rendered: isRendered(box) };
    };
    let here = locate(true);
    if (journey.current === undefined) {
      journey.current = null;
      if (here.rendered && lastSpot && !lastSpot.flown && performance.now() - lastSpot.leftAt < 500) {
        const dx = lastSpot.x - here.x;
        const dy = lastSpot.y - here.y;
        const toHeight = spot.fontSize;
        if ((dx || dy || lastSpot.height !== toHeight) && !still) {
          journey.current = { dx, dy, fromHeight: lastSpot.height, toHeight };
        }
      }
    }
    const trip = journey.current;
    let flight: Animation | null = null;
    let following = 0;
    if (trip) {
      const duration = Math.min(1800, 900 + Math.hypot(trip.dx, trip.dy) * 2.5);
      setStyle({ ...spotStyle(spot), '--tamiyo-moth-duration': `${duration}ms` } as CSSProperties);
      setPhase((current) => (current === 'land' ? 'travel' : current));
      flight = moth.animate(journeyFrames(trip, duration), duration);
      flight.finished.then(
        () => setPhase((current) => (current === 'travel' ? 'perched' : current)),
        () => {},
      );
      // The page may still be sliding into place (the main area's padding eases when the sidebar goes);
      // keep the moth's path anchored to where the perch will end up.
      const startedFollowing = performance.now();
      const follow = () => {
        const running = transitionsAround(perch);
        if (!running.length || performance.now() - startedFollowing > 2000) {
          moth.style.translate = '';
          return;
        }
        const box = perch.getBoundingClientRect();
        const settled = rectAfterTransitions(perch, running);
        moth.style.translate = `${settled.left - box.left}px ${settled.top - box.top}px`;
        following = requestAnimationFrame(follow);
      };
      follow();
    } else {
      setStyle(spotStyle(spot));
    }

    // The perch's font can change with the web font loading or a breakpoint.
    const refresh = () => {
      spot = restingSpot(perch);
      here = locate();
      setHeight(spot.fontSize);
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
    let returning = 0;
    const takeOff = () => {
      clearTimeout(returning);
      if (!armed || landing.current) return;
      flown = true;
      flight?.cancel();
      setPhase('flown');
    };
    const takeOffOnPointer = (event: PointerEvent) => {
      if (event.pointerType !== 'touch') takeOff();
    };
    const takeOffOnFocus = () => {
      if (focusTakeOff && link?.matches(':focus-visible')) takeOff();
    };
    const arm = () => {
      armed = !still;
      if (!flown || returnAfter === undefined || still) return;
      clearTimeout(returning);
      returning = window.setTimeout(() => {
        flown = false;
        landing.current = true;
        setPhase('land');
      }, returnAfter);
    };
    link?.addEventListener('pointerenter', takeOffOnPointer);
    link?.addEventListener('focus', takeOffOnFocus);
    link?.addEventListener('pointerleave', arm);
    link?.addEventListener('blur', arm);
    return () => {
      mounted = false;
      clearTimeout(returning);
      flight?.cancel();
      cancelAnimationFrame(resizing);
      cancelAnimationFrame(following);
      moth.style.translate = '';
      link?.removeEventListener('pointerenter', takeOffOnPointer);
      link?.removeEventListener('focus', takeOffOnFocus);
      link?.removeEventListener('pointerleave', arm);
      link?.removeEventListener('blur', arm);
      window.removeEventListener('resize', onResize);
      const last = locate();
      const leaving = last.rendered ? last : here;
      lastSpot = leaving.rendered
        ? { x: leaving.x, y: leaving.y, height: spot.fontSize, leftAt: performance.now(), flown }
        : null;
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
        if (event.target !== event.currentTarget || phase === 'flown') return;
        landing.current = false;
        setPhase('perched');
      }}
    >
      <span className="tamiyo-nav-moth-wings">
        <LunaMoth size={height} />
      </span>
    </span>
  );
}
