import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Line, Path, Rect } from 'react-native-svg';
import { useColors, useTheme } from '../ThemeContext';

/** Brand mark: ink-blue rounded square, 3x3 grid, pencil-tip diagonal in the centre, three candidate dots. */
export function BrandMark({ size = 44 }: { size?: number }) {
  const { dark } = useTheme();
  const fg = '#FFFDF8';
  return (
    <Svg width={size} height={size} viewBox="0 0 48 48" accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <Rect x={0} y={0} width={48} height={48} rx={11} fill={dark ? '#2F5DA8' : '#1E2733'} />
      <Rect x={8} y={8} width={32} height={32} rx={3} fill="none" stroke={fg} strokeWidth={2} />
      <Line x1={18.7} y1={8} x2={18.7} y2={40} stroke={fg} strokeWidth={1.4} />
      <Line x1={29.3} y1={8} x2={29.3} y2={40} stroke={fg} strokeWidth={1.4} />
      <Line x1={8} y1={18.7} x2={40} y2={18.7} stroke={fg} strokeWidth={1.4} />
      <Line x1={8} y1={29.3} x2={40} y2={29.3} stroke={fg} strokeWidth={1.4} />
      <Path d="M21.5 26.5L26.5 21.5" stroke="#8DB2FF" strokeWidth={2.6} strokeLinecap="round" />
      <Path d="M21.5 26.5l-0.8 1.6 1.6-0.8z" fill="#8DB2FF" stroke="#8DB2FF" strokeWidth={1} strokeLinejoin="round" />
      <Circle cx={32} cy={11.5} r={1.3} fill={fg} />
      <Circle cx={35.5} cy={11.5} r={1.3} fill={fg} />
      <Circle cx={32} cy={15} r={1.3} fill={fg} />
    </Svg>
  );
}

/** "Pencilmark" wordmark; the dot of the i is a small accent square. */
export function Wordmark({ size = 28 }: { size?: number }) {
  const c = useColors();
  const text = { fontSize: size, fontWeight: '800' as const, color: c.ink, letterSpacing: -0.5 };
  return (
    <View style={styles.row} accessible accessibilityRole="header" accessibilityLabel="Pencilmark">
      <Text style={text} allowFontScaling={false}>
        Penc
      </Text>
      <View>
        <Text style={text} allowFontScaling={false}>
          ı
        </Text>
        <View
          style={{
            position: 'absolute',
            width: size * 0.2,
            height: size * 0.2,
            borderRadius: 1.5,
            backgroundColor: c.accent,
            top: size * 0.12,
            left: '50%',
            marginLeft: -size * 0.1,
          }}
        />
      </View>
      <Text style={text} allowFontScaling={false}>
        lmark
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({ row: { flexDirection: 'row', alignItems: 'flex-end' } });
