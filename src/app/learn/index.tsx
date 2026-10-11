import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';
import { parseGrid, type Difficulty, type TechniqueId } from '../../engine';
import {
  dueForReview,
  getLesson,
  lessonProgress,
  lessonsInLevel,
  lessonStatus,
  LESSONS,
  LEVELS,
  prerequisiteText,
  recommendedLesson,
  weakSpots,
  type Lesson,
  type LessonStatus,
} from '../../learn';
import { PracticeLauncher } from '../../learn/components/PracticeLauncher';
import { useLearning } from '../../state/learning';
import { useHasGame } from '../../state/hooks';
import { AppText, Button, Card, SectionTitle } from '../../ui/components/primitives';
import { Screen } from '../../ui/components/Screen';
import { Sheet } from '../../ui/components/Sheet';
import { Icon, type IconName } from '../../ui/icons/Icon';
import { useColors } from '../../ui/ThemeContext';
import { fontSize, radius, space } from '../../ui/theme';

const STATUS_LABEL: Record<LessonStatus, string> = {
  locked: 'Locked',
  available: 'Ready',
  completed: 'Completed',
  mastered: 'Mastered',
  'needs-review': 'Needs review',
};
const STATUS_ICON: Record<LessonStatus, IconName> = {
  locked: 'lock',
  available: 'play',
  completed: 'check',
  mastered: 'star',
  'needs-review': 'restart',
};

function LessonNode({ lesson, status, onPress }: { lesson: Lesson; status: LessonStatus; onPress: () => void }) {
  const c = useColors();
  const tone =
    status === 'mastered' ? c.success : status === 'completed' ? c.accent : status === 'needs-review' ? c.hint : status === 'available' ? c.accent : c.inkMuted;
  const filled = status === 'mastered' || status === 'completed';
  const sub = status === 'locked' ? prerequisiteText(lesson) : lesson.summary;
  return (
    <Pressable
      testID={`lesson-${lesson.id}`}
      accessibilityRole="button"
      accessibilityLabel={`${lesson.title}, ${STATUS_LABEL[status]}. ${sub}`}
      onPress={onPress}
      style={({ pressed }) => [styles.node, { backgroundColor: c.surface, opacity: pressed ? 0.8 : 1 }]}
    >
      <View style={[styles.nodeIcon, { backgroundColor: filled ? tone : 'transparent', borderColor: tone }]}>
        <Icon name={STATUS_ICON[status]} size={18} color={filled ? c.surface : tone} />
      </View>
      <View style={styles.flex}>
        <AppText variant="label" style={{ color: status === 'locked' ? c.inkMuted : c.ink }}>
          {lesson.title}
        </AppText>
        <AppText variant="caption" muted numberOfLines={2}>
          {sub}
        </AppText>
      </View>
      <AppText variant="caption" style={{ color: tone, fontWeight: '700' }}>
        {STATUS_LABEL[status]}
      </AppText>
    </Pressable>
  );
}

const DIFFS: { d: Difficulty; label: string }[] = [
  { d: 'easy', label: 'Easy' },
  { d: 'medium', label: 'Medium' },
  { d: 'hard', label: 'Hard' },
  { d: 'expert', label: 'Expert' },
];

