import { router, type Href } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import type { Difficulty } from '../engine';
import { currentStreak, difficultyLabel, formatTime, localDateKey, progressOf, STATS_BUCKETS } from '../game';
import { dueForReview, LESSONS, lessonTitle, recommendedLesson } from '../learn';
import { useLearning } from '../state/learning';
import { startDailyGame, startRandomGame } from '../state/actions';
import { useGame, useStats } from '../state/hooks';
import { shallowEqual } from '../state/store';
import { BrandMark, Wordmark } from '../ui/components/Brand';
import { AppText, Button, Card } from '../ui/components/primitives';
import { Screen } from '../ui/components/Screen';
import { DifficultyPicker } from '../ui/game/DifficultyPicker';
import { Icon, type IconName } from '../ui/icons/Icon';
import { useColors } from '../ui/ThemeContext';
import { radius, space } from '../ui/theme';

const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

function NavTile({ icon, label, href, testID }: { icon: IconName; label: string; href: Href; testID: string }) {
  const c = useColors();
  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={() => router.push(href)}
      style={({ pressed }) => [styles.tile, { backgroundColor: c.surface, opacity: pressed ? 0.75 : 1 }]}
    >
      <Icon name={icon} size={22} color={c.accent} />
      <AppText variant="label" numberOfLines={1} style={styles.tileLabel}>
        {label}
      </AppText>
    </Pressable>
  );
}

function StatChip({ icon, value, label }: { icon: IconName; value: string; label: string }) {
  const c = useColors();
  return (
    <View style={[styles.chip, { backgroundColor: c.surface }]}>
      <Icon name={icon} size={18} color={c.accent} />
      <View>
        <AppText variant="label" style={styles.tabular}>
          {value}
        </AppText>
        <AppText variant="caption" muted numberOfLines={1}>
          {label}
        </AppText>
      </View>
    </View>
  );
}

