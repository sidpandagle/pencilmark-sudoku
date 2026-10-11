import { router } from 'expo-router';
import type { ReactNode } from 'react';
import { ScrollView, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '../ThemeContext';
import { space } from '../theme';
import { AppText, IconButton } from './primitives';

/** Return to the home screen without stacking a second copy of it. */
export function goHome() {
  if (router.canDismiss()) router.dismissAll();
  else router.replace('/');
}

export function goBack() {
  if (router.canGoBack()) router.back();
  else router.replace('/');
}

export function ScreenHeader({ title, right, onBack }: { title?: string; right?: ReactNode; onBack?: () => void }) {
  const c = useColors();
  return (
    <View style={styles.header}>
      <IconButton icon="back" label="Back" onPress={onBack ?? goBack} color={c.ink} testID="back" />
      <AppText variant="heading" accessibilityRole="header" numberOfLines={1} style={styles.headerTitle}>
        {title ?? ''}
      </AppText>
      <View style={styles.headerRight}>{right}</View>
    </View>
  );
}

/** Standard non-game screen: safe areas, header with back, scrollable centered column. */
export function Screen({
  title,
  children,
  scroll = true,
  right,
  contentStyle,
  showHeader = true,
}: {
  title?: string;
  children: ReactNode;
  scroll?: boolean;
  right?: ReactNode;
  contentStyle?: StyleProp<ViewStyle>;
  showHeader?: boolean;
}) {
  const c = useColors();
  const insets = useSafeAreaInsets();
  const body = <View style={[styles.column, contentStyle]}>{children}</View>;
  return (
    <View style={[styles.root, { backgroundColor: c.bg, paddingTop: insets.top, paddingLeft: insets.left, paddingRight: insets.right }]}>
      {showHeader ? (
        <View style={styles.headerWrap}>
          <ScreenHeader title={title} right={right} />
        </View>
      ) : null}
      {scroll ? (
        <ScrollView
          style={styles.flex}
          contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + space.xxl }]}
          keyboardShouldPersistTaps="handled"
        >
          {body}
        </ScrollView>
      ) : (
        <View style={[styles.flex, { paddingBottom: insets.bottom }]}>{body}</View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  flex: { flex: 1 },
  headerWrap: { width: '100%', maxWidth: 720, alignSelf: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: space.xs, minHeight: 56 },
  headerTitle: { flex: 1, marginHorizontal: space.xs },
  headerRight: { minWidth: 48, alignItems: 'flex-end', flexDirection: 'row', justifyContent: 'flex-end' },
  scrollContent: { flexGrow: 1 },
  column: { width: '100%', maxWidth: 640, alignSelf: 'center', paddingHorizontal: space.lg, gap: space.md },
});
