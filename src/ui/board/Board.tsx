import { memo, useMemo, type ReactElement } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { G, Line, Polygon, Rect } from 'react-native-svg';
import { PEERS, findConflicts } from '../../engine';
import { useColors } from '../ThemeContext';
import { Cell, F_CONFLICT, F_FLAGGED, F_FOCUS, F_PATTERN, F_PEER, F_SAME, F_SELECTED, F_SUPPORT, F_WRONG } from './Cell';
import { ROLE_CODE, type BoardOverlay } from './overlay';

export interface BoardHighlightOptions {
  /** Shade the selected cell's row, column and box. Default true. */
  peers?: boolean;
  /** Shade cells holding the selected digit. Default true. */
  sameDigit?: boolean;
  /** Mark duplicate digits in a unit. Default true. */
  conflicts?: boolean;
  /** Mark entries that disagree with `solution`. Default false. */
  autoCheck?: boolean;
}

/**
 * The Sudoku board. Pure presentational: all state comes in through props.
 *
 * Reuse notes (learning mode):
 * - Pass `overlay` (see `overlayFromStep`) to draw a technique's pattern, candidate roles and chain links.
 * - Pass `candidates` to show engine candidate masks instead of the player's `notes`.
 * - Pass `readOnly` to disable interaction (cells stay accessible to screen readers).
 * - Size is explicit (`size` in dp); digits scale with the board, never with the OS font size.
 */
export interface BoardProps {
  values: readonly number[];
  /** givens[i] = true for puzzle clues. */
  givens: readonly boolean[];
  /** Player note masks (bit d-1 = digit d). Ignored when `candidates` is given. */
  notes?: readonly number[];
  /** Engine candidate masks to display instead of notes. */
  candidates?: readonly number[];
  selected?: number;
  /** Digit highlighted without a selection (digit-first input). */
  highlightDigit?: number;
  solution?: readonly number[];
  highlights?: BoardHighlightOptions;
  overlay?: BoardOverlay | null;
  readOnly?: boolean;
  size: number;
  onCellPress?: (cell: number) => void;
  /**
   * Candidate-tap mode: when set, every shown candidate of an empty cell is its own press target
   * (testID `cand-<cell>-<digit>`). Used by learning mode to mark candidates for removal. Pair it with an
   * accessible alternative (e.g. large chips after `onCellPress`), since candidate slots are small.
   */
  onCandidatePress?: (cell: number, digit: number) => void;
  testID?: string;
}

const NO_ROLES = '.........';
const EMPTY: readonly number[] = [];

function BoardImpl({
  values,
  givens,
  notes,
  candidates,
  selected = -1,
  highlightDigit = 0,
  solution,
  highlights,
  overlay,
  readOnly = false,
  size,
  onCellPress,
  onCandidatePress,
  testID = 'board',
}: BoardProps) {
  const c = useColors();
  const cs = size / 9;
  const peersOn = highlights?.peers ?? true;
  const sameOn = highlights?.sameDigit ?? true;
  const conflictsOn = highlights?.conflicts ?? true;
  const autoCheck = highlights?.autoCheck ?? false;
  const marks = candidates ?? notes ?? EMPTY;

  const conflicts = useMemo(() => (conflictsOn ? findConflicts(values as number[]) : new Set<number>()), [values, conflictsOn]);

  const overlaySets = useMemo(() => {
    const roles = new Map<number, string[]>();
    for (const h of overlay?.candidates ?? []) {
      if (h.cell < 0 || h.cell > 80 || h.digit < 1 || h.digit > 9) continue;
      const arr = roles.get(h.cell) ?? NO_ROLES.split('');
      arr[h.digit - 1] = ROLE_CODE[h.role] ?? '.';
      roles.set(h.cell, arr);
    }
    return {
      pattern: new Set(overlay?.patternCells ?? EMPTY),
      support: new Set(overlay?.supportCells ?? EMPTY),
      flagged: new Set(overlay?.flaggedCells ?? EMPTY),
      focus: new Set(overlay?.focusCells ?? EMPTY),
      roles: new Map([...roles].map(([k, v]) => [k, v.join('')])),
    };
  }, [overlay]);

  const focusDigit = selected >= 0 && values[selected] ? values[selected] : highlightDigit;
  const peerSet = useMemo(() => new Set(selected >= 0 ? PEERS[selected] : EMPTY), [selected]);

  const cells = [];
  for (let i = 0; i < 81; i++) {
    const v = values[i] ?? 0;
    let flags = 0;
    if (i === selected) flags |= F_SELECTED;
    else if (peersOn && peerSet.has(i)) flags |= F_PEER;
    if (sameOn && focusDigit && v === focusDigit && i !== selected) flags |= F_SAME;
    if (conflicts.has(i)) flags |= F_CONFLICT;
    if (autoCheck && solution && v && !givens[i] && v !== solution[i]) flags |= F_WRONG;
    if (overlaySets.pattern.has(i)) flags |= F_PATTERN;
    if (overlaySets.support.has(i)) flags |= F_SUPPORT;
    if (overlaySets.flagged.has(i)) flags |= F_FLAGGED;
    if (overlaySets.focus.has(i)) flags |= F_FOCUS;
    const m = v ? 0 : (marks[i] ?? 0);
    cells.push(
      <Cell
        key={i}
        index={i}
        value={v}
        given={!!givens[i]}
        marks={m}
        marksAreCandidates={!!candidates}
        flags={flags}
        roles={v ? NO_ROLES : (overlaySets.roles.get(i) ?? NO_ROLES)}
        focusDigit={sameOn && focusDigit && m & (1 << (focusDigit - 1)) ? focusDigit : 0}
        x={(i % 9) * cs}
        y={Math.floor(i / 9) * cs}
        size={cs}
        colors={c}
        readOnly={readOnly}
        onPress={onCellPress}
        onCandidatePress={onCandidatePress}
      />,
    );
  }

  return (
    <View
      testID={testID}
      accessibilityLabel="Sudoku board"
      style={[styles.board, { width: size, height: size, backgroundColor: c.surface }]}
    >
      {cells}
      <GridLines size={size} line={c.line} strong={c.lineStrong} />
      {overlay && ((overlay.units?.length ?? 0) > 0 || (overlay.links?.length ?? 0) > 0) ? (
        <OverlayLayer overlay={overlay} size={size} unitColor={c.hint} linkColor={c.ink} />
      ) : null}
    </View>
  );
}

