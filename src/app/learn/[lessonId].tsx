import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  buildCards,
  cardTitle,
  examplePosition,
  getLesson,
  isCompletionCard,
  lessonProgress,
  lessonStatus,
  LESSONS,
  lessonTitle,
  needsSolve,
  recommendedLesson,
  type Lesson,
  type PlayerCard,
} from '../../learn';
import { ExerciseView } from '../../learn/components/ExerciseView';
import { FoundationCardView } from '../../learn/components/FoundationCardView';
import { useLessonBoardSize } from '../../learn/components/layout';
import { MasteryCheck } from '../../learn/components/MasteryCheck';
import { PracticeLauncher } from '../../learn/components/PracticeLauncher';
import { StepDemo } from '../../learn/components/StepDemo';
import { completeLesson, useLearning } from '../../state/learning';
import { Board, overlayFromStep } from '../../ui/board';
import { AppText, Button, Card } from '../../ui/components/primitives';
import { ScreenHeader } from '../../ui/components/Screen';
import { Icon } from '../../ui/icons/Icon';
import { useColors } from '../../ui/ThemeContext';
import { radius, space } from '../../ui/theme';

function NotFound() {
  const c = useColors();
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.root, { backgroundColor: c.bg, paddingTop: insets.top }]}>
      <ScreenHeader title="Lesson" />
      <View style={styles.column}>
        <AppText variant="heading">This lesson does not exist.</AppText>
        <Button label="Back to lessons" kind="primary" onPress={() => router.replace('/learn')} />
      </View>
    </View>
  );
}

function ConceptCard({ card, lesson, small }: { card: Extract<PlayerCard, { type: 'concept' }>; lesson: Lesson; small: number }) {
  const c = useColors();
  const ex = useMemo(() => (card.diagram && lesson.technique ? examplePosition(lesson.technique, 0) : null), [card.diagram, lesson.technique]);
  return (
    <View style={styles.gap} testID="concept-card">
      {card.body.map((p, i) => (
        <AppText key={i}>{p}</AppText>
      ))}
      {card.bullets?.length ? (
        <View style={styles.gap}>
          {card.bullets.map((b, i) => (
            <View key={i} style={styles.bullet}>
              <Icon name="close" size={16} color={c.conflict} />
              <AppText style={styles.flex}>{b}</AppText>
            </View>
          ))}
        </View>
      ) : null}
      {card.notes?.map((n) => (
        <View key={n.label} style={styles.note}>
          <AppText variant="label" muted>
            {n.label}
          </AppText>
          <AppText>{n.text}</AppText>
        </View>
      ))}
      {ex ? (
        <View style={styles.diagram} accessible accessibilityRole="image" accessibilityLabel={`Diagram from a real puzzle. ${ex.step.explanation}`}>
          <Board values={ex.grid} givens={ex.puzzle.map((v) => v !== 0)} overlay={overlayFromStep(ex.step, 'full')} readOnly size={small} highlights={{ peers: false, sameDigit: false }} testID="concept-diagram" />
          <AppText variant="caption" muted style={styles.centerText}>
            The pattern in a real puzzle: amber cells form it, red marks show what it removes, green what it places.
          </AppText>
        </View>
      ) : null}
    </View>
  );
}

function FoundationConcept({ card, small }: { card: Extract<PlayerCard, { type: 'foundation-concept' }>['card']; small: number }) {
  const pos = card.position;
  const grid = useMemo(() => (pos ? pos.grid.split('').map((ch) => (ch >= '1' && ch <= '9' ? Number(ch) : 0)) : null), [pos]);
  return (
    <View style={styles.gap} testID="concept-card">
      {card.body.map((p, i) => (
        <AppText key={i}>{p}</AppText>
      ))}
      {grid ? (
        <View style={styles.diagram} accessible accessibilityRole="image" accessibilityLabel={card.diagramLabel ?? 'Diagram'}>
          <Board
            values={grid}
            givens={grid.map((v) => v !== 0)}
            overlay={{ units: card.overlayUnits ?? [], focusCells: card.overlayCells ?? [] }}
            readOnly
            size={small}
            highlights={{ peers: false, sameDigit: false }}
            testID="concept-diagram"
          />
        </View>
      ) : null}
    </View>
  );
}

