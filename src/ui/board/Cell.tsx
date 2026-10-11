import { memo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { Palette } from '../theme';

export const F_SELECTED = 1;
export const F_PEER = 2;
export const F_SAME = 4;
export const F_CONFLICT = 8;
export const F_WRONG = 16;
export const F_PATTERN = 32;
export const F_SUPPORT = 64;
export const F_FLAGGED = 128;
export const F_FOCUS = 256;

export interface CellProps {
  index: number;
  value: number;
  given: boolean;
  /** Note / candidate mask shown when empty. */
  marks: number;
  /** Whether `marks` are engine candidates (affects the spoken label only). */
  marksAreCandidates: boolean;
  flags: number;
  /** 9-char role string for candidate overlays ('.' = none, see ROLE_CODE). */
  roles: string;
  /** Digit to emphasise among the marks (same-digit highlight), 0 for none. */
  focusDigit: number;
  x: number;
  y: number;
  size: number;
  colors: Palette;
  readOnly: boolean;
  onPress?: (cell: number) => void;
  /**
   * Candidate-tap mode (learning mode): each shown candidate becomes its own press target. The slots are
   * small, so they are hidden from screen readers; the cell itself stays the accessible control and callers
   * offer a large-chip alternative after a cell press.
   */
  onCandidatePress?: (cell: number, digit: number) => void;
}

function cellLabel(p: CellProps): string {
  const r = Math.floor(p.index / 9) + 1;
  const c = (p.index % 9) + 1;
  let s = `Row ${r}, column ${c}, `;
  if (p.value) {
    s += `${p.value}${p.given ? ', given' : ''}`;
  } else {
    s += 'empty';
    if (p.marks) {
      const ds: number[] = [];
      for (let d = 1; d <= 9; d++) if (p.marks & (1 << (d - 1))) ds.push(d);
      s += `, ${p.marksAreCandidates ? 'candidates' : 'notes'} ${ds.join(', ')}`;
    }
  }
  if (p.flags & F_CONFLICT) s += ', conflict';
  if (p.flags & F_WRONG) s += ', incorrect';
  if (p.flags & F_FLAGGED) s += ', needs attention';
  if (p.flags & F_PATTERN) s += ', highlighted by hint';
  const place = p.roles.indexOf('l');
  if (!p.value && place >= 0) s += `, hint places ${place + 1}`;
  return s;
}

function background(flags: number, c: Palette): string {
  if (flags & (F_CONFLICT | F_FLAGGED)) return c.conflictSoft;
  if (flags & F_SELECTED) return c.accentSoft;
  if (flags & F_PATTERN) return c.hintSoft;
  if (flags & F_SAME) return c.sameDigit;
  if (flags & F_SUPPORT) return c.peer;
  if (flags & F_PEER) return c.peer;
  return 'transparent';
}

function CellImpl(p: CellProps) {
  const { value, given, marks, flags, roles, size, colors: c, focusDigit } = p;
  const bad = (flags & (F_CONFLICT | F_WRONG)) !== 0;
  const digitColor = bad ? c.conflict : given ? c.ink : c.accent;
  const noteSize = size * 0.24;
  const pad = size * 0.04;
  const slot = (size - pad * 2) / 3;
  const hasRoles = roles !== '.........';

  let content = null;
  if (value) {
    content = (
      <Text
        allowFontScaling={false}
        style={{
          color: digitColor,
          fontSize: size * 0.58,
          lineHeight: size * 0.72,
          fontWeight: given ? '600' : '500',
          fontVariant: ['tabular-nums'],
          textAlign: 'center',
          includeFontPadding: false,
        }}
      >
        {value}
      </Text>
    );
  } else if (roles.includes('l')) {
    // A placement from a hint: show the digit as a large green "ghost" so it reads at a glance.
    content = (
      <Text
        allowFontScaling={false}
        style={{
          color: c.success,
          fontSize: size * 0.58,
          lineHeight: size * 0.72,
          fontWeight: '600',
          opacity: 0.85,
          fontVariant: ['tabular-nums'],
          textAlign: 'center',
          includeFontPadding: false,
        }}
      >
        {roles.indexOf('l') + 1}
      </Text>
    );
  } else if (marks || hasRoles) {
    const slots = [];
    for (let d = 1; d <= 9; d++) {
      const role = roles[d - 1];
      const shown = (marks & (1 << (d - 1))) !== 0 || role !== '.';
      if (!shown) continue;
      const left = pad + ((d - 1) % 3) * slot;
      const top = pad + Math.floor((d - 1) / 3) * slot;
      let color = focusDigit === d ? c.accent : c.inkMuted;
      let weight: '400' | '700' = focusDigit === d ? '700' : '400';
      let bg: string | undefined;
      let border: string | undefined;
      let borderRadius = slot / 2;
      let strike = false;
      switch (role) {
        case 'p':
          border = c.hint;
          color = c.ink;
          weight = '700';
          break;
        case 'e':
          color = c.eliminate;
          weight = '700';
          strike = true;
          break;
        case 'l':
          bg = c.success;
          color = c.surface;
          weight = '700';
          break;
        case 'a':
          bg = c.colorA;
          color = c.surface;
          weight = '700';
          break;
        case 'b':
          bg = c.colorB;
          color = c.surface;
          weight = '700';
          break;
        case 'f':
          border = c.hint;
          borderRadius = 2;
          color = c.ink;
          weight = '700';
          break;
      }
      const slotStyle = [
        styles.slot,
        { left, top, width: slot, height: slot, borderRadius },
        bg ? { backgroundColor: bg } : null,
        border ? { borderWidth: Math.max(1.5, size * 0.03), borderColor: border } : null,
      ];
      const onCand = p.onCandidatePress && !p.readOnly ? p.onCandidatePress : undefined;
      const SlotView = onCand ? Pressable : View;
      slots.push(
        <SlotView
          key={d}
          testID={onCand ? `cand-${p.index}-${d}` : undefined}
          onPress={onCand ? () => onCand(p.index, d) : undefined}
          accessibilityElementsHidden={onCand ? true : undefined}
          importantForAccessibility={onCand ? 'no-hide-descendants' : undefined}
          hitSlop={onCand ? 2 : undefined}
          style={slotStyle}
        >
          <Text
            allowFontScaling={false}
            style={{ color, fontSize: noteSize, lineHeight: slot, fontWeight: weight, textAlign: 'center', fontVariant: ['tabular-nums'], includeFontPadding: false }}
          >
            {d}
          </Text>
          {strike ? <View style={[styles.strike, { backgroundColor: c.eliminate, top: slot / 2 - 1, transform: [{ rotate: '-40deg' }] }]} /> : null}
        </SlotView>,
      );
    }
    content = slots;
  }

  return (
    <Pressable
      testID={`cell-${p.index}`}
      accessibilityRole="button"
      accessibilityLabel={cellLabel(p)}
      accessibilityState={{ selected: (flags & F_SELECTED) !== 0, disabled: p.readOnly }}
      disabled={p.readOnly || !p.onPress}
      onPress={p.onPress ? () => p.onPress?.(p.index) : undefined}
      style={[styles.cell, { left: p.x, top: p.y, width: size, height: size, backgroundColor: background(flags, c) }]}
    >
      {content}
      {flags & F_SELECTED ? <View style={[styles.noPointer, styles.ring, { borderColor: c.accent, borderWidth: Math.max(2, size * 0.05) }]} /> : null}
      {flags & F_FOCUS ? <View style={[styles.noPointer, styles.ring, { borderColor: c.success, borderWidth: Math.max(2, size * 0.05) }]} /> : null}
      {flags & F_CONFLICT && value ? (
        <View style={[styles.noPointer, styles.underline, { backgroundColor: c.conflict, width: size * 0.4, left: size * 0.3, bottom: size * 0.1 }]} />
      ) : null}
      {flags & (F_WRONG | F_FLAGGED) ? (
        <View
          style={[styles.noPointer, styles.corner, { borderTopColor: c.conflict, borderLeftWidth: size * 0.22, borderTopWidth: size * 0.22 }]}
        />
      ) : null}
    </Pressable>
  );
}

export const Cell = memo(CellImpl);

const styles = StyleSheet.create({
  noPointer: { pointerEvents: 'none' },
  cell: { position: 'absolute', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  slot: { position: 'absolute', alignItems: 'center', justifyContent: 'center' },
  strike: { position: 'absolute', left: '10%', width: '80%', height: 2, borderRadius: 1 },
  ring: { position: 'absolute', left: 2, top: 2, right: 2, bottom: 2, borderRadius: 6 },
  underline: { position: 'absolute', height: 2.5, borderRadius: 2 },
  corner: {
    position: 'absolute',
    right: 0,
    top: 0,
    width: 0,
    height: 0,
    borderLeftColor: 'transparent',
    borderStyle: 'solid',
  },
});
