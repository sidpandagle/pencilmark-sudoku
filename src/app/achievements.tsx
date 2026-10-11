import { StyleSheet, View } from 'react-native';
import { ACHIEVEMENTS } from '../game';
import { useAchievements, useHistory, useStats } from '../state/hooks';
import { AppText, Card } from '../ui/components/primitives';
import { Screen } from '../ui/components/Screen';
import { Icon } from '../ui/icons/Icon';
import { useColors } from '../ui/ThemeContext';
import { space } from '../ui/theme';

export default function AchievementsScreen() {
  const c = useColors();
  const unlocked = useAchievements();
  const stats = useStats();
  const history = useHistory();
  const count = ACHIEVEMENTS.filter((a) => unlocked[a.id]).length;
  return (
    <Screen title="Achievements">
      <AppText muted>
        {count} of {ACHIEVEMENTS.length} unlocked
      </AppText>
      {ACHIEVEMENTS.map((a) => {
        const on = !!unlocked[a.id];
        const progress = !on && a.progress ? a.progress({ stats, history }) : null;
        return (
          <Card key={a.id} style={styles.item}>
            <View
              style={[styles.icon, { backgroundColor: on ? c.hintSoft : c.surfaceAlt, borderColor: on ? c.hint : c.line }]}
              accessibilityElementsHidden
              importantForAccessibility="no-hide-descendants"
            >
              <Icon name={on ? a.icon : 'lock'} size={24} color={on ? c.hint : c.inkMuted} />
            </View>
            <View
              style={styles.text}
              accessible
              accessibilityLabel={`${a.title}, ${on ? 'unlocked' : 'locked'}. ${a.description}${progress ? ` Progress ${progress[0]} of ${progress[1]}.` : ''}`}
            >
              <AppText variant="label" color={on ? c.ink : c.inkMuted}>
                {a.title}
              </AppText>
              <AppText variant="caption" muted>
                {a.description}
              </AppText>
              {progress ? (
                <View style={[styles.track, { backgroundColor: c.surfaceAlt }]}>
                  <View style={[styles.fill, { width: `${(progress[0] / progress[1]) * 100}%`, backgroundColor: c.accent }]} />
                </View>
              ) : null}
            </View>
          </Card>
        );
      })}
    </Screen>
  );
}

const styles = StyleSheet.create({
  item: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  icon: { width: 48, height: 48, borderRadius: 24, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  text: { flex: 1, gap: 2 },
  track: { height: 4, borderRadius: 2, marginTop: space.xs, overflow: 'hidden' },
  fill: { height: 4, borderRadius: 2 },
});
