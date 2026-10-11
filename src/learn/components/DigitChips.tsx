import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useColors } from '../../ui/ThemeContext';
import { MIN_TOUCH, radius, space } from '../../ui/theme';

export type ChipState = 'off' | 'on' | 'strike' | 'disabled';

/**
 * Large, accessible digit chips (48dp). Used to choose a digit for a placement, to toggle candidates of a
 * cell (the accessible alternative to tapping tiny candidate slots), and to fill candidates.
 */
export function DigitChips({
  digits = [1, 2, 3, 4, 5, 6, 7, 8, 9],
  state,
  onPress,
  labelFor,
  testIDPrefix = 'chip',
}: {
  digits?: number[];
  state: (d: number) => ChipState;
  onPress: (d: number) => void;
  labelFor: (d: number, s: ChipState) => string;
  testIDPrefix?: string;
}) {
  const c = useColors();
  return (
    <View style={styles.row} accessibilityRole="toolbar">
      {digits.map((d) => {
        const s = state(d);
        const on = s === 'on';
        const strike = s === 'strike';
        const disabled = s === 'disabled';
        return (
          <Pressable
            key={d}
            testID={`${testIDPrefix}-${d}`}
            accessibilityRole="button"
            accessibilityLabel={labelFor(d, s)}
            accessibilityState={{ selected: on || strike, disabled }}
            disabled={disabled}
            onPress={() => onPress(d)}
            style={({ pressed }) => [
              styles.chip,
              {
                backgroundColor: on ? c.accent : strike ? c.conflictSoft : c.surfaceAlt,
                borderColor: strike ? c.eliminate : on ? c.accent : c.line,
                opacity: disabled ? 0.35 : pressed ? 0.75 : 1,
              },
            ]}
          >
            <Text
              maxFontSizeMultiplier={1.3}
              style={[
                styles.text,
                { color: on ? c.onAccent : strike ? c.eliminate : c.ink, textDecorationLine: strike ? 'line-through' : 'none' },
              ]}
            >
              {d}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm, justifyContent: 'center' },
  chip: {
    minWidth: MIN_TOUCH,
    minHeight: MIN_TOUCH,
    borderRadius: radius.button,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: space.sm,
  },
  text: { fontSize: 20, fontWeight: '700', fontVariant: ['tabular-nums'] },
});
