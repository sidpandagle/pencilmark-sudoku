import { useCallback, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { cellName, type CellDigit } from '../../engine';
import { Board, overlayFromStep, type BoardOverlay } from '../../ui/board';
import { AppText, Button } from '../../ui/components/primitives';
import { useColors } from '../../ui/ThemeContext';
import { radius, space } from '../../ui/theme';
import { evaluateEliminations, evaluatePlacement, exerciseKind, HELP_LABELS, helpText, type Verdict } from '../exercise';
import { answerOverlay, mergeOverlays } from '../phases';
import type { LessonPosition } from '../positions';
import type { TechniqueContent } from '../types';
import { DigitChips } from './DigitChips';

export interface ExerciseResult {
  correct: boolean;
  /** Help level 3 (answer shown) was used, or the answer was revealed after a wrong submission. */
  revealed: boolean;
  helpUsed: number;
}

const hasBit = (m: number, d: number) => (m & (1 << (d - 1))) !== 0;
const digitsOf = (m: number) => [1, 2, 3, 4, 5, 6, 7, 8, 9].filter((d) => hasBit(m, d));

/**
 * Interactive position: the learner performs the deduction on the board.
 * - Placements: tap the cell, then choose the digit from large chips.
 * - Eliminations: tap candidates on the board to mark them, or tap a cell and toggle its candidates as chips.
 * `guided` mode offers progressive help and unlimited checks; `mastery` mode has no help and one submission.
 */
export function ExerciseView({
  position,
  content,
  mode,
  size,
  onDone,
}: {
  position: LessonPosition;
  content?: TechniqueContent;
  mode: 'guided' | 'mastery';
  size: number;
  onDone: (r: ExerciseResult) => void;
}) {
  const c = useColors();
  const { step } = position;
  const kind = exerciseKind(step);
  const givens = useMemo(() => position.puzzle.map((v) => v !== 0), [position]);
  const [selected, setSelected] = useState(-1);
  const [marks, setMarks] = useState<CellDigit[]>([]);
  const [placement, setPlacement] = useState<CellDigit | null>(null);
  const [help, setHelp] = useState(0);
  const [verdict, setVerdict] = useState<Verdict | null>(null);
  const [finished, setFinished] = useState<ExerciseResult | null>(null);

  const finish = useCallback(
    (r: ExerciseResult) => {
      setFinished(r);
      onDone(r);
    },
    [onDone],
  );

  const toggleMark = useCallback(
    (cell: number, digit: number) => {
      if (finished) return;
      setVerdict(null);
      setMarks((ms) => (ms.some((m) => m.cell === cell && m.digit === digit) ? ms.filter((m) => !(m.cell === cell && m.digit === digit)) : [...ms, { cell, digit }]));
    },
    [finished],
  );

  const onCellPress = useCallback(
    (cell: number) => {
      if (finished) return;
      setSelected((s) => (s === cell ? -1 : cell));
    },
    [finished],
  );

  const onCandidatePress = useCallback(
    (cell: number, digit: number) => {
      if (kind !== 'eliminate') {
        onCellPress(cell);
        return;
      }
      setSelected(cell);
      toggleMark(cell, digit);
    },
    [kind, onCellPress, toggleMark],
  );

  const check = () => {
    const v =
      kind === 'place'
        ? placement
          ? evaluatePlacement(position, placement.cell, placement.digit, content)
          : { correct: false, found: 0, total: 1, wrong: [], message: 'Tap a cell, then choose a digit.' }
        : evaluateEliminations(position, marks, content);
    const empty = kind === 'place' ? !placement : marks.length === 0;
    setVerdict(v);
    if (v.correct) finish({ correct: true, revealed: help >= 3, helpUsed: help });
    else if (mode === 'mastery' && !empty && !v.retry) finish({ correct: false, revealed: true, helpUsed: help });
  };

  const answerShown = !!finished && (finished.revealed || finished.correct);
  const overlay: BoardOverlay = useMemo(() => {
    const base =
      answerShown || (mode === 'guided' && help >= 3)
        ? overlayFromStep(step, 'full')
        : mode === 'guided' && help >= 2
          ? overlayFromStep(step, 'where')
          : null;
    const wrongCells = verdict && !verdict.correct && !verdict.retry ? verdict.wrong.map((w) => w.cell) : [];
    return mergeOverlays(base, answerShown ? null : { candidates: answerOverlay(marks, placement), flaggedCells: wrongCells });
  }, [answerShown, step, mode, help, marks, placement, verdict]);

  const selCands = selected >= 0 && !position.grid[selected] ? position.candidates[selected] : 0;
  const prompt =
    kind === 'place'
      ? 'Find the cell this technique fills. Tap it, then choose the digit.'
      : step.eliminations.length === 1
        ? 'Find the candidate this technique removes. Tap it on the board (or tap its cell and use the large buttons), then check.'
        : `Find the ${step.eliminations.length} candidates this technique removes. Tap them on the board (or tap a cell and use the large buttons), then check.`;

  return (
    <View style={styles.wrap} testID={`exercise-${mode}`}>
      <AppText>{prompt}</AppText>
      <View style={styles.center}>
        <Board
          values={position.grid}
          givens={givens}
          candidates={position.candidates}
          selected={selected}
          overlay={overlay}
          size={size}
          highlights={{ sameDigit: false }}
          onCellPress={finished ? undefined : onCellPress}
          onCandidatePress={finished || kind !== 'eliminate' ? undefined : onCandidatePress}
          readOnly={!!finished}
          testID="exercise-board"
        />
      </View>

      {!finished && selected >= 0 && selCands ? (
        <View style={styles.chips}>
          <AppText variant="label" muted>
            {kind === 'place' ? `Digit for ${cellName(selected)}:` : `Candidates of ${cellName(selected)} (tap to mark for removal):`}
          </AppText>
          <DigitChips
            digits={digitsOf(selCands)}
            testIDPrefix="exchip"
            state={(d) =>
              kind === 'place'
                ? placement && placement.cell === selected && placement.digit === d
                  ? 'on'
                  : 'off'
                : marks.some((m) => m.cell === selected && m.digit === d)
                  ? 'strike'
                  : 'off'
            }
            labelFor={(d, s) =>
              kind === 'place'
                ? `Place ${d} in ${cellName(selected)}${s === 'on' ? ', chosen' : ''}`
                : `Candidate ${d} in ${cellName(selected)}${s === 'strike' ? ', marked for removal' : ''}`
            }
            onPress={(d) => {
              if (kind === 'place') {
                setVerdict(null);
                setPlacement({ cell: selected, digit: d });
              } else toggleMark(selected, d);
            }}
          />
        </View>
      ) : null}

      {kind === 'eliminate' && marks.length && !finished ? (
        <AppText variant="caption" muted testID="marks-summary">
          Marked: {marks.map((m) => `${m.digit} in ${cellName(m.cell)}`).join(', ')}
        </AppText>
      ) : null}

      {mode === 'guided' && help > 0 && !finished ? (
        <View style={[styles.help, { backgroundColor: c.hintSoft }]} testID="help-text">
          <AppText>{helpText(position, help, content)}</AppText>
        </View>
      ) : null}

      {verdict ? (
        <View
          accessibilityLiveRegion="polite"
          style={[styles.verdict, { backgroundColor: verdict.correct ? c.surface : c.conflictSoft, borderColor: verdict.correct ? c.success : c.conflict }]}
          testID={verdict.correct ? 'verdict-correct' : 'verdict-wrong'}
        >
          <AppText variant="label" color={verdict.correct ? c.success : c.conflict}>
            {verdict.correct ? 'Correct' : finished ? 'Not this time' : 'Not yet'}
          </AppText>
          <AppText>{verdict.correct ? step.explanation : verdict.message.replace(/^Not quite\. /, '')}</AppText>
          {finished && !finished.correct ? (
            <AppText muted>
              The answer is shown on the board. {step.explanation}
            </AppText>
          ) : null}
        </View>
      ) : null}

      {mode === 'guided' && help >= 3 && !finished ? (
        <AppText muted>The answer is on the board. Mark it yourself and check to continue.</AppText>
      ) : null}

      {!finished ? (
        <View style={styles.controls}>
          {mode === 'guided' && help < 3 ? (
            <Button label={HELP_LABELS[help]} icon="bulb" compact onPress={() => setHelp((h) => Math.min(3, h + 1))} style={styles.flex} testID="exercise-help" />
          ) : null}
          {kind === 'eliminate' && marks.length ? (
            <Button label="Clear" compact onPress={() => { setMarks([]); setVerdict(null); }} style={styles.flex} testID="exercise-clear" />
          ) : null}
          <Button label={mode === 'mastery' ? 'Submit' : 'Check'} kind="primary" icon="check" compact onPress={check} style={styles.flex} testID="exercise-check" />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: space.md },
  center: { alignItems: 'center' },
  chips: { gap: space.sm },
  help: { borderRadius: radius.button, padding: space.md },
  verdict: { borderRadius: radius.button, padding: space.md, borderWidth: 1.5, gap: space.xs },
  controls: { flexDirection: 'row', gap: space.sm, flexWrap: 'wrap' },
  flex: { flexGrow: 1 },
});
