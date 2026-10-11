import { useEffect, useRef } from 'react';
import { Platform } from 'react-native';

export interface KeyboardHandlers {
  digit: (d: number, asNote: boolean) => void;
  move: (dRow: number, dCol: number) => void;
  erase: () => void;
  undo: () => void;
  redo: () => void;
  toggleNotes: () => void;
  hint: () => void;
  /** P / Escape. Return true if handled (e.g. closed a panel). */
  pauseOrEscape: (key: 'p' | 'escape') => void;
}

const MOVES: Record<string, [number, number]> = {
  ArrowUp: [-1, 0],
  ArrowDown: [1, 0],
  ArrowLeft: [0, -1],
  ArrowRight: [0, 1],
  w: [-1, 0],
  s: [1, 0],
  a: [0, -1],
  d: [0, 1],
};

/** Map a KeyboardEvent to a game command. Exported for unit tests. */
export function handleKey(e: Pick<KeyboardEvent, 'key' | 'code' | 'shiftKey' | 'ctrlKey' | 'metaKey' | 'altKey'>, h: KeyboardHandlers): boolean {
  const mod = e.ctrlKey || e.metaKey;
  const key = e.key.length === 1 ? e.key.toLowerCase() : e.key;
  if (mod) {
    if (key === 'z') {
      if (e.shiftKey) h.redo();
      else h.undo();
      return true;
    }
    if (key === 'y') {
      h.redo();
      return true;
    }
    return false;
  }
  if (e.altKey) return false;
  const m = /^(?:Digit|Numpad)([0-9])$/.exec(e.code ?? '');
  const digit = m ? Number(m[1]) : /^[0-9]$/.test(e.key) ? Number(e.key) : -1;
  if (digit >= 1) {
    h.digit(digit, e.shiftKey);
    return true;
  }
  if (digit === 0 || key === 'Backspace' || key === 'Delete') {
    h.erase();
    return true;
  }
  if (MOVES[key]) {
    h.move(...MOVES[key]);
    return true;
  }
  if (key === 'n') {
    h.toggleNotes();
    return true;
  }
  if (key === 'h') {
    h.hint();
    return true;
  }
  if (key === 'p' || key === 'Escape') {
    h.pauseOrEscape(key === 'p' ? 'p' : 'escape');
    return true;
  }
  return false;
}

/** Web-only keyboard shortcuts for the play screen. */
export function useGameKeyboard(handlers: KeyboardHandlers, enabled: boolean) {
  const ref = useRef(handlers);
  ref.current = handlers;
  useEffect(() => {
    if (Platform.OS !== 'web' || !enabled || typeof window === 'undefined') return;
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return;
      if (handleKey(e, ref.current)) e.preventDefault();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [enabled]);
}
