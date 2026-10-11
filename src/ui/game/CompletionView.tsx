import { ScrollView, StyleSheet, View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import { achievementById, difficultyLabel, formatTime, spokenTime, type GameState } from '../../game';
import { AppText, Button, Card } from '../components/primitives';
import { Icon } from '../icons/Icon';
import { useColors } from '../ThemeContext';
import { space } from '../theme';

export function CompletionView({
  game,
  onNext,
  onReplay,
  onHome,
}: {
  game: GameState;
  onNext: () => void;
  onReplay: () => void;
  onHome: () => void;
}) {
  const c = useColors();
  const s = game.completion;
  const time = s?.timeMs ?? game.elapsedMs;
  const rows: [string, string, string?][] = [
    ['Time', formatTime(time), spokenTime(time)],
    ['Difficulty', difficultyLabel(game.difficulty)],
    ['Mistakes', String(s?.mistakes ?? game.mistakes)],
    ['Hints', String(s?.hintsUsed ?? game.hintsUsed)],
  ];
  if (s && s.streak > 0) rows.push(['Streak', `${s.streak} day${s.streak === 1 ? '' : 's'}`]);
  return (
    <ScrollView contentContainerStyle={styles.wrap} testID="completion">
      <View style={styles.inner}>
        <Svg width={72} height={72} viewBox="0 0 72 72">
          <Circle cx={36} cy={36} r={33} fill={c.surface} stroke={c.success} strokeWidth={3} />
          <Path d="M22 37l9.5 9.5L51 27" stroke={c.success} strokeWidth={4} fill="none" strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
        <AppText variant="title" accessibilityRole="header" style={styles.center}>
          Puzzle solved
        </AppText>
        <AppText muted style={styles.center}>
          {game.source === 'daily' ? 'Daily challenge complete. Nicely reasoned.' : 'Every digit in its place. Nicely reasoned.'}
        </AppText>
        {s?.isNewBest ? (
          <View style={[styles.badge, { backgroundColor: c.hintSoft }]} testID="best-badge">
            <Icon name="trophy" size={18} color={c.hint} />
            <AppText variant="label" color={c.ink}>
              New best time for {difficultyLabel(game.difficulty)}
            </AppText>
          </View>
        ) : null}
        <Card style={styles.card}>
          {rows.map(([k, v, a11y]) => (
            <View key={k} style={styles.row} accessible accessibilityLabel={`${k}: ${a11y ?? v}`}>
              <AppText muted>{k}</AppText>
              <AppText variant="label" style={styles.value}>
                {v}
              </AppText>
            </View>
          ))}
        </Card>
        {s?.newAchievements?.length ? (
          <View style={styles.achievements}>
            {s.newAchievements.map((id) => {
              const a = achievementById(id);
              return a ? (
                <View key={id} style={[styles.badge, { backgroundColor: c.accentSoft }]}>
                  <Icon name="medal" size={18} color={c.accent} />
                  <AppText variant="label">Achievement: {a.title}</AppText>
                </View>
              ) : null;
            })}
          </View>
        ) : null}
        <View style={styles.buttons}>
          <Button label="Next puzzle" kind="primary" icon="play" onPress={onNext} testID="completion-next" />
          <Button label="Replay" icon="restart" onPress={onReplay} testID="completion-replay" />
          <Button label="Home" kind="tertiary" onPress={onHome} testID="completion-home" />
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  wrap: { flexGrow: 1, justifyContent: 'center', padding: space.xl },
  inner: { width: '100%', maxWidth: 420, alignSelf: 'center', alignItems: 'center', gap: space.md },
  center: { textAlign: 'center' },
  badge: { flexDirection: 'row', alignItems: 'center', gap: space.sm, paddingHorizontal: space.md, paddingVertical: space.sm, borderRadius: 999 },
  card: { width: '100%', gap: space.sm },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', minHeight: 28 },
  value: { fontVariant: ['tabular-nums'] },
  achievements: { gap: space.sm, alignItems: 'center' },
  buttons: { width: '100%', gap: space.sm, marginTop: space.sm },
});
