import type { ReactNode } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useReducedMotion } from '../../state/hooks';
import { useColors } from '../ThemeContext';
import { radius, space } from '../theme';
import { AppText, Button } from './primitives';

/** Bottom sheet built on RN Modal (works on native and web). Tapping the scrim closes it. */
export function Sheet({
  visible,
  onClose,
  title,
  children,
  testID,
}: {
  visible: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  testID?: string;
}) {
  const c = useColors();
  const insets = useSafeAreaInsets();
  const reduced = useReducedMotion();
  return (
    <Modal visible={visible} transparent animationType={reduced ? 'none' : 'fade'} onRequestClose={onClose} statusBarTranslucent>
      <View style={styles.root}>
        <Pressable accessibilityLabel="Close" accessibilityRole="button" style={[StyleSheet.absoluteFill, { backgroundColor: c.scrim }]} onPress={onClose} />
        <View
          testID={testID}
          accessibilityViewIsModal
          style={[styles.sheet, { backgroundColor: c.surface, paddingBottom: Math.max(insets.bottom, space.lg) }]}
        >
          <View style={[styles.grabber, { backgroundColor: c.line }]} />
          {title ? (
            <AppText variant="heading" accessibilityRole="header" style={styles.title}>
              {title}
            </AppText>
          ) : null}
          <ScrollView bounces={false} contentContainerStyle={styles.content}>
            {children}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

/** Centered confirmation dialog. */
export function ConfirmDialog({
  visible,
  title,
  message,
  confirmLabel,
  cancelLabel = 'Cancel',
  destructive,
  onConfirm,
  onCancel,
}: {
  visible: boolean;
  title: string;
  message?: string;
  confirmLabel: string;
  cancelLabel?: string;
  destructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const c = useColors();
  const reduced = useReducedMotion();
  return (
    <Modal visible={visible} transparent animationType={reduced ? 'none' : 'fade'} onRequestClose={onCancel} statusBarTranslucent>
      <View style={styles.center}>
        <Pressable accessibilityLabel={cancelLabel} style={[StyleSheet.absoluteFill, { backgroundColor: c.scrim }]} onPress={onCancel} />
        <View accessibilityViewIsModal style={[styles.dialog, { backgroundColor: c.surface }]}>
          <AppText variant="heading" accessibilityRole="header">
            {title}
          </AppText>
          {message ? (
            <AppText muted style={{ marginTop: space.sm }}>
              {message}
            </AppText>
          ) : null}
          <View style={styles.dialogButtons}>
            <Button label={cancelLabel} kind="secondary" onPress={onCancel} style={styles.flex} />
            <Button label={confirmLabel} kind={destructive ? 'danger' : 'primary'} onPress={onConfirm} style={styles.flex} />
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, justifyContent: 'flex-end' },
  sheet: {
    borderTopLeftRadius: radius.sheet,
    borderTopRightRadius: radius.sheet,
    paddingHorizontal: space.lg,
    paddingTop: space.sm,
    maxHeight: '88%',
    width: '100%',
    maxWidth: 640,
    alignSelf: 'center',
  },
  grabber: { width: 40, height: 4, borderRadius: 2, alignSelf: 'center', marginBottom: space.md },
  title: { marginBottom: space.md },
  content: { gap: space.sm, paddingBottom: space.sm },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: space.xl },
  dialog: { width: '100%', maxWidth: 420, borderRadius: radius.sheet, padding: space.xl },
  dialogButtons: { flexDirection: 'row', gap: space.md, marginTop: space.xl },
  flex: { flex: 1 },
});
