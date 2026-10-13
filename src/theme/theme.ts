import { createTheme, defaultVariantColorsResolver } from '@mantine/core';

export const palette = {
  paper: '#F4EFE3',
  sheet: '#FBF8F1',
  rule: '#E2D8C3',
  ink: '#2B2420',
  inkSoft: '#6B5E52',
  lunaWing: '#CDE3A5',
  moss: '#4E6B24',
  wingEdge: '#6E2F45',
  eyespot: '#D9A441',
  night: '#1C1A22',
  velvet: '#26232D',
  nightRule: '#3A3542',
  glow: '#EDE6D6',
  ash: '#A79F92',
  plumLight: '#D9A0B4',
};

const lune = [
  '#F5F9EC',
  '#EAF3D8',
  '#DCEBC0',
  '#CDE3A5',
  '#B3D184',
  '#96B962',
  '#739447',
  '#4E6B24',
  '#3E5A18',
  '#2D420F',
] as const;

const prune = [
  '#FBF1F4',
  '#F3DDE5',
  '#E7BFCD',
  '#D9A0B4',
  '#C47B95',
  '#A85A76',
  '#8A425D',
  '#6E2F45',
  '#57233A',
  '#3F182A',
] as const;

const ocelle = [
  '#FCF5E6',
  '#F7E8C4',
  '#F0D79A',
  '#E7C26E',
  '#D9A441',
  '#C48F2E',
  '#A47523',
  '#835C1A',
  '#634513',
  '#45300C',
] as const;

const papier = [
  '#FBF8F1',
  '#F4EFE3',
  '#EAE2D1',
  '#E2D8C3',
  '#CFC3AA',
  '#B5A994',
  '#8A7E70',
  '#6B5E52',
  '#4A3F37',
  '#2B2420',
] as const;

const nuit = [
  '#EDE6D6',
  '#D8CFC0',
  '#A79F92',
  '#857D8C',
  '#4A4453',
  '#3A3542',
  '#2E2A36',
  '#26232D',
  '#1C1A22',
  '#141218',
] as const;

function variantColorResolver(input: Parameters<typeof defaultVariantColorsResolver>[0]) {
  const colors = defaultVariantColorsResolver(input);
  if (input.variant === 'filled') {
    return { ...colors, color: 'var(--tamiyo-on-filled)', hoverColor: 'var(--tamiyo-on-filled)' };
  }
  if (input.variant === 'white') {
    return { ...colors, background: 'var(--tamiyo-white-variant)', hover: 'var(--tamiyo-white-variant)' };
  }
  return colors;
}

export const theme = createTheme({
  colors: { lune, prune, ocelle, gray: papier, dark: nuit, green: lune, orange: ocelle, yellow: ocelle },
  primaryColor: 'lune',
  primaryShade: { light: 7, dark: 3 },
  variantColorResolver,
  black: palette.ink,
  white: palette.sheet,
  fontFamily: 'Karla, "Trebuchet MS", "Segoe UI", sans-serif',
  headings: {
    fontFamily: 'Fraunces, Georgia, "Times New Roman", serif',
    fontWeight: '600',
  },
  defaultRadius: 'md',
  radius: { xs: '4px', sm: '6px', md: '10px', lg: '14px', xl: '20px' },
  shadows: {
    xs: '0 1px 3px rgba(43, 36, 32, 0.08)',
    sm: '0 3px 8px rgba(43, 36, 32, 0.1)',
    md: '0 6px 16px rgba(43, 36, 32, 0.12)',
    lg: '0 10px 24px rgba(43, 36, 32, 0.16)',
    xl: '0 16px 36px rgba(43, 36, 32, 0.2)',
  },
});

export const cssVariablesResolver = () => ({
  variables: {
    '--tamiyo-hand': '"Patrick Hand", "Segoe Print", "Comic Sans MS", cursive',
    '--tamiyo-eyespot': palette.eyespot,
  },
  light: {
    '--mantine-color-body': palette.sheet,
    '--mantine-color-text': palette.ink,
    '--mantine-color-dimmed': palette.inkSoft,
    '--mantine-color-default': palette.sheet,
    '--mantine-color-default-hover': palette.paper,
    '--mantine-color-default-border': palette.rule,
    '--mantine-color-placeholder': '#8A7E70',
    '--tamiyo-page': palette.paper,
    '--tamiyo-dots': '#DCD1BA',
    '--tamiyo-ink': palette.ink,
    '--tamiyo-on-filled': palette.sheet,
    '--tamiyo-white-variant': palette.sheet,
  },
  dark: {
    '--mantine-color-body': palette.velvet,
    '--mantine-color-text': palette.glow,
    '--mantine-color-dimmed': palette.ash,
    '--mantine-color-default': palette.velvet,
    '--mantine-color-default-hover': '#2E2A36',
    '--mantine-color-default-border': palette.nightRule,
    '--mantine-color-placeholder': '#857D8C',
    '--tamiyo-page': palette.night,
    '--tamiyo-dots': 'rgba(237, 230, 214, 0.18)',
    '--tamiyo-ink': palette.glow,
    '--tamiyo-on-filled': palette.night,
    '--tamiyo-white-variant': 'rgba(28, 26, 34, 0.88)',
  },
});
