import { StyleSheet, View } from 'react-native';
import { AppText, Card, SectionTitle } from '../ui/components/primitives';
import { Screen } from '../ui/components/Screen';
import { useColors } from '../ui/ThemeContext';
import { radius, space } from '../ui/theme';

const SHORTCUTS: [string, string][] = [
  ['1–9', 'Enter a digit'],
  ['Shift + 1–9', 'Toggle a note'],
  ['N', 'Notes mode on/off'],
  ['Arrows / W A S D', 'Move the selection'],
  ['Backspace, Delete, 0', 'Erase'],
  ['Ctrl/Cmd + Z', 'Undo'],
  ['Ctrl + Y, Ctrl/Cmd + Shift + Z', 'Redo'],
  ['H', 'Hint'],
  ['P, Esc', 'Pause / resume'],
];

export default function HelpScreen() {
  const c = useColors();
  return (
    <Screen title="How to play">
      <Card style={styles.card}>
        <AppText variant="heading">The rule</AppText>
        <AppText>
          Fill the grid so every row, every column and every 3×3 box contains the digits 1 to 9 exactly once. Every puzzle
          has one solution that can be reached by logic.
        </AppText>
      </Card>

      <SectionTitle>Playing</SectionTitle>
      <Card style={styles.card}>
        <AppText>• Tap a cell, then tap a digit. Givens (dark digits) can’t be changed.</AppText>
        <AppText>• Turn on Notes to pencil in candidates instead of answers.</AppText>
        <AppText>• Tap a digit with no cell selected to highlight where it already sits.</AppText>
        <AppText>• Undo and redo cover every change, notes included.</AppText>
        <AppText>• The game saves itself. Leave any time and continue later.</AppText>
      </Card>

      <SectionTitle>Hints</SectionTitle>
      <Card style={styles.card}>
        <AppText>
          Hints come in steps: a gentle nudge, then the technique’s name, then where to look, then a full explanation. You
          can apply the step when you’re ready. If an entry is wrong, the hint will say so kindly and offer to clear it.
        </AppText>
      </Card>

      <SectionTitle>Reading the board</SectionTitle>
      <Card style={styles.card}>
        <AppText>• Repeated digits are shown in red with an underline.</AppText>
        <AppText>• With Auto-check on, wrong entries get a small corner flag.</AppText>
        <AppText>• Hint patterns are outlined in amber; removed candidates are struck through; placements are green.</AppText>
      </Card>

      <SectionTitle>Keyboard</SectionTitle>
      <Card style={styles.card}>
        {SHORTCUTS.map(([k, v]) => (
          <View key={k} style={styles.shortcut}>
            <View style={[styles.kbd, { backgroundColor: c.surfaceAlt, borderColor: c.line }]}>
              <AppText variant="caption" style={{ fontWeight: '700' }}>
                {k}
              </AppText>
            </View>
            <AppText style={{ flex: 1 }}>{v}</AppText>
          </View>
        ))}
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: { gap: space.sm },
  shortcut: { flexDirection: 'row', alignItems: 'center', gap: space.md, minHeight: 32 },
  kbd: { borderWidth: 1, borderRadius: radius.chip, paddingHorizontal: space.sm, paddingVertical: 2, minWidth: 120 },
});
