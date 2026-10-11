import { createAudioPlayer, setAudioModeAsync, type AudioPlayer } from 'expo-audio';
import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';
import { settingsStore } from './stores';

type Kind = 'select' | 'place' | 'erase' | 'error' | 'success';

const SOUNDS: Record<Kind, number> = {
  select: require('../../assets/sounds/tap.wav'),
  place: require('../../assets/sounds/place.wav'),
  erase: require('../../assets/sounds/erase.wav'),
  error: require('../../assets/sounds/error.wav'),
  success: require('../../assets/sounds/complete.wav'),
};

const players: Partial<Record<Kind, AudioPlayer>> = {};
let audioModeSet = false;

function playSound(kind: Kind) {
  try {
    if (!audioModeSet) {
      audioModeSet = true;
      // Sound effects must never pause the player's music or podcast.
      setAudioModeAsync({ playsInSilentMode: false, interruptionMode: 'mixWithOthers' }).catch(() => {});
    }
    let p = players[kind];
    if (!p) {
      p = createAudioPlayer(SOUNDS[kind]);
      players[kind] = p;
    }
    const player = p;
    Promise.resolve(player.seekTo(0))
      .catch(() => {})
      .then(() => player.play());
  } catch {
    // audio unavailable: stay silent
  }
}

function playHaptic(kind: Kind) {
  try {
    const p =
      kind === 'select' || kind === 'erase'
        ? Haptics.selectionAsync()
        : kind === 'place'
          ? Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
          : kind === 'error'
            ? Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning)
            : Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    p?.catch?.(() => {});
  } catch {
    // device without haptics
  }
}

/**
 * Fire-and-forget feedback, honouring the Haptics and Sound settings. Never throws.
 * Haptics are skipped on web; sound works everywhere it is supported.
 */
export function feedback(kind: Kind) {
  const s = settingsStore.get();
  if (s.sound) playSound(kind);
  if (s.haptics && Platform.OS !== 'web') playHaptic(kind);
}
