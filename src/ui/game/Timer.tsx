import { memo } from 'react';
import { StyleSheet, Text } from 'react-native';
import { formatTime, spokenTime } from '../../game';
import { useGame, useSetting } from '../../state/hooks';
import { useColors } from '../ThemeContext';

/** Subscribes only to elapsedMs, so ticking never re-renders the board. */
export const Timer = memo(function Timer() {
  const c = useColors();
  const show = useSetting('showTimer');
  const ms = useGame((g) => Math.floor(g.elapsedMs / 1000) * 1000, 0);
  if (!show) return null;
  return (
    <Text
      testID="timer"
      accessibilityLabel={`Time ${spokenTime(ms)}`}
      maxFontSizeMultiplier={1.3}
      style={[styles.t, { color: c.inkMuted }]}
    >
      {formatTime(ms)}
    </Text>
  );
});

const styles = StyleSheet.create({ t: { fontSize: 16, fontWeight: '600', fontVariant: ['tabular-nums'], minWidth: 48, textAlign: 'center' } });
