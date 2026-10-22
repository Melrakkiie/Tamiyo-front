// Hand-drawn variants of the foil sticker's sparkle: four-pointed stars with uneven arms and curved sides.
const stars = [
  'M21 7 Q22.6 19.2 35 21.4 Q23.2 24 19.4 36.6 Q17.8 25.4 6.6 23.2 Q19 20.6 21 7 Z',
  'M38.6 3 Q39.2 7.8 44.6 8.8 Q39.6 9.8 37.8 14.6 Q37 9.8 32 8 Q37.6 7.2 38.6 3 Z',
  'M38.2 32.4 Q38.8 37.2 43.4 38.4 Q38.6 39 37.6 43.4 Q37.2 39 32.8 37.6 Q37.4 37.2 38.2 32.4 Z',
];

/**
 * Decorative sparkles marking a foil copy. Place it inside a positioned box the size of the card image:
 * it sizes itself to about a sixth of that box's width and sits astride its right edge.
 */
export function FoilSparkles() {
  return (
    <svg className="tamiyo-foil-sparkles" viewBox="0 0 48 48" aria-hidden="true" focusable="false">
      {stars.map((star) => (
        <g key={star} className="tamiyo-foil-star">
          <path d={star} className="tamiyo-foil-outline" />
          <path d={star} className="tamiyo-foil-ink" />
        </g>
      ))}
    </svg>
  );
}
