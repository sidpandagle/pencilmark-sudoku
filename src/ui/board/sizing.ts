/**
 * Board size rule from DESIGN.md: min(screenWidth - 24, availableHeight * 0.62, 560), floored to a
 * multiple of 9 so every cell is a whole number of dp (crisp lines).
 * In landscape the board takes the left side: min(availableHeight - 16, width * 0.55, 560).
 */
export function boardSizeFor(width: number, availableHeight: number, landscape: boolean): number {
  const raw = landscape
    ? Math.min(availableHeight - 16, width * 0.55, 560)
    : Math.min(width - 24, availableHeight * 0.62, 560);
  return Math.max(180, Math.floor(raw / 9) * 9);
}
