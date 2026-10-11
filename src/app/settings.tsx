import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { type PadLayout, type Settings, type ThemeSetting } from '../game';
import { resetStatistics, updateSettings } from '../state/actions';
import { useSettings } from '../state/hooks';
import { AppText, Button, Card, Divider, SectionTitle, Segmented, ToggleRow } from '../ui/components/primitives';
import { Screen } from '../ui/components/Screen';
import { ConfirmDialog } from '../ui/components/Sheet';
import { space } from '../ui/theme';

export default function SettingsScreen() {
  const s = useSettings();
  const [confirmReset, setConfirmReset] = useState(false);
  const [resetDone, setResetDone] = useState(false);
  const set = <K extends keyof Settings>(k: K) => (v: Settings[K]) => updateSettings({ [k]: v } as Partial<Settings>);

  return (
    <Screen title="Settings">
      <SectionTitle>Appearance</SectionTitle>
      <Card style={styles.card}>
        <AppText variant="label" muted style={{ marginBottom: space.sm }}>
          Theme
        </AppText>
        <Segmented<ThemeSetting>
          label="Theme"
          value={s.theme}
          onChange={set('theme')}
          options={[
            { value: 'system', label: 'System' },
            { value: 'light', label: 'Light' },
            { value: 'dark', label: 'Dark' },
          ]}
        />
        <ToggleRow label="High contrast" description="Stronger lines and deeper colours." value={s.highContrast} onChange={set('highContrast')} />
        <Divider />
        <AppText variant="label" muted style={{ marginVertical: space.sm }}>
          Number pad (portrait)
        </AppText>
        <Segmented<PadLayout>
          label="Number pad"
          value={s.padLayout}
          onChange={set('padLayout')}
          options={[
            { value: 'row', label: 'One row' },
            { value: 'grid', label: '3 × 3, larger keys' },
          ]}
        />
        <Divider />
        <ToggleRow label="Reduce motion" description="Turn off transitions. Your system setting is also respected." value={s.reduceMotion} onChange={set('reduceMotion')} />
      </Card>

      <SectionTitle>Highlights</SectionTitle>
      <Card style={styles.card}>
        <ToggleRow label="Row, column and box" description="Shade the selected cell’s row, column and box." value={s.highlightPeers} onChange={set('highlightPeers')} />
        <Divider />
        <ToggleRow label="Same digit" description="Shade cells and notes with the selected digit." value={s.highlightSameDigit} onChange={set('highlightSameDigit')} />
        <Divider />
        <ToggleRow label="Conflicts" description="Mark repeated digits in a row, column or box." value={s.highlightConflicts} onChange={set('highlightConflicts')} />
      </Card>

      <SectionTitle>Assistance</SectionTitle>
      <Card style={styles.card}>
        <ToggleRow label="Auto-check" description="Mark entries that don’t match the solution." value={s.autoCheck} onChange={set('autoCheck')} />
        <Divider />
        <ToggleRow label="Auto-remove notes" description="Placing a digit removes it from notes in the same row, column and box." value={s.autoRemoveNotes} onChange={set('autoRemoveNotes')} />
        <Divider />
        <ToggleRow label="Mistake counter" description="Count entries that don’t match the solution." value={s.mistakeCounter} onChange={set('mistakeCounter')} />
        {s.mistakeCounter ? (
          <View style={{ paddingBottom: space.sm }}>
            <AppText variant="label" muted style={{ marginBottom: space.sm }}>
              Mistake limit
            </AppText>
            <Segmented<number>
              label="Mistake limit"
              value={s.mistakeLimit}
              onChange={set('mistakeLimit')}
              options={[
                { value: 0, label: 'No limit' },
                { value: 1, label: 'Error-free' },
                { value: 3, label: '3' },
                { value: 5, label: '5' },
              ]}
            />
          </View>
        ) : null}
      </Card>

      <SectionTitle>Game</SectionTitle>
      <Card style={styles.card}>
        <ToggleRow label="Show timer" value={s.showTimer} onChange={set('showTimer')} />
        <Divider />
        <ToggleRow label="Haptics" description="Gentle vibration on input (on supported devices)." value={s.haptics} onChange={set('haptics')} />
        <Divider />
        <ToggleRow label="Sound effects" description="Soft taps and a chime when you finish. Never pauses your music." value={s.sound} onChange={set('sound')} />
        <Divider />
        <ToggleRow label="Keep screen awake" description="While a game is on screen." value={s.keepAwake} onChange={set('keepAwake')} />
      </Card>

      <SectionTitle>Data</SectionTitle>
      <Card style={styles.card}>
        <Button label={resetDone ? 'Statistics reset' : 'Reset statistics'} kind="danger" icon="eraseAll" onPress={() => setConfirmReset(true)} testID="reset-stats" />
        <AppText variant="caption" muted style={{ marginTop: space.sm }}>
          Clears statistics and streaks. History, achievements and your current game are kept.
        </AppText>
      </Card>

      <SectionTitle>About</SectionTitle>
      <Card style={styles.card}>
        <AppText variant="label">Pencilmark Sudoku</AppText>
        <AppText muted>Learn to see the logic.</AppText>
        <AppText style={{ marginTop: space.sm }}>
          No data leaves your device. There are no accounts, ads, analytics or network requests. Your games, settings and
          statistics are stored only on this device.
        </AppText>
      </Card>

      <ConfirmDialog
        visible={confirmReset}
        title="Reset statistics?"
        message="This clears all statistics and streaks. It can’t be undone."
        confirmLabel="Reset"
        destructive
        onCancel={() => setConfirmReset(false)}
        onConfirm={() => {
          resetStatistics();
          setConfirmReset(false);
          setResetDone(true);
        }}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({ card: { paddingVertical: space.sm } });
