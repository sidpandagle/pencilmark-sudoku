import { PEERS, bit, computeCandidates, type Step } from '../engine';
import { decodeNotes, decodeValues, encodeNotes, encodeValues } from './encode';
import { HISTORY_LIMIT, type GameState, type ReducerConfig, type Snapshot } from './types';

export type GameAction =
  | { type: 'select'; cell: number }
  | { type: 'move'; dRow: number; dCol: number }
  /** Digit-first: highlight every cell with this digit (0 clears). */
  | { type: 'highlightDigit'; digit: number }
  /** Enter a digit into the selected cell. Respects notes mode; `asNote` forces a note toggle. */
  | { type: 'input'; digit: number; asNote?: boolean }
  | { type: 'toggleNote'; digit: number; cell?: number }
  | { type: 'erase' }
  | { type: 'undo' }
  | { type: 'redo' }
  | { type: 'toggleNotesMode' }
  | { type: 'autoFillNotes' }
  | { type: 'clearNotes' }
  /** Apply an engine step (placements + eliminations) as one undo entry. */
  | { type: 'applyHintStep'; step: Pick<Step, 'placements' | 'eliminations'> }
  /** Count a hint as used (called once per hint request that produced guidance). */
  | { type: 'useHint' }
  /** Clear entries that disagree with the solution (one undo entry). */
  | { type: 'fixEntries'; cells: number[] }
  /** Add the correct digit back into notes that excluded it (one undo entry). */
  | { type: 'fixNotes'; cells: number[] }
  /** Reveal one cell from the solution (one undo entry). */
  | { type: 'revealCell'; cell: number }
  | { type: 'tick'; deltaMs: number }
  | { type: 'pause' }
  | { type: 'resume' }
  /** Restart the same puzzle. Passing `id` turns it into a fresh attempt (used by "Replay"). */
  | { type: 'restart'; id?: string }
  | { type: 'complete' }
  | { type: 'dismissLivesOffer' }
  | { type: 'markRecorded'; completion: GameState['completion'] };

export const DEFAULT_CONFIG: ReducerConfig = { autoRemoveNotes: true, countMistakes: false, now: 0 };

const MAX_TICK_MS = 5000;

export function snapshotOf(s: Pick<GameState, 'values' | 'notes' | 'selected'>): Snapshot {
  return { v: encodeValues(s.values), n: encodeNotes(s.notes), s: s.selected };
}

function pushCapped(list: Snapshot[], snap: Snapshot): Snapshot[] {
  const next = list.length >= HISTORY_LIMIT ? list.slice(list.length - HISTORY_LIMIT + 1) : list.slice();
  next.push(snap);
  return next;
}

export function isSolved(values: readonly number[], solution: readonly number[]): boolean {
  for (let i = 0; i < 81; i++) if (values[i] !== solution[i]) return false;
  return true;
}

/**
 * Record one undoable mutation: the previous position goes onto `past`, redo is cleared,
 * and completion is detected.
 */
function commit(
  prev: GameState,
  values: number[],
  notes: number[],
  cfg: ReducerConfig,
  extra: Partial<GameState> = {},
): GameState {
  const next: GameState = {
    ...prev,
    ...extra,
    values,
    notes,
    past: pushCapped(prev.past, snapshotOf(prev)),
    future: [],
  };
  return checkCompletion(next, cfg);
}

function checkCompletion(s: GameState, cfg: ReducerConfig): GameState {
  if (s.status === 'completed' || !isSolved(s.values, s.solution)) return s;
  return { ...s, status: 'completed', completedAt: cfg.now, notesMode: false, future: [] };
}

function removeFromPeerNotes(notes: number[], cell: number, digit: number) {
  const mask = ~bit(digit);
  for (const p of PEERS[cell]) notes[p] &= mask;
}

function canEdit(s: GameState, cell: number) {
  return s.status === 'playing' && cell >= 0 && cell < 81 && !s.givens[cell];
}

function place(s: GameState, cell: number, digit: number, cfg: ReducerConfig): GameState {
  if (!canEdit(s, cell) || s.values[cell] === digit) return s;
  const values = s.values.slice();
  const notes = s.notes.slice();
  values[cell] = digit;
  notes[cell] = 0;
  if (cfg.autoRemoveNotes) removeFromPeerNotes(notes, cell, digit);
  const wrong = digit !== s.solution[cell];
  return commit(s, values, notes, cfg, {
    errors: s.errors + (wrong ? 1 : 0),
    mistakes: s.mistakes + (wrong && cfg.countMistakes ? 1 : 0),
  });
}

