/** Design tokens from docs/DESIGN.md. */
export interface Palette {
  bg: string;
  surface: string;
  surfaceAlt: string;
  ink: string;
  inkMuted: string;
  line: string;
  lineStrong: string;
  accent: string;
  /** Text/icon colour on top of `accent`. */
  onAccent: string;
  accentSoft: string;
  peer: string;
  sameDigit: string;
  conflict: string;
  conflictSoft: string;
  hint: string;
  hintSoft: string;
  eliminate: string;
  success: string;
  colorA: string;
  colorB: string;
  /** Translucent veil behind sheets/modals. */
  scrim: string;
}

export const lightPalette: Palette = {
  bg: '#F4F1EA',
  surface: '#FFFDF8',
  surfaceAlt: '#ECE7DC',
  ink: '#1E2733',
  inkMuted: '#5E6B7A',
  line: '#C9C2B4',
  lineStrong: '#2E3946',
  accent: '#2F5DA8',
  onAccent: '#FFFDF8',
  accentSoft: '#DCE6F6',
  peer: '#ECEEF1',
  sameDigit: '#C8D7F1',
  conflict: '#B4382A',
  conflictSoft: '#F8DED9',
  hint: '#B27A18',
  hintSoft: '#FBEBC8',
  eliminate: '#C0392B',
  success: '#2E7D55',
  colorA: '#2D79AD',
  colorB: '#B45A19',
  scrim: 'rgba(20, 26, 34, 0.42)',
};

export const darkPalette: Palette = {
  bg: '#11151B',
  surface: '#1A2029',
  surfaceAlt: '#232B36',
  ink: '#E8ECF1',
  inkMuted: '#9AA6B4',
  line: '#38424F',
  lineStrong: '#AEB9C6',
  accent: '#8DB2FF',
  onAccent: '#11151B',
  accentSoft: '#25385A',
  peer: '#1F2733',
  sameDigit: '#30466E',
  conflict: '#FF8A7A',
  conflictSoft: '#4A2622',
  hint: '#F2C062',
  hintSoft: '#4A3A17',
  eliminate: '#FF7F72',
  success: '#6FD39F',
  colorA: '#7CC4F5',
  colorB: '#F5A66B',
  scrim: 'rgba(0, 0, 0, 0.6)',
};

/** High contrast: stronger lines, darker (light) / brighter (dark) accents and text. */
export const lightHighContrast: Palette = {
  ...lightPalette,
  bg: '#F7F5EF',
  surface: '#FFFEFB',
  ink: '#0B1118',
  inkMuted: '#36414E',
  line: '#7D7566',
  lineStrong: '#0B1118',
  accent: '#1A3F7E',
  accentSoft: '#C3D4F0',
  peer: '#E1E4E9',
  sameDigit: '#A9C0E8',
  conflict: '#8E1F12',
  conflictSoft: '#F4CBC3',
  hint: '#8A5A00',
  eliminate: '#9A1B10',
  success: '#145A37',
};

export const darkHighContrast: Palette = {
  ...darkPalette,
  bg: '#07090D',
  surface: '#10151C',
  ink: '#FFFFFF',
  inkMuted: '#C8D1DB',
  line: '#66727F',
  lineStrong: '#F1F4F8',
  accent: '#B5CEFF',
  accentSoft: '#2F4E85',
  peer: '#212A37',
  sameDigit: '#3B5A8F',
  conflict: '#FFA597',
  hint: '#FFD27A',
  eliminate: '#FF9C91',
  success: '#8CF0BA',
};

export const space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32, xxxl: 48 } as const;
export const radius = { cell: 6, chip: 6, button: 12, card: 16, sheet: 20 } as const;
export const fontSize = { xs: 12, sm: 14, md: 16, lg: 20, xl: 24, xxl: 32, xxxl: 40 } as const;
export const MIN_TOUCH = 48;

export interface Theme {
  dark: boolean;
  highContrast: boolean;
  colors: Palette;
}

export function makeTheme(dark: boolean, highContrast: boolean): Theme {
  const colors = dark ? (highContrast ? darkHighContrast : darkPalette) : highContrast ? lightHighContrast : lightPalette;
  return { dark, highContrast, colors };
}
