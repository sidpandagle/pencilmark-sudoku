import { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { Step } from '../../engine';
import { useReducedMotion } from '../../state/hooks';
import { Board } from '../../ui/board';
import { AppText, Button } from '../../ui/components/primitives';
import { useColors } from '../../ui/ThemeContext';
import { radius, space } from '../../ui/theme';
import { phasesFor, phaseView } from '../phases';

const PHASE_TITLES = { units: 'Where to look', pattern: 'The pattern', effect: 'The deduction', result: 'After the step' } as const;
const PHASE_SHORT = { units: 'Where', pattern: 'Pattern', effect: 'Deduce', result: 'Result' } as const;

/**
 * Step-through demonstration of one engine step: units → pattern → effect → result. Numbered part tabs
 * (jump to any part), "Next part" and Replay. Replay auto-advances (unless reduce motion is on, in which
 * case it just restarts). The controls look different from the lesson's own Back/Next on purpose.
 */
export function StepDemo({
  grid,
  candidates,
  givens,
  step,
  patternCaption,
  size,
}: {
  grid: number[];
  candidates: number[];
  givens: boolean[];
  step: Step;
  patternCaption: string;
  size: number;
}) {
  const c = useColors();
  const reduced = useReducedMotion();
  const phases = useMemo(() => phasesFor(step), [step]);
  const [i, setI] = useState(0);
  const [playing, setPlaying] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const phase = phases[Math.min(i, phases.length - 1)];
  const view = useMemo(() => phaseView(grid, candidates, step, phase, patternCaption), [grid, candidates, step, phase, patternCaption]);

  useEffect(() => {
    if (!playing) return;
    if (i >= phases.length - 1) {
      setPlaying(false);
      return;
    }
    timer.current = setTimeout(() => setI((x) => x + 1), 1400);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [playing, i, phases.length]);

  const replay = () => {
    setI(0);
    setPlaying(!reduced);
  };

  return (
    <View style={styles.wrap} testID="step-demo">
      <View style={[styles.tabs, { backgroundColor: c.surfaceAlt }]} accessibilityRole="tablist" accessibilityLabel="Parts of the demonstration">
        {phases.map((p, k) => {
          const active = k === i;
          return (
            <Pressable
              key={p}
              testID={`demo-phase-${p}`}
              accessibilityRole="tab"
              accessibilityLabel={`Part ${k + 1} of ${phases.length}: ${PHASE_TITLES[p]}`}
              accessibilityState={{ selected: active }}
              onPress={() => { setPlaying(false); setI(k); }}
              style={[styles.tab, active && { backgroundColor: c.surface }, k < i && styles.tabDone]}
            >
              <Text maxFontSizeMultiplier={1.3} numberOfLines={1} style={[styles.tabText, { color: active ? c.ink : c.inkMuted }]}>
                {k + 1}. {PHASE_SHORT[p]}
              </Text>
            </Pressable>
          );
        })}
      </View>
      <View style={styles.center}>
        <Board values={view.values} givens={givens} candidates={view.candidates} overlay={view.overlay} readOnly size={size} highlights={{ peers: false, sameDigit: false }} testID="demo-board" />
      </View>
      <AppText accessibilityLiveRegion="polite" testID="demo-caption" style={styles.caption}>
        {view.caption}
      </AppText>
      <View style={styles.controls}>
        <Button label="Replay" icon="restart" compact onPress={replay} style={styles.flex} testID="demo-replay" />
        <Button
          label={i < phases.length - 1 ? 'Next part' : 'Shown in full'}
          icon={i < phases.length - 1 ? 'chevron' : 'check'}
          compact
          onPress={() => { setPlaying(false); setI((x) => Math.min(phases.length - 1, x + 1)); }}
          disabled={i >= phases.length - 1}
          style={styles.flex}
          testID="demo-next"
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: space.md },
  tabs: { flexDirection: 'row', borderRadius: radius.button, padding: 3, gap: 3 },
  tab: { flex: 1, minHeight: 44, alignItems: 'center', justifyContent: 'center', borderRadius: radius.button - 3, paddingHorizontal: 2 },
  tabDone: { opacity: 0.9 },
  tabText: { fontSize: 13, fontWeight: '600' },
  center: { alignItems: 'center' },
  caption: { minHeight: 44 },
  controls: { flexDirection: 'row', gap: space.sm },
  flex: { flex: 1 },
});
