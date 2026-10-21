const bellyTip = 0.53;

export function mothSize(fontSize: number) {
  return { width: (fontSize * 120) / 140, height: fontSize };
}

// tip: the letter's top-right inked point, in px from the perch's top-left corner.
export function restingOffset(fontSize: number, tip: { x: number; y: number } | null) {
  const { width, height } = mothSize(fontSize);
  if (!tip) return { left: -width / 2, top: -height * bellyTip };
  const nudge = fontSize / 16;
  return { left: tip.x - width / 2 + nudge, top: tip.y - height * bellyTip + nudge };
}
