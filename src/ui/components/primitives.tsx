import { memo, type ReactNode } from 'react';
import {
  Pressable,
  StyleSheet,
  Switch,
  Text,
  View,
  type PressableProps,
  type StyleProp,
  type TextProps,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import { Icon, type IconName } from '../icons/Icon';
import { useColors } from '../ThemeContext';
import { MIN_TOUCH, fontSize, radius, space } from '../theme';

type TextVariant = 'display' | 'title' | 'heading' | 'body' | 'label' | 'caption';
const VARIANT: Record<TextVariant, TextStyle> = {
  display: { fontSize: fontSize.xxl, fontWeight: '800', letterSpacing: -0.5 },
  title: { fontSize: fontSize.xl, fontWeight: '700' },
  heading: { fontSize: fontSize.lg, fontWeight: '600' },
  body: { fontSize: fontSize.md, lineHeight: 22 },
  label: { fontSize: fontSize.sm, fontWeight: '600' },
  caption: { fontSize: fontSize.xs, lineHeight: 16 },
};

export function AppText({
  variant = 'body',
  muted,
  color,
  style,
  ...rest
}: TextProps & { variant?: TextVariant; muted?: boolean; color?: string }) {
  const c = useColors();
  return (
    <Text
      {...rest}
      maxFontSizeMultiplier={rest.maxFontSizeMultiplier ?? 1.6}
      style={[VARIANT[variant], { color: color ?? (muted ? c.inkMuted : c.ink) }, style]}
    />
  );
}

type ButtonKind = 'primary' | 'secondary' | 'tertiary' | 'danger';

export interface ButtonProps extends Omit<PressableProps, 'style' | 'children'> {
  label: string;
  kind?: ButtonKind;
  icon?: IconName;
  style?: StyleProp<ViewStyle>;
  compact?: boolean;
}

export const Button = memo(function Button({ label, kind = 'secondary', icon, style, compact, disabled, ...rest }: ButtonProps) {
  const c = useColors();
  const bg = kind === 'primary' ? c.accent : kind === 'secondary' ? c.surfaceAlt : kind === 'danger' ? c.conflictSoft : 'transparent';
  const fg = kind === 'primary' ? c.onAccent : kind === 'danger' ? c.conflict : kind === 'tertiary' ? c.accent : c.ink;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: !!disabled }}
      disabled={disabled}
      {...rest}
      style={({ pressed }) => [
        styles.button,
        compact && styles.buttonCompact,
        { backgroundColor: bg, opacity: disabled ? 0.45 : pressed ? 0.8 : 1 },
        style,
      ]}
    >
      {icon ? <Icon name={icon} size={20} color={fg} /> : null}
      <Text style={[styles.buttonText, { color: fg }]} maxFontSizeMultiplier={1.4} numberOfLines={2}>
        {label}
      </Text>
    </Pressable>
  );
});

export const IconButton = memo(function IconButton({
  icon,
  label,
  onPress,
  color,
  size = 24,
  style,
  disabled,
  testID,
}: {
  icon: IconName;
  label: string;
  onPress?: () => void;
  color?: string;
  size?: number;
  style?: StyleProp<ViewStyle>;
  disabled?: boolean;
  testID?: string;
}) {
  const c = useColors();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: !!disabled }}
      disabled={disabled}
      onPress={onPress}
      testID={testID}
      hitSlop={4}
      style={({ pressed }) => [styles.iconButton, { opacity: disabled ? 0.4 : pressed ? 0.6 : 1 }, style]}
    >
      <Icon name={icon} size={size} color={color ?? c.ink} />
    </Pressable>
  );
});

export function Card({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  const c = useColors();
  return <View style={[styles.card, { backgroundColor: c.surface, shadowColor: '#1E2733' }, style]}>{children}</View>;
}

export function ToggleRow({
  label,
  description,
  value,
  onChange,
  disabled,
}: {
  label: string;
  description?: string;
  value: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
}) {
  const c = useColors();
  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityLabel={label}
      accessibilityHint={description}
      accessibilityState={{ checked: value, disabled: !!disabled }}
      disabled={disabled}
      onPress={() => onChange(!value)}
      style={[styles.row, { opacity: disabled ? 0.5 : 1 }]}
    >
      <View style={styles.rowText}>
        <AppText variant="body">{label}</AppText>
        {description ? (
          <AppText variant="caption" muted>
            {description}
          </AppText>
        ) : null}
      </View>
      <Switch
        value={value}
        onValueChange={onChange}
        disabled={disabled}
        trackColor={{ false: c.line, true: c.accent }}
        thumbColor={c.surface}
        // react-native-web only: colour of the thumb when on (defaults to teal otherwise).
        {...({ activeThumbColor: c.surface } as object)}
        // The whole row is the accessible control. react-native-web ignores the two native props below, so
        // the inner input is also labelled and aria-hidden to avoid an unnamed duplicate control on web.
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
        accessibilityLabel={label}
        aria-hidden
        focusable={false}
      />
    </Pressable>
  );
}

export function Segmented<T extends string | number>({
  options,
  value,
  onChange,
  label,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
  label: string;
}) {
  const c = useColors();
  return (
    <View accessibilityRole="radiogroup" accessibilityLabel={label} style={[styles.segmented, { backgroundColor: c.surfaceAlt }]}>
      {options.map((o) => {
        const active = o.value === value;
        return (
          <Pressable
            key={String(o.value)}
            accessibilityRole="radio"
            accessibilityLabel={`${label}: ${o.label}`}
            accessibilityState={{ checked: active }}
            onPress={() => onChange(o.value)}
            style={[styles.segment, active && { backgroundColor: c.surface, shadowColor: '#000' }, active && styles.segmentActive]}
          >
            <Text maxFontSizeMultiplier={1.4} style={[styles.segmentText, { color: active ? c.ink : c.inkMuted }]}>
              {o.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export function SectionTitle({ children }: { children: ReactNode }) {
  return (
    <AppText variant="label" muted style={styles.section} accessibilityRole="header">
      {children}
    </AppText>
  );
}

export function Divider() {
  const c = useColors();
  return <View style={{ height: StyleSheet.hairlineWidth, backgroundColor: c.line, marginVertical: space.xs }} />;
}

const styles = StyleSheet.create({
  button: {
    minHeight: MIN_TOUCH,
    borderRadius: radius.button,
    paddingHorizontal: space.lg,
    paddingVertical: space.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: space.sm,
  },
  buttonCompact: { paddingHorizontal: space.md },
  buttonText: { fontSize: fontSize.md, fontWeight: '600', textAlign: 'center', flexShrink: 1 },
  iconButton: { minWidth: MIN_TOUCH, minHeight: MIN_TOUCH, alignItems: 'center', justifyContent: 'center', borderRadius: radius.button },
  card: {
    borderRadius: radius.card,
    padding: space.lg,
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  row: { flexDirection: 'row', alignItems: 'center', minHeight: 56, paddingVertical: space.sm, gap: space.md },
  rowText: { flex: 1, gap: 2 },
  segmented: { flexDirection: 'row', borderRadius: radius.button, padding: 3, gap: 3 },
  segment: { flex: 1, minHeight: 42, alignItems: 'center', justifyContent: 'center', borderRadius: radius.button - 3, paddingHorizontal: space.sm },
  segmentActive: { shadowOpacity: 0.08, shadowRadius: 4, shadowOffset: { width: 0, height: 1 }, elevation: 1 },
  segmentText: { fontSize: fontSize.sm, fontWeight: '600' },
  section: { textTransform: 'uppercase', letterSpacing: 0.8, marginTop: space.xl, marginBottom: space.sm },
});
