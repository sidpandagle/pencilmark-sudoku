import { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { bit, BOXES, cellName, COLS, computeCandidates, ROWS, type CellDigit } from '../../engine';
import { Board } from '../../ui/board';
import { AppText, Button } from '../../ui/components/primitives';
import { useColors } from '../../ui/ThemeContext';
import { radius, space } from '../../ui/theme';
import { answerOverlay } from '../phases';
import { handPosition } from '../positions';
import type { FoundationCard } from '../types';
import { DigitChips } from './DigitChips';

const digitsOf = (m: number) => [1, 2, 3, 4, 5, 6, 7, 8, 9].filter((d) => m & bit(d));

/** Candidates shown for a remove-candidates card: notes as they were before the focus digit was placed. */
export function staleCandidates(grid: number[], focusCell: number | undefined): number[] {
  if (focusCell === undefined) return computeCandidates(grid);
  const before = grid.slice();
  before[focusCell] = 0;
  const cands = computeCandidates(before);
  cands[focusCell] = 0;
  return cands;
}

/** Why digit d is not a candidate of `cell` in `grid` ("already in its row"), or '' if it is one. */
function whyNot(grid: number[], cell: number, d: number): string {
  const r = Math.floor(cell / 9);
  const col = cell % 9;
  const b = Math.floor(r / 3) * 3 + Math.floor(col / 3);
  const where: string[] = [];
  if (ROWS[r].some((x) => grid[x] === d)) where.push('row');
  if (COLS[col].some((x) => grid[x] === d)) where.push('column');
  if (BOXES[b].some((x) => grid[x] === d)) where.push('box');
  return where.length ? `${d} is already in its ${where.join(' and ')}.` : '';
}

function Feedback({ ok, text }: { ok: boolean; text: string }) {
  const c = useColors();
  return (
    <View
      accessibilityLiveRegion="polite"
      testID={ok ? 'foundation-correct' : 'foundation-wrong'}
      style={[styles.feedback, { backgroundColor: ok ? c.surface : c.conflictSoft, borderColor: ok ? c.success : c.conflict }]}
    >
      <AppText variant="label" color={ok ? c.success : c.conflict}>
        {ok ? 'Correct' : 'Not yet'}
      </AppText>
      <AppText>{text}</AppText>
    </View>
  );
}

/** Interactive foundation card (everything except plain concept cards). Calls onSolved once when correct. */
export function FoundationCardView({ card, size, onSolved }: { card: FoundationCard; size: number; onSolved: () => void }) {
  const c = useColors();
  const pos = useMemo(() => ('position' in card && card.position ? handPosition(card.position) : null), [card]);
  const [selected, setSelected] = useState(-1);
  const [chosen, setChosen] = useState(0);
  const [mask, setMask] = useState(0);
  const [marks, setMarks] = useState<CellDigit[]>([]);
  const [fb, setFb] = useState<{ ok: boolean; text: string } | null>(null);
  const [solved, setSolved] = useState(false);

  const succeed = (text: string) => {
    setFb({ ok: true, text });
    if (!solved) {
      setSolved(true);
      onSolved();
    }
  };

  if (card.kind === 'concept') return null;

  if (card.kind === 'choice') {
    return (
      <View style={styles.wrap}>
        <AppText>{card.prompt}</AppText>
        {card.options.map((o, i) => (
          <Button
            key={o.label}
            label={o.label}
            kind="secondary"
            disabled={solved}
            onPress={() => (o.correct ? succeed(o.feedback) : setFb({ ok: false, text: o.feedback }))}
            testID={`choice-${i}`}
            style={styles.option}
          />
        ))}
        {fb ? <Feedback {...fb} /> : null}
      </View>
    );
  }

  if (!pos) return null;
  const { grid, givens } = pos;

  if (card.kind === 'tap-cell') {
    return (
      <View style={styles.wrap}>
        <AppText>{card.prompt}</AppText>
        <View style={styles.center}>
          <Board
            values={grid}
            givens={givens}
            size={size}
            selected={selected}
            highlights={{ conflicts: solved, peers: false, sameDigit: false }}
            overlay={solved ? { focusCells: card.answers.includes(selected) ? [selected] : [] } : null}
            onCellPress={
              solved
                ? undefined
                : (cell) => {
                    setSelected(cell);
                    if (card.answers.includes(cell)) succeed(card.success);
                    else setFb({ ok: false, text: card.retry });
                  }
            }
            testID="foundation-board"
          />
        </View>
        {fb ? <Feedback {...fb} /> : null}
      </View>
    );
  }

  if (card.kind === 'place-digit') {
    const sel = selected;
    return (
      <View style={styles.wrap}>
        <AppText>{card.prompt}</AppText>
        <View style={styles.center}>
          <Board
            values={grid}
            givens={givens}
            size={size}
            selected={sel}
            highlights={{ sameDigit: false }}
            overlay={chosen && sel >= 0 ? { candidates: answerOverlay([], { cell: sel, digit: chosen }) } : null}
            onCellPress={solved ? undefined : (cell) => { if (!grid[cell]) { setSelected(cell); setChosen(0); setFb(null); } }}
            testID="foundation-board"
          />
        </View>
        {sel >= 0 && !solved ? (
          <View style={styles.chips}>
            <AppText variant="label" muted>
              Digit for {cellName(sel)}:
            </AppText>
            <DigitChips
              testIDPrefix="fchip"
              state={(d) => (d === chosen ? 'on' : 'off')}
              labelFor={(d, s) => `Place ${d} in ${cellName(sel)}${s === 'on' ? ', chosen' : ''}`}
              onPress={(d) => {
                setChosen(d);
                if (sel === card.cell && d === card.digit) succeed(card.success);
                else setFb({ ok: false, text: sel === card.cell ? `Right cell, but not ${d}. ${card.retry}` : card.retry });
              }}
            />
          </View>
        ) : null}
        {fb ? <Feedback {...fb} /> : null}
      </View>
    );
  }

  if (card.kind === 'fill-candidates') {
    const answer = computeCandidates(grid)[card.cell];
    const check = () => {
      if (mask === answer) return succeed(card.success);
      const extra = digitsOf(mask & ~answer);
      const missing = digitsOf(answer & ~mask);
      if (extra.length) setFb({ ok: false, text: whyNot(grid, card.cell, extra[0]) });
      else setFb({ ok: false, text: `You left out ${missing.length === 1 ? 'a digit' : `${missing.length} digits`}: nothing in the row, column or box rules ${missing.length === 1 ? 'it' : 'them'} out.` });
    };
    return (
      <View style={styles.wrap}>
        <AppText>{card.prompt}</AppText>
        <View style={styles.center}>
          <Board
            values={grid}
            givens={givens}
            notes={grid.map((_, i) => (i === card.cell ? mask : 0))}
            selected={card.cell}
            size={size}
            highlights={{ sameDigit: false }}
            readOnly
            testID="foundation-board"
          />
        </View>
        <DigitChips
          testIDPrefix="fchip"
          state={(d) => (mask & bit(d) ? 'on' : 'off')}
          labelFor={(d, s) => `Candidate ${d} for ${cellName(card.cell)}${s === 'on' ? ', selected' : ''}`}
          onPress={(d) => {
            if (solved) return;
            setFb(null);
            setMask((m) => m ^ bit(d));
          }}
        />
        {!solved ? <Button label="Check" kind="primary" icon="check" onPress={check} testID="foundation-check" /> : null}
        {fb ? <Feedback {...fb} /> : null}
      </View>
    );
  }

  // remove-candidates
  const cands = staleCandidates(grid, card.focusCell);
  const placedDigit = card.focusCell !== undefined ? grid[card.focusCell] : 0;
  const key = (m: CellDigit) => `${m.cell}:${m.digit}`;
  const answerKeys = new Set(card.answers.map(key));
  const toggle = (cell: number, digit: number) => {
    if (solved) return;
    setFb(null);
    setSelected(cell);
    setMarks((ms) => (ms.some((m) => m.cell === cell && m.digit === digit) ? ms.filter((m) => !(m.cell === cell && m.digit === digit)) : [...ms, { cell, digit }]));
  };
  const check = () => {
    const wrong = marks.filter((m) => !answerKeys.has(key(m)));
    const found = marks.length - wrong.length;
    if (!wrong.length && found === card.answers.length) return succeed(card.success);
    if (wrong.length) {
      const w = wrong[0];
      setFb({
        ok: false,
        text: w.digit !== placedDigit ? `Only the digit ${placedDigit} was placed, so only ${placedDigit}s need to go.` : `${cellName(w.cell)} does not share a row, column or box with ${cellName(card.focusCell ?? 0)}, so its ${placedDigit} stays.`,
      });
    } else setFb({ ok: false, text: `${found} of ${card.answers.length} found. Check the whole row, column and box.` });
  };
  const selCands = selected >= 0 && !grid[selected] ? cands[selected] : 0;
  return (
    <View style={styles.wrap}>
      <AppText>{card.prompt}</AppText>
      <View style={styles.center}>
        <Board
          values={grid}
          givens={givens}
          candidates={cands}
          selected={selected}
          size={size}
          highlights={{ sameDigit: false, peers: false }}
          overlay={{ focusCells: card.focusCell !== undefined ? [card.focusCell] : [], candidates: answerOverlay(marks, null) }}
          onCellPress={solved ? undefined : (cell) => setSelected(cell)}
          onCandidatePress={solved ? undefined : toggle}
          testID="foundation-board"
        />
      </View>
      {selected >= 0 && selCands && !solved ? (
        <View style={styles.chips}>
          <AppText variant="label" muted>
            Notes in {cellName(selected)} (tap to mark for removal):
          </AppText>
          <DigitChips
            testIDPrefix="fchip"
            digits={digitsOf(selCands)}
            state={(d) => (marks.some((m) => m.cell === selected && m.digit === d) ? 'strike' : 'off')}
            labelFor={(d, s) => `Note ${d} in ${cellName(selected)}${s === 'strike' ? ', marked for removal' : ''}`}
            onPress={(d) => toggle(selected, d)}
          />
        </View>
      ) : null}
      {!solved ? (
        <View style={styles.row}>
          {marks.length ? <Button label="Clear" compact onPress={() => setMarks([])} style={styles.flex} /> : null}
          <Button label="Check" kind="primary" icon="check" compact onPress={check} style={styles.flex} testID="foundation-check" />
        </View>
      ) : null}
      {fb ? <Feedback {...fb} /> : null}
      <View style={[styles.legend, { backgroundColor: c.surfaceAlt }]}>
        <AppText variant="caption" muted>
          Marked notes turn red with a strike. Small notes are hard to hit: tap a cell to get large buttons instead.
        </AppText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: space.md },
  center: { alignItems: 'center' },
  chips: { gap: space.sm },
  option: { justifyContent: 'flex-start' },
  feedback: { borderRadius: radius.button, padding: space.md, borderWidth: 1.5, gap: space.xs },
  row: { flexDirection: 'row', gap: space.sm },
  flex: { flex: 1 },
  legend: { borderRadius: radius.button, padding: space.sm },
});
