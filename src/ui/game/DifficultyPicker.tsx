import { Pressable, StyleSheet, View } from 'react-native';
import { DIFFICULTIES, type Difficulty } from '../../engine';
import { DIFFICULTY_DESCRIPTION, DIFFICULTY_LABEL } from '../../game';
import { Icon } from '../icons/Icon';
import { AppText } from '../components/primitives';
import { Sheet } from '../components/Sheet';
import { useColors } from '../ThemeContext';
import { radius, space } from '../theme';

const LEVEL_BARS: Record<Difficulty, number> = { easy: 1, medium: 2, hard: 3, expert: 4 };

export function DifficultyPicker({
  visible,
  onClose,
  onPick,
  replacingGame,
}: {
  visible: boolean;
  onClose: () => void;
  onPick: (d: Difficulty) => void;
  replacingGame?: boolean;
}) {
  const c = useColors();
  return (
    <Sheet visible={visible} onClose={onClose} title="New game" testID="difficulty-sheet">
      {replacingGame ? (
        <AppText variant="caption" muted style={{ marginBottom: space.xs }}>
          Your game in progress will be saved to History.
        </AppText>
      ) : null}
      {DIFFICULTIES.map((d) => (
        <Pressable
          key={d}
          testID={`difficulty-${d}`}
          accessibilityRole="button"
          accessibilityLabel={`${DIFFICULTY_LABEL[d]}. ${DIFFICULTY_DESCRIPTION[d]}`}
          onPress={() => onPick(d)}
          style={({ pressed }) => [styles.option, { backgroundColor: c.bg, opacity: pressed ? 0.75 : 1 }]}
        >
          <View style={styles.bars}>
            {[1, 2, 3, 4].map((n) => (
              <View key={n} style={[styles.bar, { height: 6 + n * 4, backgroundColor: n <= LEVEL_BARS[d] ? c.accent : c.line }]} />
            ))}
          </View>
          <View style={styles.text}>
            <AppText variant="heading">{DIFFICULTY_LABEL[d]}</AppText>
            <AppText variant="caption" muted>
              {DIFFICULTY_DESCRIPTION[d]}
            </AppText>
          </View>
          <Icon name="chevron" size={20} color={c.inkMuted} />
        </Pressable>
      ))}
    </Sheet>
  );
}

const styles = StyleSheet.create({
  option: { flexDirection: 'row', alignItems: 'center', gap: space.md, padding: space.md, borderRadius: radius.button, minHeight: 64 },
  bars: { flexDirection: 'row', alignItems: 'flex-end', gap: 3, width: 30 },
  bar: { width: 5, borderRadius: 2 },
  text: { flex: 1, gap: 2 },
});
