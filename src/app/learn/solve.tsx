import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { generatePuzzle, techniqueName, type Difficulty, type Step } from '../../engine';
import { alternativeMoves, buildSolveSession, getLesson, lessonForTechnique, type AlternativeMove, type SolveSession } from '../../learn';
import { useLessonBoardSize } from '../../learn/components/layout';
import { gameStore } from '../../state/stores';
import { Board, overlayFromStep } from '../../ui/board';
import { AppText, Button, Card } from '../../ui/components/primitives';
import { ScreenHeader } from '../../ui/components/Screen';
import { useColors } from '../../ui/ThemeContext';
import { radius, space } from '../../ui/theme';

interface Source {
  grid: number[];
  givens: boolean[];
  label: string;
  error?: string;
}

const DIFFICULTIES: Difficulty[] = ['easy', 'medium', 'hard', 'expert'];

function loadSource(params: { source?: string; difficulty?: string; puzzle?: string }): Source {
  if (params.source === 'game') {
    const g = gameStore.get();
    if (!g) return { grid: [], givens: [], label: 'Current game', error: 'There is no game in progress.' };
    const wrong = g.values.filter((v, i) => v && v !== g.solution[i]).length;
    if (wrong) {
      return {
        grid: [],
        givens: [],
        label: 'Current game',
        error: `${wrong} of your entries ${wrong === 1 ? 'does' : 'do'} not match the solution. Logic can only continue from correct digits, so fix ${wrong === 1 ? 'it' : 'them'} in the game first.`,
      };
    }
    return { grid: g.values.slice(), givens: g.givens.slice(), label: 'From your current game' };
  }
  if (params.puzzle && /^[0-9]{81}$/.test(params.puzzle)) {
    const grid = params.puzzle.split('').map(Number);
    return { grid, givens: grid.map((v) => v !== 0), label: 'Your puzzle' };
  }
  const d = DIFFICULTIES.includes(params.difficulty as Difficulty) ? (params.difficulty as Difficulty) : 'medium';
  const p = generatePuzzle(d);
  return { grid: p.puzzle, givens: p.puzzle.map((v) => v !== 0), label: `${d.charAt(0).toUpperCase()}${d.slice(1)} puzzle` };
}

