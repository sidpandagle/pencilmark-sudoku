import { memo } from 'react';
import Svg, { Circle, Path, Rect } from 'react-native-svg';

/**
 * Line icons: 24px grid, 2px rounded strokes, drawn inline (no icon font).
 */
export type IconName =
  | 'back'
  | 'undo'
  | 'redo'
  | 'erase'
  | 'pencil'
  | 'bulb'
  | 'pause'
  | 'play'
  | 'more'
  | 'settings'
  | 'stats'
  | 'help'
  | 'close'
  | 'check'
  | 'calendar'
  | 'book'
  | 'history'
  | 'trophy'
  | 'import'
  | 'restart'
  | 'grid'
  | 'star'
  | 'flame'
  | 'bolt'
  | 'crown'
  | 'layers'
  | 'medal'
  | 'target'
  | 'chevron'
  | 'plus'
  | 'wand'
  | 'eraseAll'
  | 'lock';

interface Props {
  name: IconName;
  size?: number;
  color: string;
  strokeWidth?: number;
}

const D: Partial<Record<IconName, string[]>> = {
  back: ['M15 18l-6-6 6-6'],
  chevron: ['M9 18l6-6-6-6'],
  undo: ['M9 14L4 9l5-5', 'M4 9h10.5a5.5 5.5 0 010 11H11'],
  redo: ['M15 14l5-5-5-5', 'M20 9H9.5a5.5 5.5 0 000 11H13'],
  erase: ['M20 20H9L4.5 15.5a2 2 0 010-2.8l9-9a2 2 0 012.8 0l4.2 4.2a2 2 0 010 2.8L12 19', 'M8.5 9.5l6 6'],
  pencil: ['M16.5 3.5a2.1 2.1 0 013 3L7 19l-4 1 1-4 12.5-12.5z', 'M14.5 5.5l3 3'],
  bulb: ['M9 18h6', 'M10 21h4', 'M12 3a6 6 0 00-3.6 10.8c.6.5 1.1 1.3 1.1 2.2h5c0-.9.5-1.7 1.1-2.2A6 6 0 0012 3z'],
  pause: ['M9 5v14', 'M15 5v14'],
  play: ['M7 4.5v15l12-7.5-12-7.5z'],
  close: ['M6 6l12 12', 'M18 6L6 18'],
  check: ['M4.5 12.5l5 5L19.5 7'],
  calendar: ['M4 7a2 2 0 012-2h12a2 2 0 012 2v12a2 2 0 01-2 2H6a2 2 0 01-2-2V7z', 'M4 10h16', 'M8 3v4', 'M16 3v4'],
  book: ['M4 5.5A1.5 1.5 0 015.5 4H11v16H5.5A1.5 1.5 0 014 18.5v-13z', 'M20 5.5A1.5 1.5 0 0018.5 4H13v16h5.5a1.5 1.5 0 001.5-1.5v-13z'],
  history: ['M3.5 12a8.5 8.5 0 102.5-6', 'M3 4v4h4', 'M12 8v4l3 2'],
  trophy: ['M8 4h8v5a4 4 0 01-8 0V4z', 'M8 6H5a3 3 0 003 4', 'M16 6h3a3 3 0 01-3 4', 'M12 13v4', 'M8.5 20h7', 'M10 17h4'],
  import: ['M12 4v11', 'M7.5 10.5L12 15l4.5-4.5', 'M5 19h14'],
  restart: ['M4 12a8 8 0 108-8 8.4 8.4 0 00-6 2.6', 'M4 4v4h4'],
  stats: ['M5 20V11', 'M12 20V5', 'M19 20v-6'],
  help: ['M9.5 9.5a2.5 2.5 0 114 2c-.9.6-1.5 1.1-1.5 2.3', 'M12 17.2v.1'],
  flame: ['M12 21c3.9 0 6-2.6 6-6 0-4-3-6.5-4-10-2.5 2-3.2 4.3-3.2 6.2C9.6 10.4 9 9.4 8.8 8 7 9.8 6 12.2 6 15c0 3.4 2.1 6 6 6z'],
  bolt: ['M13 3L5 13.5h6L10 21l8-10.5h-6L13 3z'],
  crown: ['M4 18h16', 'M4 15l-1-9 5 4 4-6 4 6 5-4-1 9H4z'],
  layers: ['M12 4l8.5 4.5L12 13 3.5 8.5 12 4z', 'M3.5 12.5L12 17l8.5-4.5', 'M3.5 16.5L12 21l8.5-4.5'],
  medal: ['M8 3l2.5 6', 'M16 3l-2.5 6', 'M12 21a5.5 5.5 0 100-11 5.5 5.5 0 000 11z', 'M12 13.5v4'],
  star: ['M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.9l-5.2 2.7 1-5.8-4.3-4.1 5.9-.9L12 3.5z'],
  plus: ['M12 5v14', 'M5 12h14'],
  wand: ['M4 20L15 9', 'M15 4v2', 'M15 12v2', 'M18 7h2', 'M10 7h2', 'M17.5 4.5l1 1', 'M12.5 4.5l-1 1', 'M17.5 9.5l1 1'],
  eraseAll: ['M5 7h14', 'M10 11v6', 'M14 11v6', 'M6.5 7l1 12a2 2 0 002 2h5a2 2 0 002-2l1-12', 'M9.5 7V4.5h5V7'],
  lock: ['M6 11h12v9H6z', 'M8.5 11V8a3.5 3.5 0 017 0v3'],
};

