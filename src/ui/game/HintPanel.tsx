import { ScrollView, StyleSheet, View } from 'react-native';
import { cellName, type Hint } from '../../engine';
import { hintTechniqueName } from '../../game';
import { Icon } from '../icons/Icon';
import { AppText, Button, IconButton } from '../components/primitives';
import { useColors } from '../ThemeContext';
import { radius, space } from '../theme';

/** Progressive hint levels for a logical step. */
export const STEP_LEVELS = ['nudge', 'technique', 'where', 'explain'] as const;

export interface HintPanelProps {
  hint: Hint;
  /** Index into STEP_LEVELS for step hints. */
  level: number;
  revealCell: number;
  onNext: () => void;
  onApply: () => void;
  onFix: () => void;
  onReveal: () => void;
  onClose: () => void;
  width: number;
  /** Height cap: the text scrolls so the title and actions always stay visible (small screens). */
  maxHeight?: number;
  /** Optional: open the lesson for the hint's technique (shown after "Explain"). */
  onLearn?: () => void;
}

function listCells(cells: readonly number[]) {
  const names = cells.slice(0, 6).map(cellName);
  return cells.length > 6 ? `${names.join(', ')} and ${cells.length - 6} more` : names.join(', ');
}

export function HintPanel({ hint, level, revealCell, onNext, onApply, onFix, onReveal, onClose, width, maxHeight, onLearn }: HintPanelProps) {
  const c = useColors();
  let title = 'Hint';
  let body: string[] = [];
  let actions: React.ReactNode = null;

  if (hint.kind === 'step') {
    const name = hintTechniqueName(hint);
    title = level >= 1 ? name : 'A gentle nudge';
    body = [hint.nudge || 'There is a logical next step. Look at the highlighted area.'];
    if (level >= 2) body.push('The highlighted cells form the pattern.');
    if (level >= 3) body = [hint.step.explanation || hint.nudge];
    const nextLabel = level === 0 ? 'Show technique' : level === 1 ? 'Show where' : level === 2 ? 'Explain' : null;
    actions = (
      <>
        {nextLabel ? <Button label={nextLabel} kind={level >= 2 ? 'secondary' : 'primary'} onPress={onNext} style={styles.action} testID="hint-next" /> : null}
        {level >= 3 && onLearn ? (
          <Button label="Lesson" accessibilityLabel={`Learn ${name}`} kind="secondary" icon="book" onPress={onLearn} style={styles.action} testID="hint-learn" />
        ) : null}
        {level >= 2 ? <Button label="Apply" kind={level >= 3 ? 'primary' : 'secondary'} icon="check" onPress={onApply} style={styles.action} testID="hint-apply" /> : null}
      </>
    );
  } else if (hint.kind === 'mistake') {
    title = 'A small detour';
    body = [
      `${hint.cells.length === 1 ? 'One entry doesn’t' : `${hint.cells.length} entries don’t`} match the solution (${listCells(hint.cells)}).`,
      'It happens to everyone. Clear them and the logic will flow again.',
    ];
    actions = <Button label={hint.cells.length === 1 ? 'Clear it' : 'Clear them'} kind="primary" onPress={onFix} style={styles.action} testID="hint-fix" />;
  } else if (hint.kind === 'bad-notes') {
    title = 'Check these notes';
    body = [
      `Some notes are missing the digit that belongs there (${listCells(hint.cells)}).`,
      'Fixing them adds the missing digit back; your other notes stay as they are.',
    ];
    actions = <Button label="Fix notes" kind="primary" onPress={onFix} style={styles.action} testID="hint-fix" />;
  } else {
    title = 'Beyond my explanations';
    body = [
      'This position needs a technique I can’t explain yet.',
      revealCell >= 0 ? `I can reveal one cell (${cellName(revealCell)}) from the solution so you can keep going.` : '',
    ].filter(Boolean);
    actions = revealCell >= 0 ? <Button label="Reveal a cell" kind="primary" onPress={onReveal} style={styles.action} testID="hint-reveal" /> : null;
  }

  return (
    <View
      testID="hint-panel"
      accessibilityLiveRegion="polite"
      style={[styles.panel, { width, maxHeight, backgroundColor: c.surface, borderColor: c.line }]}
    >
      <View style={styles.header}>
        <Icon name="bulb" size={22} color={c.hint} />
        <AppText variant="heading" accessibilityRole="header" style={styles.title} numberOfLines={2}>
          {title}
        </AppText>
        <IconButton icon="close" label="Close hint" onPress={onClose} testID="hint-close" />
      </View>
      {hint.kind === 'step' ? (
        <View style={styles.dots} accessibilityLabel={`Hint level ${level + 1} of 4`}>
          {STEP_LEVELS.map((l, i) => (
            <View key={l} style={[styles.dot, { backgroundColor: i <= level ? c.hint : c.line }]} />
          ))}
        </View>
      ) : null}
      <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent} bounces={false}>
        {body.map((t, i) => (
          <AppText key={i} muted={i > 0} testID={i === 0 ? 'hint-text' : undefined}>
            {t}
          </AppText>
        ))}
      </ScrollView>
      <View style={styles.actions}>{actions}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  panel: { borderRadius: radius.sheet, borderWidth: StyleSheet.hairlineWidth, padding: space.lg, gap: space.sm },
  header: { flexDirection: 'row', alignItems: 'center', gap: space.sm, marginTop: -space.sm, marginRight: -space.sm },
  title: { flex: 1 },
  dots: { flexDirection: 'row', gap: 6 },
  dot: { width: 22, height: 4, borderRadius: 2 },
  // Never collapse the text completely: at least ~2 lines stay visible, the rest scrolls.
  body: { flexGrow: 0, flexShrink: 1, flexBasis: 'auto', minHeight: 44 },
  bodyContent: { gap: space.sm },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm, marginTop: space.sm },
  action: { flexGrow: 1 },
});