export default function GuidedSolve() {
  const params = useLocalSearchParams<{ source?: string; difficulty?: string; puzzle?: string }>();
  const c = useColors();
  const insets = useSafeAreaInsets();
  const size = useLessonBoardSize(432);
  const [source, setSource] = useState<Source | null>(null);
  const [session, setSession] = useState<SolveSession | null>(null);
  const [i, setI] = useState(0);
  const [detail, setDetail] = useState<'where' | 'full'>('where');
  const [showCands, setShowCands] = useState(true);
  const [alts, setAlts] = useState<AlternativeMove[] | null>(null);
  const [altPreview, setAltPreview] = useState<Step | null>(null);

  // Work out the whole path after the first paint (hard puzzles can take a second).
  useEffect(() => {
    const t = setTimeout(() => {
      const src = loadSource(params);
      setSource(src);
      if (!src.error) setSession(buildSolveSession(src.grid));
    }, 20);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const total = session?.steps.length ?? 0;
  const atEnd = !!session && i >= total;
  const step = session && !atEnd ? session.steps[i] : null;
  const frame = session ? session.frames[Math.min(i, total)] : null;
  const shown = altPreview ?? step;
  const overlay = useMemo(() => (shown ? overlayFromStep(shown, altPreview ? 'full' : detail) : null), [shown, detail, altPreview]);

  const go = (n: number) => {
    setAlts(null);
    setAltPreview(null);
    setI(Math.max(0, Math.min(total, n)));
    setDetail('where');
  };
  const next = () => {
    if (altPreview) return setAltPreview(null);
    if (step && detail === 'where') setDetail('full');
    else go(i + 1);
  };
  const back = () => {
    if (altPreview) return setAltPreview(null);
    if (detail === 'full') setDetail('where');
    else if (i > 0) {
      go(i - 1);
      setDetail('full');
    }
  };

  const header = (
    <View style={styles.headerWrap}>
      <ScreenHeader title="Step by step" />
    </View>
  );

  if (!source || (!session && !source.error)) {
    return (
      <View style={[styles.root, { backgroundColor: c.bg, paddingTop: insets.top }]}>
        {header}
        <View style={styles.loading} testID="solve-loading">
          <ActivityIndicator color={c.accent} />
          <AppText muted>Working out the solving path…</AppText>
        </View>
      </View>
    );
  }

  if (source.error || !session || !frame) {
    return (
      <View style={[styles.root, { backgroundColor: c.bg, paddingTop: insets.top }]}>
        {header}
        <View style={styles.column}>
          <Card>
            <AppText variant="heading">Can’t start here</AppText>
            <AppText testID="solve-error">{source.error ?? 'This puzzle cannot be explored.'}</AppText>
          </Card>
          <Button label="Go back" kind="primary" onPress={() => (router.canGoBack() ? router.back() : router.replace('/learn'))} />
        </View>
      </View>
    );
  }

  if (session.invalid) {
    return (
      <View style={[styles.root, { backgroundColor: c.bg, paddingTop: insets.top }]}>
        {header}
        <View style={styles.column}>
          <Card>
            <AppText variant="heading">This puzzle has no solution</AppText>
            <AppText testID="solve-error">It breaks the rules or leads to a contradiction, so there is nothing to explain.</AppText>
          </Card>
        </View>
      </View>
    );
  }

  const lesson = shown ? lessonForTechnique(shown.technique) : undefined;
  const caption = shown
    ? altPreview || detail === 'full'
      ? shown.explanation
      : (getLesson(shown.technique)?.content?.patternCaption ?? 'The highlighted cells form the pattern.')
    : '';

  return (
    <View style={[styles.root, { backgroundColor: c.bg, paddingTop: insets.top, paddingLeft: insets.left, paddingRight: insets.right }]} testID="solve-screen">
      {header}
      <ScrollView contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + space.xl }]}>
        <View style={styles.column}>
          <AppText variant="caption" muted>
            {source.label} · {total} step{total === 1 ? '' : 's'}
            {session.solved ? '' : ' before the solver stops'}
          </AppText>
          <AppText variant="heading" testID="solve-counter" accessibilityLiveRegion="polite">
            {atEnd ? (session.solved ? 'Solved' : 'Stuck') : `Step ${i + 1} of ${total} · ${techniqueName(step!.technique)}`}
          </AppText>
          {altPreview ? (
            <AppText variant="label" color={c.hint}>
              Alternative: {techniqueName(altPreview.technique)}
            </AppText>
          ) : null}
          <View style={styles.center}>
            <Board
              values={frame.grid}
              givens={source.givens}
              candidates={showCands ? frame.candidates : new Array(81).fill(0)}
              overlay={overlay}
              readOnly
              size={size}
              highlights={{ peers: false, sameDigit: false }}
              testID="solve-board"
            />
          </View>
          {atEnd ? (
            session.solved ? (
              <Card>
                <AppText testID="solve-done">Every cell is filled, using logic only. That took {total} steps.</AppText>
              </Card>
            ) : (
              <Card>
                <AppText testID="solve-stuck">
                  The remaining position needs techniques Pencilmark does not implement yet. The solver stops here rather than guess.
                </AppText>
              </Card>
            )
          ) : (
            <AppText testID="solve-caption" style={styles.caption}>
              {caption}
            </AppText>
          )}
          <View style={styles.row}>
            <Button label="Back" icon="back" compact onPress={back} disabled={i === 0 && detail === 'where' && !altPreview} style={styles.flex} testID="solve-back" />
            <Button label="Replay" icon="restart" compact onPress={() => { setAltPreview(null); setDetail('where'); }} disabled={atEnd} style={styles.flex} testID="solve-replay" />
            <Button label={altPreview ? 'Done' : detail === 'where' && step ? 'Explain' : 'Next'} kind="primary" compact onPress={next} disabled={atEnd} style={styles.flex} testID="solve-next" />
          </View>
          <View style={styles.row}>
            <Button label={showCands ? 'Hide candidates' : 'Show candidates'} compact onPress={() => setShowCands((v) => !v)} style={styles.flex} testID="solve-cands" />
            <Button label="Jump to end" compact onPress={() => go(total)} disabled={atEnd} style={styles.flex} testID="solve-end" />
          </View>
          {step && !altPreview ? (
            <View style={styles.row}>
              {lesson ? <Button label="Learn this technique" compact kind="tertiary" onPress={() => router.push(`/learn/${lesson.id}`)} style={styles.flex} testID="solve-learn" /> : null}
              <Button label="Other moves here" compact kind="tertiary" onPress={() => setAlts(alternativeMoves(frame, step.technique))} style={styles.flex} testID="solve-alts" />
            </View>
          ) : null}
          {alts && !altPreview ? (
            <Card style={styles.alts}>
              <AppText variant="label">{alts.length ? 'Other moves available here' : 'No other technique finds a move here.'}</AppText>
              {alts.length ? (
                <AppText variant="caption" muted>
                  The solver always picks the easiest move. These would also work:
                </AppText>
              ) : null}
              {alts.map((a) => (
                <Button key={a.technique} label={a.name} compact onPress={() => setAltPreview(a.step)} testID={`alt-${a.technique}`} />
              ))}
            </Card>
          ) : null}
          <View style={[styles.legend, { backgroundColor: c.surfaceAlt }]}>
            <AppText variant="caption" muted>
              Amber: the pattern. Red with a strike: candidates removed. Green: a digit placed. Blue/orange: the two sides of a chain.
            </AppText>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  flex: { flex: 1 },
  headerWrap: { width: '100%', maxWidth: 720, alignSelf: 'center' },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: space.md },
  scroll: { flexGrow: 1 },
  column: { width: '100%', maxWidth: 640, alignSelf: 'center', paddingHorizontal: space.lg, gap: space.md },
  center: { alignItems: 'center' },
  caption: { minHeight: 44 },
  row: { flexDirection: 'row', gap: space.sm },
  alts: { gap: space.sm },
  legend: { borderRadius: radius.button, padding: space.sm },
});
