export type ThemeSetting = 'system' | 'light' | 'dark';
/** Portrait number pad: 9 keys in a row, or a 3x3 grid with larger keys (accessibility). */
export type PadLayout = 'row' | 'grid';

export interface Settings {
  theme: ThemeSetting;
  highContrast: boolean;
  highlightPeers: boolean;
  highlightSameDigit: boolean;
  highlightConflicts: boolean;
  /** Mark entries that disagree with the solution. Off by default. */
  autoCheck: boolean;
  /** Count wrong placements. Off by default. */
  mistakeCounter: boolean;
  /** 0 = unlimited. Only used when mistakeCounter is on. */
  mistakeLimit: number;
  showTimer: boolean;
  autoRemoveNotes: boolean;
  reduceMotion: boolean;
  haptics: boolean;
  /** Soft sound effects. Off by default (calm, and respectful in public places). */
  sound: boolean;
  keepAwake: boolean;
  padLayout: PadLayout;
}

export const DEFAULT_SETTINGS: Settings = {
  theme: 'system',
  highContrast: false,
  highlightPeers: true,
  highlightSameDigit: true,
  highlightConflicts: true,
  autoCheck: false,
  mistakeCounter: false,
  mistakeLimit: 0,
  showTimer: true,
  autoRemoveNotes: true,
  reduceMotion: false,
  haptics: true,
  sound: false,
  keepAwake: true,
  padLayout: 'row',
};

/** 1 = error-free mode: the first mistake triggers the (gentle) out-of-lives offer. */
export const MISTAKE_LIMIT_OPTIONS = [0, 1, 3, 5] as const;