export default function LessonScreen() {
  const params = useLocalSearchParams<{ lessonId: string; card?: string }>();
  const lesson = getLesson(String(params.lessonId ?? ''));
  return lesson ? <LessonPlayer key={lesson.id} lesson={lesson} startCard={params.card} /> : <NotFound />;
}

function LessonPlayer({ lesson, startCard }: { lesson: Lesson; startCard?: string }) {
  const c = useColors();
  const insets = useSafeAreaInsets();
  const learning = useLearning();
  const size = useLessonBoardSize();
  const small = useLessonBoardSize(306, 0.8);
  const cards = useMemo(() => buildCards(lesson), [lesson]);
  const initial = Math.max(0, startCard === 'mastery' ? cards.findIndex((x) => x.type === 'mastery') : 0);
  const [index, setIndex] = useState(initial);
  const [solved, setSolved] = useState<Record<number, boolean>>({});
  const scroll = useRef<ScrollView>(null);
  const card = cards[index];
  const status = lessonStatus(learning, lesson, Date.now());
  const progress = lessonProgress(learning, lesson.id);

  useEffect(() => {
    if (isCompletionCard(card)) completeLesson(lesson.id);
    scroll.current?.scrollTo?.({ y: 0, animated: false });
  }, [card, lesson.id]);

  const markSolved = useCallback(() => setSolved((s) => ({ ...s, [index]: true })), [index]);
  const guided = useMemo(() => (lesson.technique ? examplePosition(lesson.technique, 1) : null), [lesson.technique]);
  const demo = useMemo(() => (lesson.technique ? examplePosition(lesson.technique, 0) : null), [lesson.technique]);

  const canNext = index < cards.length - 1 && (!needsSolve(card) || solved[index]);
  const nextLabel = cards[index + 1]?.type === 'practice' || cards[index + 1]?.type === 'done' ? 'Finish lesson' : 'Next';
  const nextId = recommendedLesson(learning, LESSONS, Date.now());

  let body: React.ReactNode = null;
  switch (card.type) {
    case 'concept':
      body = <ConceptCard card={card} lesson={lesson} small={small} />;
      break;
    case 'foundation-concept':
      body = <FoundationConcept card={card.card} small={small} />;
      break;
    case 'foundation':
      body = <FoundationCardView key={index} card={card.card} size={size} onSolved={markSolved} />;
      break;
    case 'demo':
      body = demo ? (
        <View style={styles.gap}>
          <AppText>A real position where {lesson.title} is the next step. Step through it: where to look, the pattern, what it removes or places, and the result.</AppText>
          <StepDemo grid={demo.grid} candidates={demo.candidates} givens={demo.puzzle.map((v) => v !== 0)} step={demo.step} patternCaption={lesson.content!.patternCaption} size={size} />
        </View>
      ) : (
        <AppText>No example position is available.</AppText>
      );
      break;
    case 'guided':
      body = guided ? (
        <ExerciseView key={guided.key} position={guided} content={lesson.content} mode="guided" size={size} onDone={markSolved} />
      ) : (
        <AppText>No example position is available.</AppText>
      );
      break;
    case 'practice':
      body = (
        <View style={styles.gap}>
          <CompleteBanner title={lesson.title} />
          <AppText>
            Practice makes the pattern jump out at you. Play a full puzzle that needs this technique, or take the mastery check now: finishing the lesson is not
            the same as mastering it.
          </AppText>
          <PracticeLauncher technique={lesson.technique!} variant={progress.attempts + (progress.completedAt ?? 0)} />
        </View>
      );
      break;
    case 'mastery':
      body = <MasteryCheck lessonId={lesson.id} technique={lesson.technique!} content={lesson.content!} size={size} onRetryLesson={() => setIndex(0)} />;
      break;
    case 'done':
      body = (
        <View style={styles.gap}>
          <CompleteBanner title={lesson.title} />
          {nextId && nextId !== lesson.id ? (
            <Button label={`Next: ${lessonTitle(nextId)}`} kind="primary" icon="chevron" onPress={() => router.replace(`/learn/${nextId}`)} testID="next-lesson" />
          ) : null}
          <Button label="Back to lessons" onPress={() => router.replace('/learn')} testID="back-to-map" />
        </View>
      );
      break;
  }

  return (
    <View style={[styles.root, { backgroundColor: c.bg, paddingTop: insets.top, paddingLeft: insets.left, paddingRight: insets.right }]} testID="lesson-screen">
      <View style={styles.headerWrap}>
        <ScreenHeader
          title={lesson.title}
          onBack={() => (router.canGoBack() ? router.back() : router.replace('/learn'))}
          right={
            <AppText variant="label" muted style={styles.counter} accessibilityLabel={`Card ${index + 1} of ${cards.length}`}>
              {index + 1}/{cards.length}
            </AppText>
          }
        />
        <View style={styles.dots}>
          {cards.map((_, i) => (
            <View key={i} style={[styles.dot, { backgroundColor: i <= index ? c.accent : c.line }]} />
          ))}
        </View>
      </View>
      <ScrollView ref={scroll} style={styles.flex} contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + space.xl }]} keyboardShouldPersistTaps="handled">
        <View style={styles.column}>
          {status === 'locked' && index === 0 ? (
            <View style={[styles.gentle, { backgroundColor: c.hintSoft }]} testID="preview-note">
              <AppText variant="label">Preview</AppText>
              <AppText>
                This lesson builds on {lesson.prerequisites.map(lessonTitle).join(', ')}. You are welcome to look around anyway; it may make more sense after those.
              </AppText>
            </View>
          ) : null}
          <AppText variant="title" accessibilityRole="header" testID="card-title">
            {cardTitle(card)}
          </AppText>
          {body}
          <View style={styles.nav}>
            <Button label="Back" icon="back" onPress={() => setIndex((i) => Math.max(0, i - 1))} disabled={index === 0} style={styles.flex} testID="card-back" />
            {index < cards.length - 1 ? (
              <Button label={nextLabel} kind="primary" onPress={() => setIndex((i) => i + 1)} disabled={!canNext} style={styles.flex} testID="card-next" />
            ) : null}
          </View>
          {needsSolve(card) && !solved[index] ? (
            <AppText variant="caption" muted style={styles.centerText}>
              Solve this card to continue.
            </AppText>
          ) : null}
        </View>
      </ScrollView>
    </View>
  );
}