export default function LearnHome() {
  const c = useColors();
  const learning = useLearning();
  const hasGame = useHasGame();
  // Re-evaluated whenever progress changes (and on every visit), which is what review timing needs.
  const now = useMemo(() => Date.now(), [learning]);
  const [locked, setLocked] = useState<Lesson | null>(null);
  const [explore, setExplore] = useState(false);
  const [paste, setPaste] = useState('');
  const [pasteError, setPasteError] = useState('');

  const recommended = useMemo(() => {
    const id = recommendedLesson(learning, LESSONS, now);
    return id ? getLesson(id) : undefined;
  }, [learning, now]);
  const due = useMemo(() => dueForReview(learning, now).map(getLesson).filter((l): l is Lesson => !!l).slice(0, 5), [learning, now]);
  const weak = useMemo(() => weakSpots(learning, now).filter((w) => getLesson(w.id)), [learning, now]);

  const open = (l: Lesson) => {
    if (lessonStatus(learning, l, now) === 'locked') setLocked(l);
    else router.push(`/learn/${l.id}`);
  };

  const exploreWith = (q: string) => {
    setExplore(false);
    router.push(`/learn/solve?${q}`);
  };

  const submitPaste = () => {
    try {
      const g = parseGrid(paste);
      setPasteError('');
      exploreWith(`puzzle=${g.join('')}`);
    } catch (e) {
      setPasteError(e instanceof Error ? e.message : 'That does not look like a puzzle.');
    }
  };

  const completedCount = LESSONS.filter((l) => lessonProgress(learning, l.id).completedAt !== null).length;
  const masteredCount = LESSONS.filter((l) => lessonProgress(learning, l.id).masteredAt !== null).length;

  return (
    <Screen title="Learn">
      <AppText muted testID="learn-summary">
        {completedCount} of {LESSONS.length} lessons completed · {masteredCount} mastered
      </AppText>

      {recommended ? (
        <Pressable
          testID="recommended"
          accessibilityRole="button"
          accessibilityLabel={`Recommended next: ${recommended.title}. ${recommended.summary}`}
          onPress={() => router.push(`/learn/${recommended.id}`)}
          style={({ pressed }) => [styles.hero, { backgroundColor: c.accent, opacity: pressed ? 0.9 : 1 }]}
        >
          <AppText variant="caption" color={c.onAccent} style={styles.kicker}>
            {lessonProgress(learning, recommended.id).completedAt ? 'Take the mastery check' : 'Up next'}
          </AppText>
          <AppText variant="heading" color={c.onAccent}>
            {recommended.title}
          </AppText>
          <AppText color={c.onAccent}>{recommended.summary}</AppText>
          <View style={styles.heroRow}>
            <AppText variant="label" color={c.onAccent}>
              {LEVELS[recommended.level - 1].title}
            </AppText>
            <Icon name="chevron" size={20} color={c.onAccent} />
          </View>
        </Pressable>
      ) : (
        <Card>
          <AppText variant="heading">Everything mastered</AppText>
          <AppText muted>Keep your skills fresh with the reviews below.</AppText>
        </Card>
      )}

      {due.length ? (
        <>
          <SectionTitle>Due for review</SectionTitle>
          <Card style={styles.list}>
            {due.map((l) => (
              <View key={l.id} style={styles.listRow} testID={`due-${l.id}`}>
                <Icon name="restart" size={20} color={c.hint} />
                <View style={styles.flex}>
                  <AppText variant="label">{l.title}</AppText>
                  <AppText variant="caption" muted>
                    {lessonProgress(learning, l.id).lastResult === 'fail' ? 'Last review missed' : 'Review is due'}
                  </AppText>
                </View>
                <Button label="Review" compact onPress={() => router.push(`/learn/${l.id}?card=mastery`)} />
              </View>
            ))}
          </Card>
        </>
      ) : null}

      {weak.length ? (
        <>
          <SectionTitle>Practice your weak spots</SectionTitle>
          <Card style={styles.list}>
            {weak.map((w) => {
              const l = getLesson(w.id)!;
              return (
                <View key={w.id} style={styles.weak} testID={`weak-${w.id}`}>
                  <View style={styles.listRow}>
                    <Icon name="target" size={20} color={c.conflict} />
                    <View style={styles.flex}>
                      <AppText variant="label">{l.title}</AppText>
                      <AppText variant="caption" muted>
                        {w.reason}
                      </AppText>
                    </View>
                    <Button label="Lesson" compact onPress={() => router.push(`/learn/${l.id}`)} />
                  </View>
                  {l.technique ? <PracticeLauncher technique={l.technique as TechniqueId} variant={w.recentHints} compact /> : null}
                </View>
              );
            })}
          </Card>
        </>
      ) : null}

      <Pressable
        testID="explore"
        accessibilityRole="button"
        accessibilityLabel="Explore a puzzle step by step"
        onPress={() => setExplore(true)}
        style={({ pressed }) => [styles.explore, { backgroundColor: c.surface, opacity: pressed ? 0.8 : 1 }]}
      >
        <Icon name="layers" size={24} color={c.accent} />
        <View style={styles.flex}>
          <AppText variant="heading">Explore a puzzle</AppText>
          <AppText variant="caption" muted>
            Watch the solver work through any puzzle, one explained step at a time.
          </AppText>
        </View>
        <Icon name="chevron" size={20} color={c.inkMuted} />
      </Pressable>

      {LEVELS.map((level) => {
        const lessons = lessonsInLevel(level.id);
        const done = lessons.filter((l) => lessonProgress(learning, l.id).completedAt !== null).length;
        return (
          <View key={level.id} style={styles.level} testID={`level-${level.id}`}>
            <SectionTitle>{level.title}</SectionTitle>
            <AppText variant="caption" muted style={styles.levelBlurb}>
              {level.blurb} {done}/{lessons.length} completed.
            </AppText>
            <View style={styles.nodes}>
              {lessons.map((l) => (
                <LessonNode key={l.id} lesson={l} status={lessonStatus(learning, l, now)} onPress={() => open(l)} />
              ))}
            </View>
          </View>
        );
      })}

      <Sheet visible={!!locked} onClose={() => setLocked(null)} title={locked?.title} testID="locked-sheet">
        {locked ? (
          <>
            <AppText>
              {prerequisiteText(locked)}. Those lessons teach what this one builds on, so it will make more sense afterwards.
            </AppText>
            <AppText muted>You are free to look anyway: nothing is really locked.</AppText>
            {locked.prerequisites
              .filter((p) => lessonProgress(learning, p).completedAt === null)
              .map((p) => {
                const pl = getLesson(p);
                return pl ? (
                  <Button key={p} label={`Go to ${pl.title}`} kind="primary" onPress={() => { setLocked(null); router.push(`/learn/${p}`); }} testID={`goto-${p}`} />
                ) : null;
              })}
            <Button label="Preview anyway" onPress={() => { const l = locked; setLocked(null); router.push(`/learn/${l.id}`); }} testID="preview-anyway" />
          </>
        ) : null}
      </Sheet>

      <Sheet visible={explore} onClose={() => setExplore(false)} title="Explore a puzzle" testID="explore-sheet">
        <AppText muted>The solver shows every step with its pattern and explanation. If it gets stuck, it says so.</AppText>
        {hasGame ? <Button label="My current game" kind="primary" icon="play" onPress={() => exploreWith('source=game')} testID="explore-game" /> : null}
        <View style={styles.diffRow}>
          {DIFFS.map((x) => (
            <Button key={x.d} label={x.label} compact onPress={() => exploreWith(`source=random&difficulty=${x.d}`)} style={styles.diff} testID={`explore-${x.d}`} />
          ))}
        </View>
        <AppText variant="label">Or paste a puzzle (81 digits, 0 or . for empty)</AppText>
        <TextInput
          value={paste}
          onChangeText={setPaste}
          placeholder="530070000600195000…"
          placeholderTextColor={c.inkMuted}
          autoCapitalize="none"
          autoCorrect={false}
          multiline
          accessibilityLabel="Puzzle to explore"
          style={[styles.input, { color: c.ink, borderColor: c.line, backgroundColor: c.bg }]}
          testID="explore-input"
        />
        {pasteError ? <AppText color={c.conflict}>{pasteError}</AppText> : null}
        <Button label="Explore this puzzle" onPress={submitPaste} disabled={!paste.trim()} testID="explore-paste" />
      </Sheet>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  hero: { borderRadius: radius.card, padding: space.lg, gap: space.xs },
  kicker: { textTransform: 'uppercase', letterSpacing: 0.8, fontWeight: '700', opacity: 0.85 },
  heroRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: space.sm },
  list: { gap: space.md },
  listRow: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  weak: { gap: space.sm },
  explore: { flexDirection: 'row', alignItems: 'center', gap: space.md, padding: space.lg, borderRadius: radius.card, minHeight: 64 },
  level: { gap: space.xs },
  levelBlurb: { marginTop: -space.xs, marginBottom: space.xs },
  nodes: { gap: space.sm },
  node: { flexDirection: 'row', alignItems: 'center', gap: space.md, padding: space.md, borderRadius: radius.card, minHeight: 60 },
  nodeIcon: { width: 36, height: 36, borderRadius: 18, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  diffRow: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  diff: { flexGrow: 1, flexBasis: '40%' },
  input: { borderWidth: 1, borderRadius: radius.button, padding: space.md, minHeight: 72, fontSize: fontSize.md, fontVariant: ['tabular-nums'] },
});