function IconImpl({ name, size = 24, color, strokeWidth = 2 }: Props) {
  const common = { stroke: color, strokeWidth, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, fill: 'none' };
  let extra = null;
  if (name === 'more') {
    extra = (
      <>
        <Circle cx={12} cy={5.5} r={1.3} fill={color} />
        <Circle cx={12} cy={12} r={1.3} fill={color} />
        <Circle cx={12} cy={18.5} r={1.3} fill={color} />
      </>
    );
  } else if (name === 'settings') {
    extra = (
      <>
        <Circle cx={12} cy={12} r={3} {...common} />
        <Path
          {...common}
          d="M19.4 15a1.7 1.7 0 00.3 1.8l.1.1a2 2 0 11-2.8 2.8l-.1-.1a1.7 1.7 0 00-1.8-.3 1.7 1.7 0 00-1 1.5V21a2 2 0 11-4 0v-.1a1.7 1.7 0 00-1.1-1.5 1.7 1.7 0 00-1.8.3l-.1.1a2 2 0 11-2.8-2.8l.1-.1a1.7 1.7 0 00.3-1.8 1.7 1.7 0 00-1.5-1H3a2 2 0 110-4h.1a1.7 1.7 0 001.5-1.1 1.7 1.7 0 00-.3-1.8l-.1-.1a2 2 0 112.8-2.8l.1.1a1.7 1.7 0 001.8.3H9a1.7 1.7 0 001-1.5V3a2 2 0 114 0v.1a1.7 1.7 0 001 1.5 1.7 1.7 0 001.8-.3l.1-.1a2 2 0 112.8 2.8l-.1.1a1.7 1.7 0 00-.3 1.8V9a1.7 1.7 0 001.5 1H21a2 2 0 110 4h-.1a1.7 1.7 0 00-1.5 1z"
        />
      </>
    );
  } else if (name === 'help' || name === 'target') {
    extra = <Circle cx={12} cy={12} r={9} {...common} />;
  } else if (name === 'grid') {
    extra = (
      <>
        <Rect x={3.5} y={3.5} width={17} height={17} rx={3} {...common} />
        <Path {...common} d="M9.2 3.5v17M14.8 3.5v17M3.5 9.2h17M3.5 14.8h17" />
      </>
    );
  }
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" pointerEvents="none">
      {extra}
      {name === 'target' && (
        <>
          <Circle cx={12} cy={12} r={5} {...common} />
          <Circle cx={12} cy={12} r={1.2} fill={color} />
        </>
      )}
      {(D[name] ?? []).map((d, i) => (
        <Path key={i} d={d} {...common} />
      ))}
    </Svg>
  );
}

export const Icon = memo(IconImpl);