function CompleteBanner({ title }: { title: string }) {
  const c = useColors();
  return (
    <Card style={[styles.banner, { borderColor: c.success }]}>
      <View style={styles.bannerRow} testID="lesson-complete">
        <View style={[styles.badge, { backgroundColor: c.success }]}>
          <Icon name="check" size={22} color={c.surface} />
        </View>
        <View style={styles.flex}>
          <AppText variant="heading">Lesson complete</AppText>
          <AppText muted>You finished “{title}”.</AppText>
        </View>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  flex: { flex: 1 },
  headerWrap: { width: '100%', maxWidth: 720, alignSelf: 'center' },
  counter: { paddingRight: space.md },
  dots: { flexDirection: 'row', gap: 4, paddingHorizontal: space.lg, paddingBottom: space.sm },
  dot: { flex: 1, height: 4, borderRadius: 2 },
  scroll: { flexGrow: 1 },
  column: { width: '100%', maxWidth: 640, alignSelf: 'center', paddingHorizontal: space.lg, gap: space.md, paddingTop: space.sm },
  gap: { gap: space.md },
  bullet: { flexDirection: 'row', gap: space.sm, alignItems: 'flex-start' },
  note: { gap: 2 },
  diagram: { alignItems: 'center', gap: space.sm },
  centerText: { textAlign: 'center' },
  nav: { flexDirection: 'row', gap: space.sm, marginTop: space.md },
  gentle: { borderRadius: radius.button, padding: space.md, gap: space.xs },
  banner: { borderWidth: 1.5 },
  bannerRow: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  badge: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
});
