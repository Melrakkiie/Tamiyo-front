const bellyTip = 0.53;

export function mothSize(fontSize: number) {
  return { width: (fontSize * 120) / 140, height: fontSize };
}

// \s covers non-breaking spaces.
export function splitLastSymbol(text: string) {
  const tail = /\s*$/.exec(text)![0];
  const trimmed = text.slice(0, text.length - tail.length);
  const symbols = [...new Intl.Segmenter(undefined, { granularity: 'grapheme' }).segment(trimmed)];
  const last = symbols.at(-1)?.segment ?? '';
  return { head: trimmed.slice(0, trimmed.length - last.length), last, tail };
}

export function pickPerch(
  perches: { id: string; visible: boolean; title: boolean }[],
  left: string | null,
  random: () => number,
) {
  const candidates = perches.filter((perch) => perch.visible && perch.id !== left);
  if (!candidates.length) return perches.find((perch) => perch.title)?.id;
  return candidates[Math.floor(random() * candidates.length)].id;
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
