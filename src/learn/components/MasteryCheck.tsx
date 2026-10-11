import { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import type { TechniqueId } from '../../engine';
import { recordMasteryCheck, useLearning } from '../../state/learning';
import { AppText, Button } from '../../ui/components/primitives';
import { useColors } from '../../ui/ThemeContext';
import { radius, space } from '../../ui/theme';
import { masteryPositions, type LessonPosition } from '../positions';
import { DAY_MS, lessonProgress, passed } from '../progress';
import type { TechniqueContent } from '../types';
import { ExerciseView, type ExerciseResult } from './ExerciseView';

function daysFromNow(t: number | null, now: number): string {
  if (t === null) return '';
  const d = Math.max(1, Math.round((t - now) / DAY_MS));
  return d === 1 ? 'tomorrow' : `in ${d} days`;
}

/**
 * Mastery check: 2-3 positions where the learner must find the move without help (one submission each).
 * Mastery = every position right. The result feeds the spaced-review schedule.
 */
export function MasteryCheck({
  lessonId,
  technique,
  content,
  size,
  onRetryLesson,
}: {
  lessonId: string;
  technique: TechniqueId;
  content: TechniqueContent;
  size: number;
  onRetryLesson: () => void;
}) {
  const c = useColors();
  const learning = useLearning();
  const progress = lessonProgress(learning, lessonId);
  const [phase, setPhase] = useState<'intro' | 'loading' | 'running' | 'result'>('intro');
  const [positions, setPositions] = useState<LessonPosition[]>([]);
  const [index, setIndex] = useState(0);
  const [results, setResults] = useState<ExerciseResult[]>([]);
  const [current, setCurrent] = useState<ExerciseResult | null>(null);
  // Captured when a check starts: after recording a first pass the lesson is mastered, but this run was not a review.
  const [isReview, setIsReview] = useState(progress.masteredAt !== null);

  const start = () => {
    setIsReview(lessonProgress(learning, lessonId).masteredAt !== null);
    setPhase('loading');
    // Let the spinner paint: mining a fresh position can take a moment for hard techniques.
    setTimeout(() => {
      const list = masteryPositions(technique, progress.attempts);
      setPositions(list);
      setIndex(0);
      setResults([]);
      setCurrent(null);
      setPhase('running');
    }, 20);
  };

  const onDone = useCallback((r: ExerciseResult) => setCurrent(r), []);

  const next = () => {
    if (!current) return;
    const all = [...results, current];
    setResults(all);
    setCurrent(null);
    if (index + 1 < positions.length) setIndex(index + 1);
    else {
      recordMasteryCheck(lessonId, { correct: all.filter((r) => r.correct).length, total: all.length, revealed: all.some((r) => r.revealed && !r.correct) });
      setPhase('result');
    }
  };

  const score = useMemo(() => results.filter((r) => r.correct).length, [results]);

  if (phase === 'intro' || phase === 'loading') {
    return (
      <View style={styles.wrap} testID="mastery-intro">
        <AppText>
          {isReview ? 'Time for a review. ' : ''}Find the move in up to three positions, without help. You have one answer per position. Get them all right to
          master this technique.
        </AppText>
        <AppText muted>
          {progress.attempts ? `Checks taken: ${progress.attempts}. Best score: ${Math.round(progress.bestScore * 100)}%.` : 'Finishing the lesson is not the same as mastering it: this check is.'}
        </AppText>
        {phase === 'loading' ? (
          <ActivityIndicator color={c.accent} />
        ) : (
          <Button label={isReview ? 'Start review' : 'Start the check'} kind="primary" icon="target" onPress={start} testID="mastery-start" />
        )}
      </View>
    );
  }

  if (phase === 'running') {
    const pos = positions[index];
    if (!pos) {
      return (
        <View style={styles.wrap}>
          <AppText>No positions are available for this check.</AppText>
        </View>
      );
    }
    return (
      <View style={styles.wrap}>
        <AppText variant="label" muted testID="mastery-progress">
          Position {index + 1} of {positions.length}
        </AppText>
        <ExerciseView key={pos.key} position={pos} content={content} mode="mastery" size={size} onDone={onDone} />
        {current ? (
          <Button label={index + 1 < positions.length ? 'Next position' : 'See result'} kind="primary" onPress={next} testID="mastery-next" />
        ) : null}
      </View>
    );
  }

  const total = results.length;
  const ok = passed({ correct: score, total, revealed: results.some((r) => r.revealed && !r.correct) });
  const after = lessonProgress(learning, lessonId);
  return (
    <View style={styles.wrap} testID="mastery-result">
      <View style={[styles.result, { backgroundColor: ok ? c.surface : c.hintSoft, borderColor: ok ? c.success : c.hint }]}>
        <AppText variant="title" color={ok ? c.success : c.ink}>
          {ok ? (isReview ? 'Review passed' : 'Mastered!') : 'Not yet'}
        </AppText>
        <AppText variant="heading">
          {score} of {total} correct
        </AppText>
        <AppText>
          {ok
            ? `Nicely done. Your next review is ${daysFromNow(after.nextReviewAt, Date.now())}; each passed review spaces them further apart.`
            : after.masteredAt !== null
              ? `No problem: the review interval goes back to one day, so you will see it again ${daysFromNow(after.nextReviewAt, Date.now())}.`
              : 'Go back over the demonstration and try again when you are ready. Every attempt helps.'}
        </AppText>
      </View>
      <View style={styles.row}>
        <Button label="Review the lesson" onPress={onRetryLesson} style={styles.flex} testID="mastery-review-lesson" />
        <Button label="Try again" kind={ok ? 'secondary' : 'primary'} onPress={start} style={styles.flex} testID="mastery-retry" />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: space.md },
  result: { borderRadius: radius.card, borderWidth: 1.5, padding: space.lg, gap: space.sm },
  row: { flexDirection: 'row', gap: space.sm, flexWrap: 'wrap' },
  flex: { flexGrow: 1 },
});
