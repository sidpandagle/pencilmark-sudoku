import { TECHNIQUES, techniqueInfo } from '../../engine';
import { buildCards } from '../lessonCards';
import { getLesson, LESSONS, LEVELS, lessonForTechnique, prerequisiteText } from '../curriculum';

const words = (s: string) => s.trim().split(/\s+/).length;

describe('curriculum integrity', () => {
  it('has a lesson for every engine technique, at the catalog level', () => {
    for (const t of TECHNIQUES) {
      const l = lessonForTechnique(t.id);
      expect(l).toBeDefined();
      expect(l!.kind).toBe('technique');
      expect(l!.level).toBe(t.level);
      expect(l!.title).toBe(t.name);
    }
    expect(LESSONS.filter((l) => l.kind === 'technique')).toHaveLength(TECHNIQUES.length);
  });

  it('includes the foundation lessons from the brief', () => {
    for (const id of ['rules', 'givens', 'scanning', 'candidates', 'contradictions', 'logic-vs-guessing']) {
      expect(getLesson(id)?.kind).toBe('foundation');
      expect(getLesson(id)?.level).toBe(1);
    }
    expect(getLesson('systematic-scanning')?.level).toBe(2);
    expect(getLesson('candidate-management')?.level).toBe(2);
    expect(getLesson('chains-intro')?.level).toBe(3);
  });

  it('has unique ids and five levels', () => {
    expect(new Set(LESSONS.map((l) => l.id)).size).toBe(LESSONS.length);
    expect(LEVELS.map((l) => l.id)).toEqual([1, 2, 3, 4, 5]);
    expect(getLesson('solve')).toBeUndefined(); // reserved route
  });

  it('keeps every catalog prerequisite of a technique lesson', () => {
    for (const t of TECHNIQUES) {
      const l = lessonForTechnique(t.id)!;
      for (const p of techniqueInfo(t.id).prerequisites) expect(l.prerequisites).toContain(p);
    }
  });

  it('prerequisites exist, sit at the same or a lower level, and form a DAG', () => {
    for (const l of LESSONS) {
      for (const p of l.prerequisites) {
        const pl = getLesson(p);
        expect(pl).toBeDefined();
        expect(pl!.level).toBeLessThanOrEqual(l.level);
      }
    }
    // Topological check: Kahn's algorithm consumes every lesson iff there is no cycle.
    const indeg = new Map(LESSONS.map((l) => [l.id, l.prerequisites.length]));
    const queue = LESSONS.filter((l) => l.prerequisites.length === 0).map((l) => l.id);
    let seen = 0;
    while (queue.length) {
      const id = queue.shift()!;
      seen++;
      for (const l of LESSONS) {
        if (!l.prerequisites.includes(id)) continue;
        indeg.set(l.id, indeg.get(l.id)! - 1);
        if (indeg.get(l.id) === 0) queue.push(l.id);
      }
    }
    expect(seen).toBe(LESSONS.length);
  });

  it('lists prerequisites before the lesson in curriculum order', () => {
    const pos = new Map(LESSONS.map((l, i) => [l.id, i]));
    for (const l of LESSONS) for (const p of l.prerequisites) expect(pos.get(p)!).toBeLessThan(pos.get(l.id)!);
  });

  it('has real, non-empty teaching content for every technique lesson', () => {
    for (const l of LESSONS.filter((x) => x.kind === 'technique')) {
      const c = l.content!;
      for (const field of ['summary', 'concept', 'why', 'targetRule', 'patternCaption'] as const) {
        expect(c[field].trim().length).toBeGreaterThan(15);
        expect(c[field]).not.toMatch(/lorem|TODO|TBD|placeholder/i);
      }
      expect(c.mistakes.length).toBeGreaterThanOrEqual(2);
      expect(c.mistakes.length).toBeLessThanOrEqual(3);
      for (const m of c.mistakes) expect(m.trim().length).toBeGreaterThan(15);
      expect(typeof c.naming).toBe('string');
      expect(typeof c.limits).toBe('string');
      // Short, friendly cards.
      expect(words(c.concept)).toBeLessThanOrEqual(120);
      expect(words(c.why)).toBeLessThanOrEqual(120);
    }
  });

  it('marks uniqueness limits on uniqueness techniques and mentions sashimi and claiming', () => {
    for (const t of TECHNIQUES.filter((x) => x.requiresUniqueness)) {
      expect(lessonForTechnique(t.id)!.content!.limits).toMatch(/exactly one solution/);
    }
    expect(lessonForTechnique('box-line-reduction')!.content!.naming).toMatch(/claiming/i);
    expect(lessonForTechnique('finned-x-wing')!.content!.naming).toMatch(/sashimi/i);
  });

  it('explains Nishio honestly in the forcing chain lesson', () => {
    const cards = buildCards(getLesson('forcing-chain')!);
    const nishio = cards.find((c) => c.type === 'concept' && /Nishio/.test(c.title));
    expect(nishio).toBeDefined();
    const text = nishio!.type === 'concept' ? nishio!.body.join(' ') : '';
    expect(text).toMatch(/no separate Nishio technique/);
  });

  it('has non-empty foundation cards', () => {
    for (const l of LESSONS.filter((x) => x.kind === 'foundation')) {
      expect(l.foundation!.cards.length).toBeGreaterThanOrEqual(2);
      expect(l.foundation!.cards.some((c) => c.kind !== 'concept')).toBe(true);
      for (const c of l.foundation!.cards) {
        expect(c.title.trim().length).toBeGreaterThan(3);
        if (c.kind === 'concept') expect(c.body.every((p) => p.trim().length > 20)).toBe(true);
        else if (c.kind === 'choice') expect(c.options.filter((o) => o.correct)).toHaveLength(1);
        else expect(c.prompt.trim().length).toBeGreaterThan(20);
      }
    }
  });

  it('builds the technique card sequence concept → demo → guided → practice → mastery', () => {
    const types = buildCards(getLesson('x-wing')!).map((c) => c.type);
    expect(types.slice(-4)).toEqual(['demo', 'guided', 'practice', 'mastery']);
    expect(types[0]).toBe('concept');
    expect(buildCards(getLesson('rules')!).slice(-1)[0].type).toBe('done');
  });

  it('describes prerequisites in words', () => {
    expect(prerequisiteText(getLesson('hidden-pair')!)).toBe('Unlocks after Hidden Single and Naked Pair');
    expect(prerequisiteText(getLesson('rules')!)).toBe('');
  });
});