export default function Home() {
  const c = useColors();
  const [picker, setPicker] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const stats = useStats();
  const cont = useGame(
    (g) =>
      g.status === 'completed'
        ? null
        : { difficulty: g.difficulty, time: Math.floor(g.elapsedMs / 1000), progress: progressOf(g), source: g.source, dailyKey: g.dailyKey },
    null,
    (a, b) => (a && b ? shallowEqual(a, b) : a === b),
  );
  const learning = useLearning();
  const today = localDateKey();
  const now = new Date();
  const solved = STATS_BUCKETS.reduce((n, b) => n + stats.buckets[b].completed, 0);
  const streak = currentStreak(stats, today);
  const lessonsDone = LESSONS.filter((l) => learning.lessons[l.id]?.completedAt != null).length;
  const nextLesson = recommendedLesson(learning, LESSONS, now.getTime());
  const reviewsDue = dueForReview(learning, now.getTime()).length;
  const learnSubtitle =
    lessonsDone === 0
      ? 'Start with the rules: 42 lessons from first steps to chains.'
      : `${lessonsDone} of ${LESSONS.length} lessons${nextLesson ? ` · Next: ${lessonTitle(nextLesson)}` : ''}`;
  const dailyDone = stats.dailyCompleted.includes(today);
  const dailyInProgress = cont?.source === 'daily' && cont.dailyKey === today;

  const run = (label: string, fn: () => void) => {
    setBusy(label);
    // Let the spinner paint before (synchronous) puzzle generation.
    setTimeout(() => {
      try {
        fn();
        router.push('/play');
      } finally {
        setBusy(null);
      }
    }, 30);
  };

  const pick = (d: Difficulty) => {
    setPicker(false);
    run('new', () => startRandomGame(d));
  };

  return (
    <Screen showHeader={false}>
      <View style={styles.brand}>
        <BrandMark size={48} />
        <View>
          <Wordmark size={28} />
          <AppText variant="caption" muted>
            Learn to see the logic.
          </AppText>
        </View>
      </View>

      {solved > 0 || lessonsDone > 0 ? (
        <View style={styles.statsRow} accessible accessibilityLabel={`${streak} day streak, ${solved} puzzles solved, ${lessonsDone} lessons completed`}>
          <StatChip icon="flame" value={String(streak)} label="day streak" />
          <StatChip icon="check" value={String(solved)} label="solved" />
          <StatChip icon="book" value={`${lessonsDone}/${LESSONS.length}`} label="lessons" />
        </View>
      ) : null}

      {cont ? (
        <Pressable
          testID="continue-card"
          accessibilityRole="button"
          accessibilityLabel={`Continue ${difficultyLabel(cont.difficulty)} game, ${Math.round(cont.progress * 100)} percent done`}
          onPress={() => router.push('/play')}
          style={({ pressed }) => [styles.continue, { backgroundColor: c.accent, opacity: pressed ? 0.9 : 1 }]}
        >
          <View style={styles.continueTop}>
            <View style={{ flex: 1 }}>
              <AppText variant="caption" color={c.onAccent} style={styles.kicker}>
                Continue
              </AppText>
              <AppText variant="heading" color={c.onAccent}>
                {cont.source === 'daily' ? 'Daily challenge' : difficultyLabel(cont.difficulty)}
              </AppText>
            </View>
            <AppText variant="label" color={c.onAccent} style={styles.tabular}>
              {formatTime(cont.time * 1000)}
            </AppText>
            <Icon name="play" size={22} color={c.onAccent} />
          </View>
          <View style={[styles.progressTrack, { backgroundColor: 'rgba(255,255,255,0.28)' }]}>
            <View style={[styles.progressFill, { width: `${Math.round(cont.progress * 100)}%`, backgroundColor: c.onAccent }]} />
          </View>
          <AppText variant="caption" color={c.onAccent}>
            {Math.round(cont.progress * 100)}% complete
          </AppText>
        </Pressable>
      ) : null}

      <Button
        label={busy === 'new' ? 'Preparing puzzle…' : 'New game'}
        kind={cont ? 'secondary' : 'primary'}
        icon="plus"
        onPress={() => setPicker(true)}
        disabled={!!busy}
        testID="new-game"
      />

      <Card>
        <Pressable
          testID="daily-card"
          accessibilityRole="button"
          accessibilityLabel={`Daily challenge for ${WEEKDAYS[now.getDay()]}, ${now.getDate()} ${MONTHS[now.getMonth()]}${dailyDone ? ', completed' : ''}`}
          onPress={() => run('daily', () => startDailyGame(today))}
          disabled={!!busy}
          style={styles.daily}
        >
          <View style={[styles.dailyIcon, { backgroundColor: dailyDone ? c.success : c.hintSoft }]}>
            <Icon name={dailyDone ? 'check' : 'calendar'} size={22} color={dailyDone ? c.surface : c.hint} />
          </View>
          <View style={{ flex: 1 }}>
            <AppText variant="heading">Daily challenge</AppText>
            <AppText variant="caption" muted>
              {WEEKDAYS[now.getDay()]}, {now.getDate()} {MONTHS[now.getMonth()]}
              {dailyDone ? ' · Completed' : dailyInProgress ? ' · In progress' : ''}
            </AppText>
          </View>
          {busy === 'daily' ? <ActivityIndicator color={c.accent} /> : <Icon name="chevron" size={20} color={c.inkMuted} />}
        </Pressable>
      </Card>

      <Pressable
        testID="learn-card"
        accessibilityRole="button"
        accessibilityLabel={`Learn techniques. ${learnSubtitle}${reviewsDue ? `. ${reviewsDue} reviews due` : ''}`}
        onPress={() => router.push('/learn')}
        style={({ pressed }) => [styles.learn, { backgroundColor: c.surface, opacity: pressed ? 0.8 : 1 }]}
      >
        <Icon name="book" size={24} color={c.accent} />
        <View style={{ flex: 1 }}>
          <AppText variant="heading">Learn</AppText>
          <AppText variant="caption" muted numberOfLines={2}>
            {learnSubtitle}
          </AppText>
        </View>
        {reviewsDue > 0 ? (
          <View style={[styles.badge, { backgroundColor: c.hintSoft }]} accessibilityLabel={`${reviewsDue} reviews due`}>
            <AppText variant="caption" color={c.hint} style={styles.badgeText}>
              {reviewsDue} due
            </AppText>
          </View>
        ) : null}
        <Icon name="chevron" size={20} color={c.inkMuted} />
      </Pressable>

      <View style={styles.grid}>
        <NavTile icon="stats" label="Statistics" href="/stats" testID="nav-stats" />
        <NavTile icon="history" label="History" href="/history" testID="nav-history" />
        <NavTile icon="trophy" label="Achievements" href="/achievements" testID="nav-achievements" />
        <NavTile icon="import" label="Import" href="/import" testID="nav-import" />
        <NavTile icon="settings" label="Settings" href="/settings" testID="nav-settings" />
        <NavTile icon="help" label="Help" href="/help" testID="nav-help" />
      </View>

      <DifficultyPicker visible={picker} onClose={() => setPicker(false)} onPick={pick} replacingGame={!!cont} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  brand: { flexDirection: 'row', alignItems: 'center', gap: space.md, paddingTop: space.xl, paddingBottom: space.md },
  continue: { borderRadius: radius.card, padding: space.lg, gap: space.sm },
  continueTop: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  kicker: { textTransform: 'uppercase', letterSpacing: 0.8, fontWeight: '700', opacity: 0.85 },
  tabular: { fontVariant: ['tabular-nums'] },
  progressTrack: { height: 6, borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: 6, borderRadius: 3 },
  daily: { flexDirection: 'row', alignItems: 'center', gap: space.md, minHeight: 48 },
  dailyIcon: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  learn: { flexDirection: 'row', alignItems: 'center', gap: space.md, padding: space.lg, borderRadius: radius.card, minHeight: 64 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  statsRow: { flexDirection: 'row', gap: space.sm },
  chip: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: space.sm, paddingVertical: space.sm, paddingHorizontal: space.md, borderRadius: radius.card, minHeight: 52 },
  badge: { paddingHorizontal: space.sm, paddingVertical: 2, borderRadius: 10 },
  badgeText: { fontWeight: '700' },
  tile: {
    flexGrow: 1,
    flexBasis: '30%',
    minWidth: 100,
    minHeight: 76,
    borderRadius: radius.card,
    alignItems: 'center',
    justifyContent: 'center',
    gap: space.xs,
    padding: space.sm,
  },
  tileLabel: { textAlign: 'center' },
});
