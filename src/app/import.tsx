import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { StyleSheet, TextInput, View, useWindowDimensions } from 'react-native';
import { analyzePuzzle, parseGrid, type Difficulty, type PuzzleAnalysis } from '../engine';
import { describeAnalysis, digitCounts } from '../game';
import { startCustomGame } from '../state/actions';
import { Board } from '../ui/board';
import { NumberPad } from '../ui/components/NumberPad';
import { AppText, Button, Card, Segmented } from '../ui/components/primitives';
import { Screen } from '../ui/components/Screen';
import { useColors } from '../ui/ThemeContext';
import { fontSize, radius, space } from '../ui/theme';

const MAX_INPUT = 400;
const EMPTY81 = () => new Array<number>(81).fill(0);

type Result =
  | { kind: 'error'; message: string }
  | { kind: 'analysis'; analysis: PuzzleAnalysis; puzzle: number[] };

export default function ImportScreen() {
  const c = useColors();
  const { width } = useWindowDimensions();
  const [mode, setMode] = useState<'paste' | 'tap'>('paste');
  const [text, setText] = useState('');
  const [tapValues, setTapValues] = useState<number[]>(EMPTY81);
  const [selected, setSelected] = useState(0);
  const [result, setResult] = useState<Result | null>(null);
  const [busy, setBusy] = useState(false);

  const colW = Math.min(width, 640) - space.lg * 2;
  const boardSize = Math.max(180, Math.floor(Math.min(colW, 420) / 9) * 9);
  const tapGivens = useMemo(() => tapValues.map(() => false), [tapValues]);
  const counts = useMemo(() => digitCounts(tapValues), [tapValues]);

  const check = () => {
    let grid: number[];
    if (mode === 'paste') {
      try {
        grid = parseGrid(text.slice(0, MAX_INPUT));
      } catch (e) {
        setResult({ kind: 'error', message: e instanceof Error ? e.message : 'Could not read that puzzle.' });
        return;
      }
    } else {
      grid = tapValues.slice();
    }
    const clues = grid.filter(Boolean).length;
    if (clues < 17) {
      setResult({
        kind: 'error',
        message: `This has ${clues} givens. A Sudoku needs at least 17 to have a single solution.`,
      });
      return;
    }
    setBusy(true);
    setTimeout(() => {
      try {
        setResult({ kind: 'analysis', analysis: analyzePuzzle(grid), puzzle: grid });
      } catch {
        setResult({ kind: 'error', message: 'Something went wrong checking this puzzle.' });
      } finally {
        setBusy(false);
      }
    }, 20);
  };

  const start = (puzzle: number[], a: PuzzleAnalysis) => {
    if (!a.solution) return;
    startCustomGame(puzzle, a.solution, (a.difficulty ?? null) as Difficulty | null);
    router.replace('/play');
  };

  const setCell = (d: number) => {
    setTapValues((v) => {
      const n = v.slice();
      n[selected] = d;
      return n;
    });
    setResult(null);
    if (d && selected < 80) setSelected(selected + 1);
  };

  const desc = result?.kind === 'analysis' ? describeAnalysis(result.analysis) : null;
  const preview = result?.kind === 'analysis' ? result.puzzle : null;

  return (
    <Screen title="Import puzzle">
      <Segmented
        label="Entry mode"
        value={mode}
        onChange={(m) => {
          setMode(m);
          setResult(null);
        }}
        options={[
          { value: 'paste', label: 'Paste text' },
          { value: 'tap', label: 'Tap to enter' },
        ]}
      />
      {mode === 'paste' ? (
        <>
          <AppText muted>
            Paste 81 characters, row by row. Use 1–9 for givens and . or 0 for blanks. Spaces, line breaks and | - +
            separators are ignored.
          </AppText>
          <TextInput
            testID="import-input"
            accessibilityLabel="Puzzle text"
            value={text}
            onChangeText={(t) => {
              setText(t.slice(0, MAX_INPUT));
              setResult(null);
            }}
            maxLength={MAX_INPUT}
            multiline
            autoCapitalize="none"
            autoCorrect={false}
            spellCheck={false}
            placeholder="53..7....6..195....98....6.8...6...34..8.3..17...2...6.6....28....419..5....8..79"
            placeholderTextColor={c.inkMuted}
            style={[styles.input, { color: c.ink, backgroundColor: c.surface, borderColor: c.line }]}
          />
          <AppText variant="caption" muted>
            {text.length}/{MAX_INPUT}
          </AppText>
        </>
      ) : (
        <View style={styles.tap}>
          <Board
            values={tapValues}
            givens={tapGivens}
            selected={selected}
            size={boardSize}
            highlights={{ sameDigit: false }}
            onCellPress={setSelected}
            testID="import-board"
          />
          <NumberPad width={Math.min(colW, 480)} counts={counts} onDigit={setCell} />
          <View style={styles.row}>
            <Button label="Erase" icon="erase" onPress={() => setCell(0)} style={styles.flex} />
            <Button
              label="Clear all"
              icon="eraseAll"
              onPress={() => {
                setTapValues(EMPTY81());
                setResult(null);
              }}
              style={styles.flex}
            />
          </View>
        </View>
      )}

      <Button label={busy ? 'Checking…' : 'Check puzzle'} kind="primary" onPress={check} disabled={busy} testID="import-check" />

      {result?.kind === 'error' ? (
        <Card style={{ backgroundColor: c.conflictSoft }}>
          <AppText testID="import-error" color={c.ink}>
            {result.message}
          </AppText>
        </Card>
      ) : null}

      {desc && preview && result?.kind === 'analysis' ? (
        <Card style={styles.result} >
          <AppText variant="heading" testID="import-result-title">
            {desc.title}
          </AppText>
          <AppText muted testID="import-result">
            {desc.message}
          </AppText>
          {mode === 'paste' ? (
            <View style={styles.previewWrap}>
              <Board values={preview} givens={preview.map(Boolean)} size={Math.floor(Math.min(boardSize, 270) / 9) * 9} readOnly testID="import-preview" />
            </View>
          ) : null}
          {desc.ok ? (
            <Button label="Start" kind="primary" icon="play" onPress={() => start(preview, result.analysis)} testID="import-start" />
          ) : null}
        </Card>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  input: {
    minHeight: 120,
    borderWidth: 1,
    borderRadius: radius.button,
    padding: space.md,
    fontSize: fontSize.md,
    fontFamily: 'monospace',
    textAlignVertical: 'top',
  },
  tap: { alignItems: 'center', gap: space.md },
  row: { flexDirection: 'row', gap: space.sm, alignSelf: 'stretch' },
  flex: { flex: 1 },
  result: { gap: space.sm },
  previewWrap: { alignItems: 'center', paddingVertical: space.sm },
});
