const wings = [
  'M57 42 C42 22 16 18 10 32 C6 44 28 56 56 55 Z',
  'M63 42 C78 22 104 18 110 32 C114 44 92 56 64 55 Z',
  'M57 58 C42 62 30 76 35 94 C39 108 43 122 46 136 C51 118 54 94 58 70 Z',
  'M63 58 C78 62 90 76 85 94 C81 108 77 122 74 136 C69 118 66 94 62 70 Z',
];

export function LunaMoth({ size = 32, title }: { size?: number; title?: string }) {
  return (
    <svg
      width={(size * 120) / 140}
      height={size}
      viewBox="0 0 120 140"
      role={title ? 'img' : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
      style={{ display: 'block', flexShrink: 0 }}
    >
      <path
        d="M58 36 C54 26 50 18 44 12 M62 36 C66 26 70 18 76 12"
        fill="none"
        stroke="#6E2F45"
        strokeWidth={3}
        strokeLinecap="round"
      />
      {wings.map((wing) => (
        <path key={wing} d={wing} fill="#CDE3A5" stroke="#4E6B24" strokeWidth={4} strokeLinejoin="round" />
      ))}
      <path
        d="M57 42 C42 22 16 18 10 32 M63 42 C78 22 104 18 110 32"
        fill="none"
        stroke="#6E2F45"
        strokeWidth={6}
        strokeLinecap="round"
      />
      <circle cx={31} cy={38} r={7} fill="#D9A441" stroke="#6E2F45" strokeWidth={3} />
      <circle cx={89} cy={38} r={7} fill="#D9A441" stroke="#6E2F45" strokeWidth={3} />
      <circle cx={44} cy={84} r={5} fill="#D9A441" />
      <circle cx={76} cy={84} r={5} fill="#D9A441" />
      <ellipse cx={60} cy={54} rx={6} ry={19} fill="#FBF8F1" stroke="#4E6B24" strokeWidth={3} />
    </svg>
  );
}
