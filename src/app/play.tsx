import { router, useFocusEffect } from 'expo-router';
import { activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AppState, Pressable, StyleSheet, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { Difficulty, Hint } from '../engine';
import { difficultyLabel, digitCounts, inputFeedbackKind, requestHint, revealTarget, type GameAction } from '../game';
import { lessonForTechnique } from '../learn/curriculum';
import { dispatchGame, replayCurrent, startRandomGame } from '../state/actions';
import { recordHintTechnique } from '../state/learning';
import { feedback } from '../state/feedback';
import { useGame, useSettings } from '../state/hooks';
import { flushNow } from '../state/persistence';
import { shallowEqual } from '../state/store';
import { gameStore, settingsStore } from '../state/stores';
import { Board, boardSizeFor, overlayFromStep, type BoardOverlay } from '../ui/board';
import { NumberPad } from '../ui/components/NumberPad';
import { AppText, Button, IconButton } from '../ui/components/primitives';
import { goBack, goHome } from '../ui/components/Screen';
import { ConfirmDialog, Sheet } from '../ui/components/Sheet';
import { Toolbar } from '../ui/components/Toolbar';
import { CompletionView } from '../ui/game/CompletionView';
import { DifficultyPicker } from '../ui/game/DifficultyPicker';
import { HintPanel } from '../ui/game/HintPanel';
import { Timer } from '../ui/game/Timer';
import { useGameKeyboard } from '../ui/game/useGameKeyboard';
import { Icon, type IconName } from '../ui/icons/Icon';
import { useColors } from '../ui/ThemeContext';
import { radius, space } from '../ui/theme';

const HEADER_H = 56;
/** Vertical padding/margins in the portrait body (paddingTop + controls marginTop + root paddingBottom). */
const PORTRAIT_GAPS = 32;
const MIN_CONTROLS_H = 200;
/** 3x3 pad: toolbar + three rows of >= 56dp keys. */
const MIN_CONTROLS_H_GRID = 64 + 3 * 56 + 16 + 24;
/** Approximate toolbar height (icon + label buttons). */
const TOOLBAR_H = 64;
const KEEP_AWAKE_TAG = 'pencilmark-play';

interface HintState {
  hint: Hint;
  level: number;
  revealCell: number;
  /** values/notes references the hint was computed for; the hint closes if the board changes. */
  values: readonly number[];
  notes: readonly number[];
}

function act(action: GameAction) {
  const before = gameStore.get();
  const after = dispatchGame(action);
  if (!before || !after || after === before) return after;
  if (action.type === 'input' && after.values !== before.values) {
    feedback(inputFeedbackKind(after, before.selected, settingsStore.get()));
  } else if (action.type === 'erase' && (after.values !== before.values || after.notes !== before.notes)) {
    feedback('erase');
  } else if (action.type === 'input' && after.notes !== before.notes) {
    feedback('select'); // note toggled in notes mode
  }
  return after;
}

function MenuItem({ icon, label, onPress, testID }: { icon: IconName; label: string; onPress: () => void; testID: string }) {
  const c = useColors();
  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={({ pressed }) => [styles.menuItem, { backgroundColor: pressed ? c.surfaceAlt : 'transparent' }]}
    >
      <Icon name={icon} size={22} color={c.ink} />
      <AppText>{label}</AppText>
    </Pressable>
  );
}

