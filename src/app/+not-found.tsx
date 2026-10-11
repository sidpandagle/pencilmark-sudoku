import { router } from 'expo-router';
import { AppText, Button } from '../ui/components/primitives';
import { Screen } from '../ui/components/Screen';

export default function NotFound() {
  return (
    <Screen title="Not found">
      <AppText variant="heading">This page doesn’t exist.</AppText>
      <Button label="Go home" kind="primary" onPress={() => router.replace('/')} />
    </Screen>
  );
}
