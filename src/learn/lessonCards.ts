import { difficultyText, extraCardsFor } from './curriculum';
import type { FoundationCard, Lesson } from './types';

/** The sequence of cards the lesson player shows. */
export type PlayerCard =
  | { type: 'concept'; title: string; body: string[]; bullets?: string[]; notes?: { label: string; text: string }[]; diagram?: 'example' }
  | { type: 'foundation-concept'; card: Extract<FoundationCard, { kind: 'concept' }> }
  | { type: 'foundation'; card: Exclude<FoundationCard, { kind: 'concept' }> }
  | { type: 'demo' }
  | { type: 'guided' }
  | { type: 'practice' }
  | { type: 'mastery' }
  | { type: 'done' };

/** Cards that must be solved before Next is enabled. */
export const needsSolve = (c: PlayerCard) => c.type === 'foundation' || c.type === 'guided';

/** True for the card that marks the lesson as completed when reached. */
export const isCompletionCard = (c: PlayerCard) => c.type === 'practice' || c.type === 'done';

export function buildCards(lesson: Lesson): PlayerCard[] {
  if (lesson.kind === 'foundation' && lesson.foundation) {
    const cards: PlayerCard[] = lesson.foundation.cards.map((card) =>
      card.kind === 'concept' ? { type: 'foundation-concept', card } : { type: 'foundation', card },
    );
    cards.push({ type: 'done' });
    return cards;
  }
  const t = lesson.content!;
  const notes: { label: string; text: string }[] = [{ label: 'Difficulty', text: difficultyText(lesson) }];
  if (t.naming) notes.push({ label: 'Names', text: t.naming });
  if (t.limits) notes.push({ label: 'Limits', text: t.limits });
  return [
    { type: 'concept', title: 'What it is', body: [t.concept], diagram: 'example' },
    { type: 'concept', title: 'Why it works', body: [t.why] },
    ...extraCardsFor(lesson.id).map((x) => ({ type: 'concept' as const, title: x.title, body: x.body })),
    { type: 'concept', title: 'Watch out', body: [], bullets: t.mistakes, notes },
    { type: 'demo' },
    { type: 'guided' },
    { type: 'practice' },
    { type: 'mastery' },
  ];
}

export function cardTitle(c: PlayerCard): string {
  switch (c.type) {
    case 'concept':
      return c.title;
    case 'foundation-concept':
    case 'foundation':
      return c.card.title;
    case 'demo':
      return 'See it in a puzzle';
    case 'guided':
      return 'Your turn';
    case 'practice':
      return 'Lesson complete';
    case 'mastery':
      return 'Mastery check';
    case 'done':
      return 'Lesson complete';
  }
}