export default function Play() {
  const c = useColors();
  const insets = useSafeAreaInsets();
  const { width: winW, height: winH } = useWindowDimensions();
  const settings = useSettings();

  const board = useGame(
    (g) => ({
      id: g.id,
      values: g.values,
      notes: g.notes,
      givens: g.givens,
      solution: g.solution,
      selected: g.selected,
      highlightDigit: g.highlightDigit,
      notesMode: g.notesMode,
      status: g.status,
      canUndo: g.past.length > 0,
      canRedo: g.future.length > 0,
      difficulty: g.difficulty,
      source: g.source,
      mistakes: g.mistakes,
      livesOfferDismissed: g.livesOfferDismissed,
    }),
    null,
    (a, b) => (a && b ? shallowEqual(a, b) : a === b),
  );

  const [focused, setFocused] = useState(true);
  const [appActive, setAppActive] = useState(AppState.currentState !== 'background');
  const [menu, setMenu] = useState(false);
  const [confirmRestart, setConfirmRestart] = useState(false);
  const [picker, setPicker] = useState(false);
  const [hint, setHint] = useState<HintState | null>(null);
  const [solveBlocked, setSolveBlocked] = useState<number[] | null>(null);

  useFocusEffect(
    useCallback(() => {
      setFocused(true);
      return () => {
        setFocused(false);
        void flushNow();
      };
    }, []),
  );

  // Background: pause (board hidden on return) and stop the clock.
  useEffect(() => {
    const sub = AppState.addEventListener('change', (s) => {
      const active = s === 'active';
      setAppActive(active);
      if (!active) dispatchGame({ type: 'pause' });
    });
    return () => sub.remove();
  }, []);

  const status = board?.status;
  const running = focused && appActive && status === 'playing';

  // Clock: ticks only while visible and playing. Only <Timer> subscribes to elapsedMs.
  useEffect(() => {
    if (!running) return;
    let last = Date.now();
    const id = setInterval(() => {
      const now = Date.now();
      dispatchGame({ type: 'tick', deltaMs: now - last });
      last = now;
    }, 1000);
    return () => {
      clearInterval(id);
      dispatchGame({ type: 'tick', deltaMs: Date.now() - last });
    };
  }, [running]);

  useEffect(() => {
    if (!running || !settings.keepAwake) return;
    activateKeepAwakeAsync(KEEP_AWAKE_TAG).catch(() => {});
    return () => {
      deactivateKeepAwake(KEEP_AWAKE_TAG).catch(() => {});
    };
  }, [running, settings.keepAwake]);

  // Close a stale hint when the board changes underneath it.
  useEffect(() => {
    if (hint && board && (board.values !== hint.values || board.notes !== hint.notes)) setHint(null);
  }, [board, hint]);

  const openHint = useCallback(() => {
    const g = gameStore.get();
    if (!g || g.status !== 'playing') return;
    const h = requestHint(g);
    if (h.kind === 'step') {
      dispatchGame({ type: 'useHint' });
      // Weak-spot signal for learning mode (one per hint request).
      recordHintTechnique(h.step.technique);
    }
    const after = gameStore.get() ?? g;
    setHint({ hint: h, level: 0, revealCell: revealTarget(after), values: after.values, notes: after.notes });
  }, []);

  const closeHint = useCallback(() => setHint(null), []);

  const applyHint = useCallback(() => {
    if (hint?.hint.kind === 'step') act({ type: 'applyHintStep', step: hint.hint.step });
    setHint(null);
  }, [hint]);

  const fixHint = useCallback(() => {
    if (hint?.hint.kind === 'mistake') act({ type: 'fixEntries', cells: hint.hint.cells });
    else if (hint?.hint.kind === 'bad-notes') act({ type: 'fixNotes', cells: hint.hint.cells });
    setHint(null);
  }, [hint]);

  const revealHint = useCallback(() => {
    if (hint && hint.revealCell >= 0) {
      dispatchGame({ type: 'useHint' });
      act({ type: 'revealCell', cell: hint.revealCell });
    }
    setHint(null);
  }, [hint]);

  const overlay: BoardOverlay | null = useMemo(() => {
    if (!hint) return null;
    const h = hint.hint;
    if (h.kind === 'step') return hint.level >= 2 ? overlayFromStep(h.step, hint.level >= 3 ? 'full' : 'where') : null;
    if (h.kind === 'mistake' || h.kind === 'bad-notes') return { flaggedCells: h.cells };
    return hint.revealCell >= 0 ? { focusCells: [hint.revealCell] } : null;
  }, [hint]);

  const onCellPress = useCallback((cell: number) => {
    act({ type: 'select', cell });
    feedback('select');
  }, []);
  const onDigit = useCallback((d: number) => act({ type: 'input', digit: d }), []);
  const onUndo = useCallback(() => act({ type: 'undo' }), []);
  const onRedo = useCallback(() => act({ type: 'redo' }), []);
  const onErase = useCallback(() => act({ type: 'erase' }), []);
  const onToggleNotes = useCallback(() => act({ type: 'toggleNotesMode' }), []);
  const togglePause = useCallback(() => {
    const g = gameStore.get();
    if (!g) return;
    dispatchGame({ type: g.status === 'paused' ? 'resume' : 'pause' });
  }, []);

  const anyModal = menu || confirmRestart || picker || !!solveBlocked;
  useGameKeyboard(
    {
      digit: (d, asNote) => act({ type: 'input', digit: d, asNote }),
      move: (dRow, dCol) => act({ type: 'move', dRow, dCol }),
      erase: onErase,
      undo: onUndo,
      redo: onRedo,
      toggleNotes: onToggleNotes,
      hint: () => (hint ? setHint(null) : openHint()),
      pauseOrEscape: (k) => {
        if (k === 'escape' && hint) setHint(null);
        else togglePause();
      },
    },
    focused && !anyModal && status !== 'completed',
  );

  const counts = useMemo(() => (board ? digitCounts(board.values) : new Array(10).fill(0)), [board?.values]);

  if (!board) {
    return (
      <View style={[styles.empty, { backgroundColor: c.bg, paddingTop: insets.top }]}>
        <AppText variant="heading">No game in progress</AppText>
        <Button label="Go home" kind="primary" onPress={goHome} />
      </View>
    );
  }

  const game = gameStore.get();
  if (status === 'completed' && game) {
    return (
      <View style={[styles.root, { backgroundColor: c.bg, paddingTop: insets.top, paddingBottom: insets.bottom }]}>
        <CompletionView
          game={game}
          onNext={() => {
            startRandomGame((board.difficulty ?? 'medium') as Difficulty);
          }}
          onReplay={() => replayCurrent()}
          onHome={goHome}
        />
      </View>
    );
  }

  // ---- layout
  const availW = winW - insets.left - insets.right;
  const availH = winH - insets.top - insets.bottom;
  const landscape = availW > availH && availW >= 560;
  // Portrait: keep at least MIN_CONTROLS_H for toolbar + pad / hint panel; the board shrinks first.
  const gridPad = !landscape && settings.padLayout === 'grid';
  const minControls = gridPad ? MIN_CONTROLS_H_GRID : MIN_CONTROLS_H;
  const size = landscape
    ? boardSizeFor(availW, availH, true)
    : Math.min(boardSizeFor(availW, availH, false), Math.floor((availH - HEADER_H - PORTRAIT_GAPS - minControls) / 9) * 9);
  const controlsW = landscape ? Math.min(420, availW - size - space.xl * 2) : Math.min(560, availW - 24);
  // The controls area takes all the height under the board (fixed, so the board never jumps when the hint
  // panel replaces the pad). Spare height grows the number keys (up to 80dp) before it becomes empty space.
  const controlsH = landscape ? Math.max(150, Math.min(240, availH - HEADER_H - size)) : Math.max(minControls - 40, availH - HEADER_H - size - PORTRAIT_GAPS);
  const padKeyH = landscape ? undefined : gridPad ? (controlsH - TOOLBAR_H - space.md - 16) / 3 : controlsH - TOOLBAR_H - space.lg * 2;
  const paused = status === 'paused';
  const mistakeLimitHit =
    settings.mistakeCounter && settings.mistakeLimit > 0 && board.mistakes >= settings.mistakeLimit && !board.livesOfferDismissed;

  const title = board.source === 'daily' ? 'Daily' : difficultyLabel(board.difficulty);

  const header = (
    <View style={[styles.header, { width: landscape ? controlsW : Math.min(availW, 640) }]}>
      <IconButton icon="back" label="Back to home" onPress={goBack} testID="play-back" />
      <View style={styles.headerMid}>
        <AppText variant="label" numberOfLines={1} testID="play-title">
          {title}
        </AppText>
        {settings.mistakeCounter ? (
          <AppText variant="caption" muted testID="mistakes">
            Mistakes {board.mistakes}
            {settings.mistakeLimit ? `/${settings.mistakeLimit}` : ''}
          </AppText>
        ) : null}
      </View>
      <Timer />
      <IconButton icon={paused ? 'play' : 'pause'} label={paused ? 'Resume' : 'Pause'} onPress={togglePause} testID="pause" />
      <IconButton icon="more" label="Game menu" onPress={() => setMenu(true)} testID="menu" />
    </View>
  );

  const boardView = (
    <View style={{ width: size, height: size }}>
      <Board
        values={board.values}
        givens={board.givens}
        notes={board.notes}
        solution={board.solution}
        selected={board.selected}
        highlightDigit={board.highlightDigit}
        highlights={{
          peers: settings.highlightPeers,
          sameDigit: settings.highlightSameDigit,
          conflicts: settings.highlightConflicts,
          autoCheck: settings.autoCheck,
        }}
        overlay={overlay}
        size={size}
        onCellPress={paused ? undefined : onCellPress}
      />
      {paused ? (
        <View style={[styles.pauseCover, { backgroundColor: c.surface, borderColor: c.line }]} testID="pause-overlay">
          <Icon name="pause" size={36} color={c.inkMuted} />
          <AppText variant="heading">Paused</AppText>
          <AppText muted style={{ textAlign: 'center' }}>
            Your game is saved. Take your time.
          </AppText>
          <Button label="Resume" kind="primary" icon="play" onPress={togglePause} testID="resume" />
        </View>
      ) : null}
    </View>
  );

  const activeDigit = board.selected >= 0 && board.values[board.selected] ? board.values[board.selected] : board.highlightDigit;
  const controls = hint ? (
    <HintPanel
      hint={hint.hint}
      level={hint.level}
      revealCell={hint.revealCell}
      onNext={() => setHint((h) => (h ? { ...h, level: Math.min(3, h.level + 1) } : h))}
      onApply={applyHint}
      onFix={fixHint}
      onReveal={revealHint}
      onClose={closeHint}
      width={controlsW}
      maxHeight={landscape ? availH - HEADER_H - space.lg : controlsH}
      onLearn={
        hint.hint.kind === 'step' && lessonForTechnique(hint.hint.step.technique)
          ? () => {
              const t = hint.hint.kind === 'step' ? hint.hint.step.technique : null;
              setHint(null);
              if (t) router.push(`/learn/${t}`);
            }
          : undefined
      }
    />
  ) : (
    <View style={styles.controls}>
      <Toolbar
        width={controlsW}
        canUndo={board.canUndo}
        canRedo={board.canRedo}
        notesMode={board.notesMode}
        onUndo={onUndo}
        onRedo={onRedo}
        onErase={onErase}
        onToggleNotes={onToggleNotes}
        onHint={openHint}
        disabled={paused}
      />
      <NumberPad
        width={landscape ? Math.min(controlsW, 300) : gridPad ? Math.min(controlsW, 380) : controlsW}
        layout={landscape || gridPad ? 'grid' : 'row'}
        keyHeight={padKeyH}
        counts={counts}
        notesMode={board.notesMode}
        activeDigit={activeDigit}
        onDigit={onDigit}
        disabled={paused}
      />
    </View>
  );

  return (
    <View
      style={[
        styles.root,
        { backgroundColor: c.bg, paddingTop: insets.top, paddingBottom: insets.bottom, paddingLeft: insets.left, paddingRight: insets.right },
      ]}
      testID="play-screen"
    >
      {landscape ? (
        <View style={styles.landscape}>
          {boardView}
          <View style={[styles.side, { width: controlsW }]}>
            {header}
            <View style={styles.sideControls}>{controls}</View>
          </View>
        </View>
      ) : (
        <View style={styles.portrait}>
          {header}
          <View style={styles.portraitBody}>
            {boardView}
            <View style={[styles.controlsArea, { height: controlsH }]}>{controls}</View>
          </View>
        </View>
      )}

      <Sheet visible={menu} onClose={() => setMenu(false)} title="Game" testID="game-menu">
        <MenuItem icon="restart" label="Restart puzzle" testID="menu-restart" onPress={() => { setMenu(false); setConfirmRestart(true); }} />
        <MenuItem icon="plus" label="New game" testID="menu-new" onPress={() => { setMenu(false); setPicker(true); }} />
        <MenuItem
          icon="layers"
          label="Solve step by step"
          testID="menu-solve"
          onPress={() => {
            setMenu(false);
            const g = gameStore.get();
            if (!g) return;
            const wrong = g.values.map((v, i) => (v && v !== g.solution[i] ? i : -1)).filter((i) => i >= 0);
            if (wrong.length) setSolveBlocked(wrong);
            else router.push('/learn/solve?source=game');
          }}
        />
        <MenuItem icon="book" label="Learn techniques" testID="menu-learn" onPress={() => { setMenu(false); router.push('/learn'); }} />
        <MenuItem icon="wand" label="Auto-fill notes" testID="menu-autofill" onPress={() => { setMenu(false); act({ type: 'autoFillNotes' }); }} />
        <MenuItem icon="eraseAll" label="Clear all notes" testID="menu-clearnotes" onPress={() => { setMenu(false); act({ type: 'clearNotes' }); }} />
        <MenuItem icon="settings" label="Settings" testID="menu-settings" onPress={() => { setMenu(false); router.push('/settings'); }} />
        <MenuItem icon="help" label="How to play" testID="menu-help" onPress={() => { setMenu(false); router.push('/help'); }} />
      </Sheet>

      <ConfirmDialog
        visible={!!solveBlocked}
        title="Fix your entries first"
        message={`${solveBlocked?.length ?? 0} of your entries ${solveBlocked?.length === 1 ? 'does' : 'do'} not match the solution. Step-by-step solving continues from correct digits only, so ${solveBlocked?.length === 1 ? 'that entry needs' : 'those entries need'} to go first.`}
        confirmLabel={solveBlocked?.length === 1 ? 'Clear it and continue' : 'Clear them and continue'}
        cancelLabel="Not now"
        onCancel={() => setSolveBlocked(null)}
        onConfirm={() => {
          const cells = solveBlocked ?? [];
          setSolveBlocked(null);
          setHint(null);
          act({ type: 'fixEntries', cells });
          router.push('/learn/solve?source=game');
        }}
      />

      <ConfirmDialog
        visible={confirmRestart}
        title="Restart this puzzle?"
        message="Your entries, notes and time will be cleared. The puzzle stays the same."
        confirmLabel="Restart"
        destructive
        onCancel={() => setConfirmRestart(false)}
        onConfirm={() => {
          setConfirmRestart(false);
          setHint(null);
          act({ type: 'restart' });
        }}
      />

      <ConfirmDialog
        visible={!!mistakeLimitHit && !paused}
        title="Out of lives"
        message={`That’s ${board.mistakes} mistakes. No pressure: keep going and finish it your way, or start fresh.`}
        confirmLabel="Keep playing"
        cancelLabel="Restart"
        onConfirm={() => dispatchGame({ type: 'dismissLivesOffer' })}
        onCancel={() => {
          setHint(null);
          act({ type: 'restart' });
        }}
      />

      <DifficultyPicker
        visible={picker}
        onClose={() => setPicker(false)}
        replacingGame
        onPick={(d) => {
          setPicker(false);
          setHint(null);
          setTimeout(() => startRandomGame(d), 30);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: space.lg },
  portrait: { flex: 1, alignItems: 'center', paddingBottom: space.sm },
  landscape: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: space.xl, paddingHorizontal: space.lg },
  side: { alignSelf: 'stretch', alignItems: 'center', paddingVertical: space.sm },
  sideControls: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', height: HEADER_H, paddingHorizontal: space.xs },
  headerMid: { flex: 1, paddingHorizontal: space.xs },
  // Board sits under the header; the controls area fills the rest and centres its content (keys grow to fill).
  portraitBody: { flex: 1, justifyContent: 'flex-start', alignItems: 'center', paddingTop: space.sm },
  controlsArea: { justifyContent: 'center', alignItems: 'center', marginTop: space.md },
  controls: { alignItems: 'center', gap: space.md },
  pauseCover: {
    position: 'absolute',
    left: 0,
    top: 0,
    right: 0,
    bottom: 0,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: space.md,
    padding: space.xl,
  },
  menuItem: { flexDirection: 'row', alignItems: 'center', gap: space.md, minHeight: 52, paddingHorizontal: space.sm, borderRadius: radius.button },
});
