import './pictures.css';

export type SquareMark = 'here' | 'was' | 'hop' | 'miss' | 'p1' | 'p2';

export interface HundredSquareProps {
  /** Marks on single squares: where she stands, where she was, a wrong tap, the two racers. */
  marks?: Partial<Record<number, SquareMark[]>>;
  /** Tint every square with this ones digit: the column a jump of ten moves along. */
  column?: number;
  /** When given, squares can be tapped. Without it the square is only a picture. */
  onTap?: (n: number) => void;
}

/** The numbers 1 to 100 in rows of ten. */
export function HundredSquare({ marks = {}, column, onTap }: HundredSquareProps) {
  return (
    <div className="hsq">
      {Array.from({ length: 100 }, (_, i) => {
        const v = i + 1;
        const m = marks[v] ?? [];
        const col = column !== undefined && v % 10 === column % 10 && !m.includes('here');
        return (
          <button
            key={v}
            type="button"
            className={[...m, col && 'col'].filter(Boolean).join(' ') || undefined}
            disabled={!onTap}
            onClick={onTap && (() => onTap(v))}
          >
            {v}
          </button>
        );
      })}
    </div>
  );
}
