import { memo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useColors } from '../ThemeContext';
import { MIN_TOUCH, radius } from '../theme';

export interface NumberPadProps {
  /** counts[d] = how many times digit d is on the board (index 1..9). */
  counts: readonly number[];
  notesMode?: boolean;
  /** Digit currently highlighted (selected cell's digit or digit-first highlight). */
  activeDigit?: number;
  onDigit: (digit: number) => void;
  /** 'row' = 9 keys in a row (portrait); 'grid' = 3x3 (landscape side panel). */
  layout?: 'row' | 'grid';
  /** Available width in dp. */
  width: number;
  /** Preferred key height (clamped to a touch-friendly range); default derives from the key width. */
  keyHeight?: number;
  disabled?: boolean;
}

function NumberPadImpl({ counts, notesMode, activeDigit = 0, onDigit, layout = 'row', width, keyHeight, disabled }: NumberPadProps) {
  const c = useColors();
  const gap = layout === 'row' ? 4 : 8;
  const perRow = layout === 'row' ? 9 : 3;
  const keyW = Math.floor((width - gap * (perRow - 1)) / perRow);
  const keyH =
    keyHeight !== undefined
      ? Math.max(MIN_TOUCH + 8, Math.min(80, Math.floor(keyHeight)))
      : layout === 'row'
        ? Math.max(MIN_TOUCH + 8, Math.min(72, keyW * 1.6))
        : Math.max(MIN_TOUCH, Math.min(72, keyW * 0.8));
  const digitSize = Math.min(30, Math.max(20, keyW * 0.6));

  return (
    <View
      accessibilityLabel={notesMode ? 'Number pad, notes mode' : 'Number pad'}
      style={[styles.pad, { width, gap, flexWrap: layout === 'grid' ? 'wrap' : 'nowrap' }]}
      testID="number-pad"
    >
      {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((d) => {
        const remaining = Math.max(0, 9 - (counts[d] ?? 0));
        const complete = remaining === 0;
        const active = activeDigit === d;
        const off = disabled || complete;
        return (
          <Pressable
            key={d}
            testID={`pad-${d}`}
            accessibilityRole="button"
            accessibilityLabel={`${notesMode ? 'Note ' : ''}${d}, ${complete ? 'all placed' : `${remaining} left`}`}
            accessibilityState={{ disabled: off }}
            disabled={off}
            onPress={() => onDigit(d)}
            style={({ pressed }) => [
              styles.key,
              {
                width: keyW,
                height: keyH,
                backgroundColor: active ? c.accentSoft : c.surface,
                borderColor: active ? c.accent : c.line,
                opacity: complete ? 0.35 : pressed ? 0.7 : 1,
              },
            ]}
          >
            <Text
              allowFontScaling={false}
              style={{
                color: notesMode ? c.inkMuted : c.accent,
                fontSize: notesMode ? digitSize * 0.72 : digitSize,
                fontWeight: notesMode ? '500' : '600',
                fontVariant: ['tabular-nums'],
                alignSelf: notesMode ? 'flex-start' : 'center',
                marginLeft: notesMode ? keyW * 0.18 : 0,
              }}
            >
              {d}
            </Text>
            <Text allowFontScaling={false} style={[styles.badge, { color: c.inkMuted }]}>
              {complete ? '✓' : remaining}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export const NumberPad = memo(NumberPadImpl);

const styles = StyleSheet.create({
  pad: { flexDirection: 'row', justifyContent: 'center' },
  key: { borderRadius: radius.button, borderWidth: 1, alignItems: 'center', justifyContent: 'center', gap: 0 },
  badge: { fontSize: 11, fontWeight: '600', fontVariant: ['tabular-nums'], marginTop: 1 },
});
