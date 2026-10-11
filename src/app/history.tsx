import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { difficultyLabel, formatTime, type HistoryEntry } from '../game';
import { replayHistoryEntry } from '../state/actions';
import { useHistory } from '../state/hooks';
import { AppText, Button, Card } from '../ui/components/primitives';
import { Screen } from '../ui/components/Screen';
import { Icon } from '../ui/icons/Icon';
import { useColors } from '../ui/ThemeContext';
import { space } from '../ui/theme';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const formatDate = (ms: number) => {
  const d = new Date(ms);
  return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
};

function sourceLabel(e: HistoryEntry) {
  if (e.source === 'daily') return 'Daily';
  if (e.source === 'custom') return 'Imported';
  return difficultyLabel(e.difficulty);
}

function Entry({ e }: { e: HistoryEntry }) {
  const c = useColors();
  const won = e.result === 'completed';
  return (
    <Card style={styles.entry}>
      <View style={[styles.badge, { backgroundColor: won ? c.success : c.surfaceAlt }]}>
        <Icon name={won ? 'check' : 'pause'} size={18} color={won ? c.surface : c.inkMuted} />
      </View>
      <View style={styles.info} accessible accessibilityLabel={`${sourceLabel(e)}, ${won ? 'completed' : 'unfinished'}, ${formatDate(e.endedAt)}, time ${formatTime(e.timeMs)}`}>
        <AppText variant="label">
          {sourceLabel(e)}
          {e.source !== 'random' && e.difficulty ? ` · ${difficultyLabel(e.difficulty)}` : ''}
        </AppText>
        <AppText variant="caption" muted>
          {formatDate(e.endedAt)} · {formatTime(e.timeMs)} · {won ? 'Completed' : 'Unfinished'}
          {won && e.hintsUsed ? ` · ${e.hintsUsed} hint${e.hintsUsed === 1 ? '' : 's'}` : ''}
        </AppText>
      </View>
      <Button
        label="Replay"
        compact
        onPress={() => {
          if (replayHistoryEntry(e)) router.push('/play');
        }}
      />
    </Card>
  );
}

export default function HistoryScreen() {
  const history = useHistory();
  return (
    <Screen title="History">
      {history.length === 0 ? (
        <Card>
          <AppText muted>Finished and unfinished games will appear here, newest first.</AppText>
        </Card>
      ) : (
        history.map((e) => <Entry key={e.id} e={e} />)
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  entry: { flexDirection: 'row', alignItems: 'center', gap: space.md, paddingVertical: space.md },
  badge: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  info: { flex: 1, gap: 2 },
});
