import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { randomSeed, techniqueName, type TechniqueId } from '../../engine';
import { hasProgress } from '../../game';
import { startGame } from '../../state/actions';
import { gameStore } from '../../state/stores';
import { AppText, Button } from '../../ui/components/primitives';
import { ConfirmDialog } from '../../ui/components/Sheet';
import { useColors } from '../../ui/ThemeContext';
import { space } from '../../ui/theme';
import { hasPracticePuzzles, practicePuzzleFor, type PracticeChoice } from '../practice';

/**
 * "Try it in a puzzle": starts a practice game whose hardest technique is `technique`. Asks before replacing
 * an unfinished game (it is kept in history). When no practice puzzle exists, says so honestly and offers a
 * similar-difficulty puzzle instead.
 */
export function PracticeLauncher({ technique, variant, compact }: { technique: TechniqueId; variant: number; compact?: boolean }) {
  const c = useColors();
  const [pending, setPending] = useState<PracticeChoice | null>(null);
  const [error, setError] = useState('');
  const exact = hasPracticePuzzles(technique);
  const name = techniqueName(technique);

  const launch = (choice: PracticeChoice) => {
    startGame({ puzzle: choice.puzzle, solution: choice.solution, difficulty: choice.difficulty, source: 'practice' });
    router.push('/play');
  };

  const begin = () => {
    const choice = practicePuzzleFor(technique, variant, randomSeed());
    if (!choice) {
      setError('Could not prepare a practice puzzle. Please try again.');
      return;
    }
    const cur = gameStore.get();
    if (cur && cur.status !== 'completed' && hasProgress(cur)) setPending(choice);
    else launch(choice);
  };

  return (
    <View style={styles.wrap}>
      {exact ? null : (
        <AppText muted testID="practice-none">
          Pencilmark has no puzzle where a {name} is the hardest step: such puzzles are very rare, because an easier
          technique almost always does the same job first. You can still play a puzzle of similar difficulty, which
          may not need a {name} at all.
        </AppText>
      )}
      <Button
        label={exact ? 'Try it in a puzzle' : 'Play a similar puzzle anyway'}
        kind={exact ? 'primary' : 'secondary'}
        icon="play"
        compact={compact}
        onPress={begin}
        testID="practice-start"
      />
      {error ? <AppText color={c.conflict}>{error}</AppText> : null}
      <ConfirmDialog
        visible={!!pending}
        title="Start a practice puzzle?"
        message="Your current game will be replaced. It is saved in your history."
        confirmLabel="Start"
        onCancel={() => setPending(null)}
        onConfirm={() => {
          const p = pending;
          setPending(null);
          if (p) launch(p);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: space.sm },
});