function toggleNote(s: GameState, cell: number, digit: number, cfg: ReducerConfig): GameState {
  if (!canEdit(s, cell) || s.values[cell] !== 0) return s;
  const notes = s.notes.slice();
  notes[cell] ^= bit(digit);
  return commit(s, s.values, notes, cfg);
}

function restoreSnapshot(s: GameState, snap: Snapshot): GameState {
  return { ...s, values: decodeValues(snap.v), notes: decodeNotes(snap.n), selected: snap.s };
}

const isDigit = (d: number) => Number.isInteger(d) && d >= 1 && d <= 9;

export function gameReducer(s: GameState, action: GameAction, cfg: ReducerConfig = DEFAULT_CONFIG): GameState {
  switch (action.type) {
    case 'select': {
      const cell = action.cell >= 0 && action.cell < 81 ? action.cell : -1;
      if (cell === s.selected && s.highlightDigit === 0) return s;
      return { ...s, selected: cell, highlightDigit: 0 };
    }
    case 'move': {
      const from = s.selected < 0 ? 40 : s.selected;
      if (s.selected < 0) return { ...s, selected: from, highlightDigit: 0 };
      const r = (Math.floor(from / 9) + action.dRow + 9) % 9;
      const c = ((from % 9) + action.dCol + 9) % 9;
      return { ...s, selected: r * 9 + c, highlightDigit: 0 };
    }
    case 'highlightDigit': {
      const d = isDigit(action.digit) ? action.digit : 0;
      return { ...s, highlightDigit: d === s.highlightDigit ? 0 : d, selected: -1 };
    }
    case 'input': {
      if (!isDigit(action.digit) || s.status !== 'playing') return s;
      if (s.selected < 0) return gameReducer(s, { type: 'highlightDigit', digit: action.digit }, cfg);
      if (action.asNote || s.notesMode) return toggleNote(s, s.selected, action.digit, cfg);
      return place(s, s.selected, action.digit, cfg);
    }
    case 'toggleNote': {
      if (!isDigit(action.digit)) return s;
      return toggleNote(s, action.cell ?? s.selected, action.digit, cfg);
    }
    case 'erase': {
      const cell = s.selected;
      if (!canEdit(s, cell)) return s;
      if (s.values[cell]) {
        const values = s.values.slice();
        values[cell] = 0;
        return commit(s, values, s.notes, cfg);
      }
      if (s.notes[cell]) {
        const notes = s.notes.slice();
        notes[cell] = 0;
        return commit(s, s.values, notes, cfg);
      }
      return s;
    }
    case 'undo': {
      if (s.status !== 'playing' || s.past.length === 0) return s;
      const past = s.past.slice();
      const snap = past.pop() as Snapshot;
      return { ...restoreSnapshot(s, snap), past, future: pushCapped(s.future, snapshotOf(s)) };
    }
    case 'redo': {
      if (s.status !== 'playing' || s.future.length === 0) return s;
      const future = s.future.slice();
      const snap = future.pop() as Snapshot;
      const next = { ...restoreSnapshot(s, snap), future, past: pushCapped(s.past, snapshotOf(s)) };
      return checkCompletion(next, cfg);
    }
    case 'toggleNotesMode':
      return s.status === 'completed' ? s : { ...s, notesMode: !s.notesMode };
    case 'autoFillNotes': {
      if (s.status !== 'playing') return s;
      const cands = computeCandidates(s.values);
      const notes = s.values.map((v, i) => (v ? 0 : cands[i]));
      if (notes.every((m, i) => m === s.notes[i])) return s;
      return commit(s, s.values, notes, cfg);
    }
    case 'clearNotes': {
      if (s.status !== 'playing' || s.notes.every((m) => m === 0)) return s;
      return commit(s, s.values, new Array(81).fill(0), cfg);
    }
    case 'applyHintStep': {
      if (s.status !== 'playing') return s;
      const values = s.values.slice();
      const notes = s.notes.slice();
      const { placements = [], eliminations = [] } = action.step;
      let changed = false;
      if (eliminations.length) {
        // Cells without notes are treated by the engine as "all valid candidates";
        // materialise those so the elimination is visible to the player.
        const cands = computeCandidates(values);
        for (const { cell, digit } of eliminations) {
          if (cell < 0 || cell > 80 || !isDigit(digit) || values[cell]) continue;
          if (notes[cell] === 0) notes[cell] = cands[cell];
          const before = notes[cell];
          notes[cell] &= ~bit(digit);
          if (notes[cell] !== before) changed = true;
        }
      }
      let errors = s.errors;
      for (const { cell, digit } of placements) {
        if (cell < 0 || cell > 80 || !isDigit(digit) || s.givens[cell] || values[cell] === digit) continue;
        values[cell] = digit;
        notes[cell] = 0;
        if (cfg.autoRemoveNotes) removeFromPeerNotes(notes, cell, digit);
        if (digit !== s.solution[cell]) errors++;
        changed = true;
      }
      if (!changed) return s;
      return commit(s, values, notes, cfg, { errors });
    }
    case 'useHint':
      return { ...s, hintsUsed: s.hintsUsed + 1 };
    case 'fixEntries': {
      if (s.status !== 'playing') return s;
      const values = s.values.slice();
      let changed = false;
      for (const c of action.cells) {
        if (c >= 0 && c < 81 && !s.givens[c] && values[c] && values[c] !== s.solution[c]) {
          values[c] = 0;
          changed = true;
        }
      }
      return changed ? commit(s, values, s.notes, cfg) : s;
    }
    case 'fixNotes': {
      if (s.status !== 'playing') return s;
      const notes = s.notes.slice();
      let changed = false;
      for (const c of action.cells) {
        if (c >= 0 && c < 81 && !s.values[c] && notes[c] && !(notes[c] & bit(s.solution[c]))) {
          notes[c] |= bit(s.solution[c]);
          changed = true;
        }
      }
      return changed ? commit(s, s.values, notes, cfg) : s;
    }
    case 'revealCell': {
      const c = action.cell;
      if (!canEdit(s, c) || s.values[c] === s.solution[c]) return s;
      const values = s.values.slice();
      const notes = s.notes.slice();
      values[c] = s.solution[c];
      notes[c] = 0;
      if (cfg.autoRemoveNotes) removeFromPeerNotes(notes, c, values[c]);
      return commit(s, values, notes, cfg, { selected: c });
    }
    case 'tick': {
      if (s.status !== 'playing') return s;
      const d = Math.max(0, Math.min(MAX_TICK_MS, Math.round(action.deltaMs) || 0));
      return d ? { ...s, elapsedMs: s.elapsedMs + d } : s;
    }
    case 'pause':
      return s.status === 'playing' ? { ...s, status: 'paused' } : s;
    case 'resume':
      return s.status === 'paused' ? { ...s, status: 'playing' } : s;
    case 'restart': {
      const fresh = action.id !== undefined && action.id !== s.id;
      return {
        ...s,
        id: action.id ?? s.id,
        values: s.puzzle.slice(),
        notes: new Array(81).fill(0),
        selected: -1,
        highlightDigit: 0,
        notesMode: false,
        elapsedMs: 0,
        mistakes: 0,
        errors: 0,
        hintsUsed: 0,
        status: 'playing',
        startedAt: cfg.now,
        completedAt: null,
        past: [],
        future: [],
        livesOfferDismissed: false,
        recorded: fresh ? false : s.recorded,
        completion: fresh ? undefined : s.completion,
      };
    }
    case 'complete':
      return isSolved(s.values, s.solution) ? checkCompletion(s, cfg) : s;
    case 'dismissLivesOffer':
      return { ...s, livesOfferDismissed: true };
    case 'markRecorded':
      return { ...s, recorded: true, completion: action.completion };
    default:
      return s;
  }
}

/** Duplicate-free count of each digit currently on the board (index 1..9). */
export function digitCounts(values: readonly number[]): number[] {
  const counts = new Array(10).fill(0);
  for (const v of values) if (v) counts[v]++;
  return counts;
}

/** Fraction (0..1) of originally-empty cells that are correctly filled. */
export function progressOf(s: Pick<GameState, 'values' | 'solution' | 'givens'>): number {
  let open = 0;
  let done = 0;
  for (let i = 0; i < 81; i++) {
    if (s.givens[i]) continue;
    open++;
    if (s.values[i] === s.solution[i]) done++;
  }
  return open ? done / open : 1;
}
