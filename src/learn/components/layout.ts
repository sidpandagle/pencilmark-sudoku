import { useWindowDimensions } from 'react-native';

/** Board size for learning screens: fits the column width (16dp gutters), capped, a multiple of 9. */
export function useLessonBoardSize(max = 432, ratio = 1): number {
  const { width, height } = useWindowDimensions();
  const byWidth = Math.min(width, 640) - 32;
  const byHeight = height * 0.52;
  const raw = Math.min(byWidth, byHeight, max) * ratio;
  return Math.max(198, Math.floor(raw / 9) * 9);
}
