const bellyTip = 0.53;

export function mothSize(fontSize: number) {
  return { width: (fontSize * 120) / 140, height: fontSize };
}

export function splitLastSymbol(text: string) {
  const letters = [...new Intl.Segmenter(undefined, { granularity: 'grapheme' }).segment(text)];
  const last = letters.at(-1)?.segment ?? '';
  return { head: text.slice(0, text.length - last.length), last };
}

export function isRendered(box: { width: number; height: number }) {
  return box.width > 0 && box.height > 0;
}

// dx, dy: old top-left minus new top-left. Scaling happens around the moth's belly, so the
// translation compensates for the top-left corner moving with it.
export interface Trip {
  dx: number;
  dy: number;
  fromHeight: number;
  toHeight: number;
}

export function flightPose(trip: Trip, progress: number) {
  const scale = trip.fromHeight / trip.toHeight + (1 - trip.fromHeight / trip.toHeight) * progress;
  const { width, height } = mothSize(trip.toHeight);
  return {
    x: trip.dx * (1 - progress) - (1 - scale) * width * 0.5,
    y: trip.dy * (1 - progress) - (1 - scale) * height * bellyTip,
    scale,
  };
}

export function restingOffset(fontSize: number, tip: { x: number; y: number } | null) {
  const { width, height } = mothSize(fontSize);
  if (!tip) return { left: -width / 2, top: -height * bellyTip };
  const nudge = fontSize / 16;
  return { left: tip.x - width / 2 + nudge, top: tip.y - height * bellyTip + nudge };
}
