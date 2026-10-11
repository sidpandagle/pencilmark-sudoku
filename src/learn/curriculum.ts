import { techniqueInfo, type TechniqueId } from '../engine';
import { LEVEL1_FOUNDATIONS, LEVEL1_TECHNIQUES } from './content/level1';
import { LEVEL2_FOUNDATIONS, LEVEL2_TECHNIQUES } from './content/level2';
import { LEVEL3_FOUNDATIONS, LEVEL3_TECHNIQUES } from './content/level3';
import { LEVEL4_TECHNIQUES } from './content/level4';
import { EXTRA_CARDS, LEVEL5_TECHNIQUES } from './content/level5';
import type { FoundationContent, Lesson, LevelId, LevelInfo, TechniqueContent } from './types';

export const LEVELS: readonly LevelInfo[] = [
  { id: 1, title: 'Level 1 · First steps', blurb: 'The rules, scanning, candidates and the three singles.' },
  { id: 2, title: 'Level 2 · Beginner', blurb: 'Keep notes tidy, then use intersections, pairs and triples.' },
  { id: 3, title: 'Level 3 · Intermediate', blurb: 'Fish, wings, colouring and your first chains.' },
  { id: 4, title: 'Level 4 · Advanced', blurb: 'Finned fish, uniqueness, longer chains and almost locked sets.' },
  { id: 5, title: 'Level 5 · Expert', blurb: 'Sue de Coq and forcing chains, the last resort.' },
];

/**
 * Lesson order inside each level (the map shows them in this order). Technique lessons use the engine
 * technique id as lesson id.
 */
const ORDER: Record<LevelId, string[]> = {
  1: ['rules', 'givens', 'scanning', 'full-house', 'hidden-single', 'candidates', 'naked-single', 'contradictions', 'logic-vs-guessing'],
  2: ['systematic-scanning', 'candidate-management', 'pointing', 'box-line-reduction', 'naked-pair', 'hidden-pair', 'naked-triple', 'hidden-triple'],
  3: ['x-wing', 'chains-intro', 'skyscraper', 'two-string-kite', 'simple-coloring', 'swordfish', 'xy-wing', 'xyz-wing', 'naked-quad', 'hidden-quad'],
  4: [
    'turbot-fish',
    'finned-x-wing',
    'finned-swordfish',
    'jellyfish',
    'w-wing',
    'unique-rectangle-1',
    'unique-rectangle-2',
    'unique-rectangle-4',
    'bug-plus-one',
    'x-chain',
    'xy-chain',
    'aic',
    'als-xz',
  ],
  5: ['sue-de-coq', 'forcing-chain'],
};

/**
 * Foundation prerequisites added on top of the engine catalog's technique prerequisites, so the
 * foundation lessons sit naturally on the path.
 */
const EXTRA_PREREQS: Partial<Record<TechniqueId, string[]>> = {
  'full-house': ['scanning'],
  'naked-single': ['candidates'],
  pointing: ['candidate-management'],
  skyscraper: ['chains-intro'],
  'two-string-kite': ['chains-intro'],
  'simple-coloring': ['chains-intro'],
};

const FOUNDATIONS: FoundationContent[] = [...LEVEL1_FOUNDATIONS, ...LEVEL2_FOUNDATIONS, ...LEVEL3_FOUNDATIONS];
const TECHNIQUE_CONTENT: TechniqueContent[] = [
  ...LEVEL1_TECHNIQUES,
  ...LEVEL2_TECHNIQUES,
  ...LEVEL3_TECHNIQUES,
  ...LEVEL4_TECHNIQUES,
  ...LEVEL5_TECHNIQUES,
];

function buildLessons(): Lesson[] {
  const foundationById = new Map(FOUNDATIONS.map((f) => [f.id, f]));
  const contentById = new Map(TECHNIQUE_CONTENT.map((t) => [t.technique as string, t]));
  const out: Lesson[] = [];
  for (const level of [1, 2, 3, 4, 5] as LevelId[]) {
    for (const id of ORDER[level]) {
      const f = foundationById.get(id);
      if (f) {
        out.push({ id, kind: 'foundation', title: f.title, level, summary: f.summary, prerequisites: f.prerequisites, foundation: f });
        continue;
      }
      const content = contentById.get(id);
      if (!content) throw new Error(`Curriculum: no content for lesson ${id}`);
      const info = techniqueInfo(content.technique);
      out.push({
        id,
        kind: 'technique',
        title: info.name,
        level,
        summary: content.summary,
        prerequisites: [...info.prerequisites, ...(EXTRA_PREREQS[content.technique] ?? [])],
        technique: content.technique,
        content,
      });
    }
  }
  return out;
}

/** Every lesson in curriculum order (level by level, map order inside a level). */
export const LESSONS: readonly Lesson[] = buildLessons();
const BY_ID = new Map(LESSONS.map((l) => [l.id, l]));

export const getLesson = (id: string): Lesson | undefined => BY_ID.get(id);
export const lessonsInLevel = (level: LevelId) => LESSONS.filter((l) => l.level === level);
export const lessonTitle = (id: string) => BY_ID.get(id)?.title ?? id;
/** Lesson that teaches an engine technique (lesson id = technique id). */
export const lessonForTechnique = (t: TechniqueId): Lesson | undefined => BY_ID.get(t);
export const extraCardsFor = (id: string) => EXTRA_CARDS[id] ?? [];

/** "Unlocks after Naked Pair and Hidden Single". */
export function prerequisiteText(lesson: Lesson): string {
  const names = lesson.prerequisites.map(lessonTitle);
  if (!names.length) return '';
  const list = names.length === 1 ? names[0] : `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`;
  return `Unlocks after ${list}`;
}

/** Expected difficulty sentence for a technique lesson. */
export function difficultyText(lesson: Lesson): string {
  if (!lesson.technique) return 'Foundation lesson.';
  const info = techniqueInfo(lesson.technique);
  const tier = info.tier.charAt(0).toUpperCase() + info.tier.slice(1);
  return info.tier === 'easy' ? 'Used in every puzzle, from Easy up.' : `First needed in ${tier} puzzles.`;
}
