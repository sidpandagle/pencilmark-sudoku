import { StyleSheet, View } from 'react-native';
import { DIFFICULTIES } from '../engine';
import { averageTime, completionRate, currentStreak, difficultyLabel, difficultyTrend, formatTime, totals, type BucketStats, type Trend } from '../game';
import { useHistory, useStats } from '../state/hooks';
import { AppText, Card, SectionTitle } from '../ui/components/primitives';
import { Screen } from '../ui/components/Screen';
import { useColors } from '../ui/ThemeContext';
import { space } from '../ui/theme';

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.metric} accessible accessibilityLabel={`${label}: ${value}`}>
      <AppText variant="title" style={styles.tabular}>
        {value}
      </AppText>
      <AppText variant="caption" muted>
        {label}
      </AppText>
    </View>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row} accessible accessibilityLabel={`${label}: ${value}`}>
      <AppText muted>{label}</AppText>
      <AppText variant="label" style={styles.tabular}>
        {value}
      </AppText>
    </View>
  );
}

/** Tiny bar chart of recent solve times (shorter bar = faster), with a text summary for screen readers. */
function TrendView({ trend }: { trend: Trend }) {
  const c = useColors();
  if (trend.recent.length < 2) return null;
  const max = Math.max(...trend.recent);
  const summary =
    trend.deltaMs === null
      ? `Last ${trend.recent.length} solves. Solve ${10 - trend.recent.length} more to see a trend.`
      : trend.deltaMs <= -1000
        ? `Faster by ${formatTime(-trend.deltaMs)} on average (last 5 vs previous 5).`
        : trend.deltaMs >= 1000
          ? `Slower by ${formatTime(trend.deltaMs)} on average (last 5 vs previous 5).`
          : 'Steady: about the same as your previous 5.';
  return (
    <View accessible accessibilityLabel={`Recent trend. ${summary}`} style={styles.trend}>
      <View style={styles.bars}>
        {trend.recent.map((t, i) => (
          <View
            key={i}
            style={[styles.bar, { height: Math.max(4, Math.round((t / max) * 40)), backgroundColor: i === trend.recent.length - 1 ? c.accent : c.sameDigit }]}
          />
        ))}
      </View>
      <AppText variant="caption" muted>
        {summary}
      </AppText>
    </View>
  );
}

function BucketCard({ title, b, trend }: { title: string; b: BucketStats; trend?: Trend }) {
  const avg = averageTime(b);
  return (
    <Card style={styles.card}>
      <AppText variant="heading" accessibilityRole="header">
        {title}
      </AppText>
      <Row label="Started" value={String(b.started)} />
      <Row label="Completed" value={String(b.completed)} />
      <Row label="Completion rate" value={b.started ? `${Math.round(completionRate(b) * 100)}%` : '–'} />
      <Row label="Best time" value={b.bestTimeMs !== null ? formatTime(b.bestTimeMs) : '–'} />
      <Row label="Average time" value={avg !== null ? formatTime(avg) : '–'} />
      <Row label="No-mistake wins" value={String(b.noMistakeWins)} />
      {trend ? <TrendView trend={trend} /> : null}
    </Card>
  );
}

export default function StatsScreen() {
  const c = useColors();
  const stats = useStats();
  const history = useHistory();
  const t = totals(stats);
  return (
    <Screen title="Statistics">
      <Card style={styles.summary}>
        <Metric label="Current streak" value={`${currentStreak(stats)}`} />
        <View style={[styles.sep, { backgroundColor: c.line }]} />
        <Metric label="Longest streak" value={`${stats.longestStreak}`} />
        <View style={[styles.sep, { backgroundColor: c.line }]} />
        <Metric label="Solved" value={`${t.completed}`} />
      </Card>
      <AppText variant="caption" muted>
        A streak counts consecutive days with at least one completed puzzle.
      </AppText>
      <SectionTitle>By difficulty</SectionTitle>
      {DIFFICULTIES.map((d) => (
        <BucketCard key={d} title={difficultyLabel(d)} b={stats.buckets[d]} trend={difficultyTrend(history, d)} />
      ))}
      {stats.buckets.custom.started > 0 ? <BucketCard title="Custom" b={stats.buckets.custom} /> : null}
      <SectionTitle>Totals</SectionTitle>
      <Card style={styles.card}>
        <Row label="Games started" value={String(t.started)} />
        <Row label="Games completed" value={String(t.completed)} />
        <Row label="Time solving" value={formatTime(t.totalTimeMs)} />
        <Row label="Daily challenges" value={String(stats.dailyCompleted.length)} />
        <Row label="Hints used" value={String(stats.totalHints)} />
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  summary: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around', marginTop: space.sm },
  metric: { alignItems: 'center', flex: 1, gap: 2 },
  sep: { width: StyleSheet.hairlineWidth, alignSelf: 'stretch' },
  card: { gap: space.xs },
  row: { flexDirection: 'row', justifyContent: 'space-between', minHeight: 30, alignItems: 'center' },
  tabular: { fontVariant: ['tabular-nums'] },
  trend: { gap: space.xs, marginTop: space.sm },
  bars: { flexDirection: 'row', alignItems: 'flex-end', gap: 4, height: 40 },
  bar: { width: 14, borderRadius: 3 },
});