export const Board = memo(BoardImpl);

const GridLines = memo(function GridLines({ size, line, strong }: { size: number; line: string; strong: string }) {
  const cs = size / 9;
  const thin: ReactElement[] = [];
  const thick: ReactElement[] = [];
  for (let k = 1; k < 9; k++) {
    const p = k * cs;
    const list = k % 3 === 0 ? thick : thin;
    list.push(<Line key={`v${k}`} x1={p} y1={0} x2={p} y2={size} />);
    list.push(<Line key={`h${k}`} x1={0} y1={p} x2={size} y2={p} />);
  }
  return (
    <View style={[StyleSheet.absoluteFill, styles.noPointer]}>
      <Svg width={size} height={size}>
        <G stroke={line} strokeWidth={1}>
          {thin}
        </G>
        <G stroke={strong} strokeWidth={2.5}>
          {thick}
        </G>
        <Rect x={1.25} y={1.25} width={size - 2.5} height={size - 2.5} rx={6} fill="none" stroke={strong} strokeWidth={2.5} />
      </Svg>
    </View>
  );
});

/** Candidate centre within the board, matching the 3x3 note layout used by Cell. */
export function candidatePoint(cell: number, digit: number, size: number) {
  const cs = size / 9;
  const pad = cs * 0.04;
  const slot = (cs - pad * 2) / 3;
  const x = (cell % 9) * cs + pad + ((digit - 1) % 3) * slot + slot / 2;
  const y = Math.floor(cell / 9) * cs + pad + Math.floor((digit - 1) / 3) * slot + slot / 2;
  return { x, y, r: slot / 2 };
}

function unitRect(u: number, cs: number) {
  if (u < 9) return { x: 0, y: u * cs, w: 9 * cs, h: cs };
  if (u < 18) return { x: (u - 9) * cs, y: 0, w: cs, h: 9 * cs };
  const b = u - 18;
  return { x: (b % 3) * 3 * cs, y: Math.floor(b / 3) * 3 * cs, w: 3 * cs, h: 3 * cs };
}

const OverlayLayer = memo(function OverlayLayer({
  overlay,
  size,
  unitColor,
  linkColor,
}: {
  overlay: BoardOverlay;
  size: number;
  unitColor: string;
  linkColor: string;
}) {
  const cs = size / 9;
  const inset = 3;
  return (
    <View style={[StyleSheet.absoluteFill, styles.noPointer]} testID="board-overlay">
      <Svg width={size} height={size}>
        {(overlay.units ?? []).map((u) => {
          if (u < 0 || u > 26) return null;
          const r = unitRect(u, cs);
          return (
            <Rect
              key={`u${u}`}
              x={r.x + inset}
              y={r.y + inset}
              width={r.w - inset * 2}
              height={r.h - inset * 2}
              rx={6}
              fill="none"
              stroke={unitColor}
              strokeWidth={2.5}
              strokeDasharray="6 4"
            />
          );
        })}
        {(overlay.links ?? []).map((l, i) => {
          const a = candidatePoint(l.from.cell, l.from.digit, size);
          const b = candidatePoint(l.to.cell, l.to.digit, size);
          const dx = b.x - a.x;
          const dy = b.y - a.y;
          const len = Math.hypot(dx, dy) || 1;
          const ux = dx / len;
          const uy = dy / len;
          const x1 = a.x + ux * a.r;
          const y1 = a.y + uy * a.r;
          const x2 = b.x - ux * b.r;
          const y2 = b.y - uy * b.r;
          const ah = Math.max(5, cs * 0.12);
          const p1 = `${x2},${y2}`;
          const p2 = `${x2 - ux * ah - uy * ah * 0.6},${y2 - uy * ah + ux * ah * 0.6}`;
          const p3 = `${x2 - ux * ah + uy * ah * 0.6},${y2 - uy * ah - ux * ah * 0.6}`;
          return (
            <G key={`l${i}`}>
              <Line
                x1={x1}
                y1={y1}
                x2={x2 - ux * ah * 0.6}
                y2={y2 - uy * ah * 0.6}
                stroke={linkColor}
                strokeOpacity={0.8}
                strokeWidth={2}
                strokeLinecap="round"
                strokeDasharray={l.type === 'weak' ? '4 4' : undefined}
              />
              <Polygon points={`${p1} ${p2} ${p3}`} fill={linkColor} fillOpacity={0.8} />
            </G>
          );
        })}
      </Svg>
    </View>
  );
});

const styles = StyleSheet.create({
  board: { position: 'relative', borderRadius: 8, overflow: 'hidden' },
  noPointer: { pointerEvents: 'none' },
});
