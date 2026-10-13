const PAPER = '#FBF8F1';

const tones: Record<string, { fill: string; stroke: string }> = {
  binder: { fill: '#DCEBC0', stroke: '#3E5A18' },
  box: { fill: '#F0D79A', stroke: '#634513' },
  deckbox: { fill: '#E7BFCD', stroke: '#57233A' },
};

const notebook = { fill: '#EAE2D1', stroke: '#4A3F37' };

function Binder({ fill, stroke }: { fill: string; stroke: string }) {
  return (
    <>
      <rect x={14} y={8} width={38} height={48} rx={4} fill={fill} stroke={stroke} strokeWidth={2} />
      <path d="M22 8 V56" stroke={stroke} strokeWidth={2} />
      <circle cx={18} cy={18} r={2.5} fill="none" stroke={stroke} strokeWidth={1.6} />
      <circle cx={18} cy={32} r={2.5} fill="none" stroke={stroke} strokeWidth={1.6} />
      <circle cx={18} cy={46} r={2.5} fill="none" stroke={stroke} strokeWidth={1.6} />
      <rect x={28} y={16} width={10} height={14} rx={1.5} fill={PAPER} stroke={stroke} strokeWidth={1.4} />
      <rect x={40} y={16} width={8} height={14} rx={1.5} fill={PAPER} stroke={stroke} strokeWidth={1.4} />
      <rect x={28} y={34} width={10} height={14} rx={1.5} fill={PAPER} stroke={stroke} strokeWidth={1.4} />
    </>
  );
}

function Box({ fill, stroke }: { fill: string; stroke: string }) {
  return (
    <>
      <path d="M10 24 L32 14 L54 24 L32 34 Z" fill={PAPER} stroke={stroke} strokeWidth={2} strokeLinejoin="round" />
      <path d="M10 24 V46 L32 56 V34 Z" fill={fill} stroke={stroke} strokeWidth={2} strokeLinejoin="round" />
      <path d="M54 24 V46 L32 56 V34 Z" fill={fill} stroke={stroke} strokeWidth={2} strokeLinejoin="round" />
      <path d="M21 19 L43 29" stroke={stroke} strokeWidth={1.4} strokeDasharray="2 3" strokeLinecap="round" />
    </>
  );
}

function Deckbox({ fill, stroke }: { fill: string; stroke: string }) {
  return (
    <>
      <path d="M26 18 L30 4 H54 L50 18 Z" fill={fill} stroke={stroke} strokeWidth={2} strokeLinejoin="round" />
      <path
        d="M14 22 L22 18 H50 L42 22 Z"
        fill={stroke}
        fillOpacity={0.35}
        stroke={stroke}
        strokeWidth={2}
        strokeLinejoin="round"
      />
      <rect
        x={22}
        y={5}
        width={16}
        height={23}
        rx={2}
        fill={PAPER}
        stroke={stroke}
        strokeWidth={1.6}
        transform="rotate(-10 30 16)"
      />
      <path d="M42 22 L50 18 V52 L42 58 Z" fill={fill} stroke={stroke} strokeWidth={2} strokeLinejoin="round" />
      <rect x={14} y={22} width={28} height={36} rx={3} fill={fill} stroke={stroke} strokeWidth={2} />
      <path d="M14 46 H42" stroke={stroke} strokeWidth={1.6} />
    </>
  );
}

function Other({ fill, stroke }: { fill: string; stroke: string }) {
  return (
    <>
      <path
        d="M48 10 V54 H20 a5 5 0 0 1 -5 -5 V15 a5 5 0 0 1 5 -5 Z"
        fill={fill}
        stroke={stroke}
        strokeWidth={2}
        strokeLinejoin="round"
      />
      <path d="M48 44 H20 a5 5 0 0 0 -5 5" fill="none" stroke={stroke} strokeWidth={2} />
      <path d="M25 22 H39" stroke={stroke} strokeWidth={2} strokeLinecap="round" />
    </>
  );
}

export function StorageArt({ type, size = 64 }: { type: string; size?: number }) {
  const kind = type.toLowerCase();
  const colors = tones[kind] ?? notebook;
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden="true" style={{ display: 'block', flexShrink: 0 }}>
      {kind === 'binder' ? (
        <Binder {...colors} />
      ) : kind === 'box' ? (
        <Box {...colors} />
      ) : kind === 'deckbox' ? (
        <Deckbox {...colors} />
      ) : (
        <Other {...colors} />
      )}
    </svg>
  );
}
