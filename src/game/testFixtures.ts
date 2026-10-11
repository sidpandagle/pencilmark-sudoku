/** Shared test fixtures (not a test file). A classic puzzle with a unique solution. */
export const PUZZLE_STR = '530070000600195000098000060800060003400803001700020006060000280000419005000080079';
export const SOLUTION_STR = '534678912672195348198342567859761423426853791713924856961537284287419635345286179';
export const PUZZLE = PUZZLE_STR.split('').map(Number);
export const SOLUTION = SOLUTION_STR.split('').map(Number);
/** Indices of the empty cells in PUZZLE. */
export const EMPTY_CELLS = PUZZLE.map((v, i) => (v ? -1 : i)).filter((i) => i >= 0);
