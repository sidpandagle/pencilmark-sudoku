/** Review cycle 6: worst-case analyzePuzzle timing on notoriously hard puzzles. Run: bun scripts/review-bench-import.ts */
import { analyzePuzzle, parseGrid } from '../src/engine';

const HARD: Record<string, string> = {
  'AI Escargot': '1....7.9..3..2...8..96..5....53..9...1..8...26....4...3......1..4......7..7...3..',
  'Easter Monster': '1.......2.9.4...5...6...7...5.9.3.......7.......85..4.7.....6...3...9.8...2.....1',
  'Golden Nugget': '.......39.....1..5..3.5.8....8.9...6.7...2..1..4.......9.8..5..2....6..4..7.....',
  'Platinum Blonde': '.......12........3..23..4....1....5..1.....6..7....8......2..1...3.4....5.6......',
  'Arto Inkala 2012': '8..........36......7..9.2...5...7.......457.....1...3...1....68..85...1..9....4..',
  '17-clue': '000000010400000000020000000000050407008000300001090000300400200050100000000806000',
};

for (const [name, text] of Object.entries(HARD)) {
  const t = performance.now();
  let g: number[];
  try { g = parseGrid(text); } catch { console.log(name, "bad fixture string"); continue; }
  const a = analyzePuzzle(g);
  const ms = performance.now() - t;
  console.log(
    `${name.padEnd(18)} ${a.status.padEnd(8)} ${String(a.difficulty ?? (a.beyondTechniques ? 'beyond' : '-')).padEnd(7)} ${String(a.hardestTechnique ?? '').padEnd(16)} ${ms.toFixed(0)} ms`,
  );
}
