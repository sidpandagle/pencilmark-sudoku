import { memo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Icon, type IconName } from '../icons/Icon';
import { useColors } from '../ThemeContext';
import { MIN_TOUCH, radius } from '../theme';

export interface ToolbarProps {
  canUndo: boolean;
  canRedo: boolean;
  notesMode: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onErase: () => void;
  onToggleNotes: () => void;
  onHint: () => void;
  width: number;
  disabled?: boolean;
}

function Tool({
  icon,
  label,
  a11y,
  onPress,
  disabled,
  active,
  testID,
  width,
  badge,
}: {
  icon: IconName;
  label: string;
  a11y: string;
  onPress: () => void;
  disabled?: boolean;
  active?: boolean;
  testID: string;
  width: number;
  badge?: string;
}) {
  const c = useColors();
  const fg = active ? c.onAccent : c.ink;
  return (
    <Pressable
      testID={testID}
      accessibilityRole={active === undefined ? 'button' : 'switch'}
      accessibilityLabel={a11y}
      accessibilityState={active === undefined ? { disabled: !!disabled } : { checked: active, disabled: !!disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.tool,
        { width, backgroundColor: active ? c.accent : 'transparent', opacity: disabled ? 0.35 : pressed ? 0.6 : 1 },
      ]}
    >
      <Icon name={icon} size={24} color={fg} />
      <Text allowFontScaling={false} numberOfLines={1} style={[styles.label, { color: fg }]}>
        {label}
      </Text>
      {badge ? (
        <View style={[styles.badge, { backgroundColor: active ? c.onAccent : c.surfaceAlt }]}>
          <Text allowFontScaling={false} style={[styles.badgeText, { color: active ? c.accent : c.inkMuted }]}>
            {badge}
          </Text>
        </View>
      ) : null}
    </Pressable>
  );
}

function ToolbarImpl(p: ToolbarProps) {
  const w = Math.floor(p.width / 5);
  return (
    <View style={[styles.bar, { width: p.width }]} testID="toolbar">
      <Tool icon="undo" label="Undo" a11y="Undo" testID="tool-undo" onPress={p.onUndo} disabled={p.disabled || !p.canUndo} width={w} />
      <Tool icon="redo" label="Redo" a11y="Redo" testID="tool-redo" onPress={p.onRedo} disabled={p.disabled || !p.canRedo} width={w} />
      <Tool icon="erase" label="Erase" a11y="Erase" testID="tool-erase" onPress={p.onErase} disabled={p.disabled} width={w} />
      <Tool
        icon="pencil"
        label="Notes"
        a11y={`Notes mode ${p.notesMode ? 'on' : 'off'}`}
        testID="tool-notes"
        onPress={p.onToggleNotes}
        disabled={p.disabled}
        active={p.notesMode}
        badge={p.notesMode ? 'ON' : 'OFF'}
        width={w}
      />
      <Tool icon="bulb" label="Hint" a11y="Hint" testID="tool-hint" onPress={p.onHint} disabled={p.disabled} width={w} />
    </View>
  );
}

export const Toolbar = memo(ToolbarImpl);

const styles = StyleSheet.create({
  bar: { flexDirection: 'row', justifyContent: 'space-between' },
  tool: { minHeight: MIN_TOUCH + 12, alignItems: 'center', justifyContent: 'center', borderRadius: radius.button, paddingVertical: 4, gap: 2 },
  label: { fontSize: 12, fontWeight: '600' },
  badge: { position: 'absolute', top: 2, right: 6, paddingHorizontal: 4, borderRadius: 6 },
  badgeText: { fontSize: 9, fontWeight: '800', letterSpacing: 0.3 },
});
