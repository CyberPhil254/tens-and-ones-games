/**
 * The curriculum as data: stage → unit → lesson → step.
 *
 * A lesson is one skill of docs/skill-map.md, in our own words. A step says how abstract the
 * question is (see it, sketch it, in your head, use it) and which game level asks it.
 * Unit names are ours. Nothing here is shown with a curriculum code.
 *
 * A lesson with no steps has no content yet. It is listed so the path is whole, the engine
 * walks past it, and the app shows it as coming soon.
 */
import type { GameId } from '../maths/questions';

export type Stage = 1 | 2;
export type StepKind = 'see' | 'sketch' | 'head' | 'use';

/** A game level a step draws its questions from; `variant` picks one kind of story. */
export interface Activity {
  game: GameId;
  level: number;
  variant?: number;
}

export interface Step {
  kind: StepKind;
  /** A question is drawn from one of these. */
  from: Activity[];
}

export interface Lesson {
  /** The skill id of docs/skill-map.md, or x-… for the stretch lessons beyond Stage 2. */
  id: string;
  /** What parents see. */
  title: string;
  /** The skill in our own words. */
  skill: string;
  /** Lessons that have to be passed before this one opens. */
  needs: string[];
  steps: Step[];
}

export interface Unit {
  id: string;
  stage: Stage;
  /** Beyond Stage 2: kept because the first user's school already tests it. */
  stretch?: true;
  title: string;
  lessons: Lesson[];
}

const a = (game: GameId, level: number, variant?: number): Activity => ({ game, level, ...(variant === undefined ? {} : { variant }) });
const see = (...from: Activity[]): Step => ({ kind: 'see', from });
const sketch = (...from: Activity[]): Step => ({ kind: 'sketch', from });
const head = (...from: Activity[]): Step => ({ kind: 'head', from });
const apply = (...from: Activity[]): Step => ({ kind: 'use', from });
const lesson = (id: string, title: string, skill: string, needs: string[], steps: Step[] = []): Lesson => ({ id, title, skill, needs, steps });

export const UNITS: Unit[] = [
  {
    id: 's1-u1', stage: 1, title: 'Counting',
    lessons: [
      lesson('s1-count', 'Count to 20', 'Count up to 20 things, one number per thing; the count stays the same when they are moved', []),
      lesson('s1-see', 'See how many', 'See how many (up to 10) in a known pattern without counting', [], [see(a('five', 1)), see(a('five', 2)), sketch(a('five', 3))]),
      lesson('s1-zero', 'Zero', 'Zero means none', ['s1-count']),
      lesson('s1-estimate', 'Guess, then check', 'Guess how many (up to 20), then check', ['s1-count']),
    ],
  },
  {
    id: 's1-u2', stage: 1, title: 'Numbers to 20',
    lessons: [
      lesson('s1-names', 'Number names to 20', 'Say, read and write numbers 0 to 20', ['s1-count']),
      lesson('s1-teens', 'Ten and some more', 'Numbers 10 to 20 as one ten and some ones', ['s1-count'], [see(a('teens', 1)), see(a('teens', 2)), head(a('teens', 3))]),
      lesson('s1-compare', 'More or less, to 20', 'Compare and order numbers to 20', ['s1-names']),
      lesson('s1-ordinal', 'First to tenth', 'First to tenth', ['s1-count']),
    ],
  },
  {
    id: 's1-u3', stage: 1, title: 'Patterns and steps',
    lessons: [
      lesson('s1-pattern', 'What comes next', 'Say what comes next in a pattern of things', []),
      lesson('s1-skip', 'Steps of one, two and ten', 'Count on and back in ones, twos and tens within 20, from any number', ['s1-count']),
      lesson('s1-oddeven', 'Odd and even to 20', 'Odd and even as every other number, to 20', ['s1-skip']),
    ],
  },
  {
    id: 's1-u4', stage: 1, title: 'Adding and taking away to 20',
    lessons: [
      lesson('s1-add', 'Adding', 'Adding as putting together and as counting on', ['s1-count'], [see(a('sums', 1)), sketch(a('sums', 2)), head(a('sums', 3))]),
      lesson('s1-sub', 'Taking away', 'Subtracting as taking away, counting back and finding the difference', ['s1-add'], [see(a('sums', 4)), sketch(a('sums', 5)), head(a('sums', 6))]),
      lesson('s1-ten', 'Friends of ten', 'Pairs that make 10', ['s1-see'], [see(a('friends', 1)), head(a('friends', 2)), apply(a('story', 1, 2))]),
      lesson('s1-doubles', 'Doubles', 'Doubles up to double 10', ['s1-add'], [see(a('sums', 7)), head(a('sums', 8))]),
      lesson('s1-calc20', 'Sums to 20', 'Add and subtract with answers to 20', ['s1-add', 's1-sub', 's1-ten'], [see(a('sums', 9), a('sums', 10)), head(a('sums', 11)), apply(a('sums', 12))]),
    ],
  },
  { id: 's1-u5', stage: 1, title: 'Halves', lessons: [lesson('s1-half', 'Halves', 'Halves: equal and unequal parts, half of a shape, half of a set, two halves make a whole', ['s1-doubles'])] },
  { id: 's1-u6', stage: 1, title: 'Money', lessons: [lesson('s1-money', 'Coins and notes', 'Recognise the coins and notes of the local currency', ['s1-names'])] },
  {
    id: 's2-u1', stage: 2, title: 'Tens and ones',
    lessons: [
      lesson('s2-count', 'Pack in tens', 'Count up to 100 things by grouping them in tens', ['s1-teens'], [see(a('pack', 1)), see(a('pack', 2))]),
      lesson('s2-place', 'Tens and ones', 'The place of a digit gives its value; zero holds a place', ['s2-count'], [see(a('look', 1)), see(a('look', 2)), sketch(a('look', 3)), see(a('walk', 1)), head(a('names', 2))]),
      lesson('s2-names', 'Number names to 100', 'Say, read and write numbers to 100', ['s1-names'], [see(a('names', 1)), head(a('names', 3))]),
      lesson('s2-regroup', 'Build and split', 'Build, split and regroup two-digit numbers in tens and ones', ['s2-count'], [see(a('pack', 3)), see(a('walk', 2)), see(a('regroup', 1)), head(a('regroup', 2))]),
    ],
  },
  {
    id: 's2-u2', stage: 2, title: 'Numbers on the line',
    lessons: [
      lesson('s2-see', 'See how many, new patterns', 'See how many (up to 10) in a new pattern without counting', ['s1-see']),
      lesson('s2-estimate', 'Guess a heap', 'Guess how many, up to 100', ['s2-count']),
      lesson('s2-compare', 'More or less, to 100', 'Compare and order two-digit numbers', ['s2-place']),
      lesson('s2-ordinal', 'Eleventh and beyond', 'Ordinal numbers beyond tenth', ['s1-ordinal']),
      lesson('s2-round', 'The nearer ten', 'Round to the nearest ten', ['s2-compare']),
    ],
  },
  {
    id: 's2-u3', stage: 2, title: 'Counting in steps',
    lessons: [
      lesson('s2-skip', 'Steps of two, five and ten', 'Count on and back in ones, twos, fives and tens within 100, from any number', ['s1-skip', 's2-place'], [see(a('jump', 3))]),
      lesson('s2-oddeven', 'Odd and even to 100', 'Tell odd from even to 100', ['s1-oddeven']),
      lesson('s2-sequence', 'Number patterns', 'Continue and describe number patterns to 100', ['s2-skip']),
    ],
  },
  {
    id: 's2-u4', stage: 2, title: 'Adding and taking away to 100',
    lessons: [
      lesson('s2-bonds', 'Friends of 20 and 100', 'Pairs that make 20; pairs of tens that make 100', ['s1-ten'], [see(a('friends', 3)), see(a('bonds', 1)), see(a('bonds', 2)), head(a('bonds', 3))]),
      lesson('s2-inverse', 'Mystery numbers', 'Adding and subtracting undo each other', ['s1-add', 's1-sub'], [see(a('mystery', 1)), see(a('mystery', 2)), head(a('mystery', 3))]),
      lesson('s2-calc', 'Tens and ones sums', 'Add and subtract two-digit numbers where no ten has to be made or broken', ['s2-place', 's1-calc20'], [
        see(a('jump', 1), a('jump', 2)), see(a('plus', 1)), sketch(a('plus', 2)), see(a('take', 1), a('take', 2)), head(a('jump', 4), a('plus', 3)),
        apply(a('story', 1, 0), a('story', 1, 1), a('story', 2, 0), a('story', 2, 1), a('story', 3, 1), a('story', 3, 2)),
      ]),
    ],
  },
  {
    id: 's2-u5', stage: 2, title: 'Equal groups',
    lessons: [
      lesson('s2-times', 'Equal groups', 'Multiplying as equal groups, repeated adding and rows and columns', ['s2-skip']),
      lesson('s2-tables', 'Times tables', 'The 1, 2, 5 and 10 times tables', ['s2-times']),
      lesson('s2-divide', 'Fair shares', 'Dividing as sharing equally and as making groups', ['s2-times']),
    ],
  },
  { id: 's2-u6', stage: 2, title: 'Quarters', lessons: [lesson('s2-quarter', 'Quarters', 'Quarters and three quarters: of a shape, of a set, as sharing; two quarters are a half; halves and quarters put together', ['s1-half', 's2-divide'])] },
  { id: 's2-u7', stage: 2, title: 'Money', lessons: [lesson('s2-money', 'Amounts of money', 'Read amounts of money; compare sets of coins and notes', ['s1-money', 's2-calc'])] },
  {
    id: 'x-u1', stage: 2, stretch: true, title: 'Across a ten',
    lessons: [
      lesson('x-fill', 'Fill the ten', 'Add a one-digit number across a ten by filling the ten first', ['s2-calc', 's2-bonds'], [see(a('fill', 1)), see(a('fill', 2)), sketch(a('fill', 3)), head(a('fill', 4)), apply(a('story', 2, 2), a('story', 3, 0))]),
      lesson('x-break', 'Break a ten', 'Subtract across a ten by breaking a ten into ones', ['s2-calc'], [see(a('take', 3)), head(a('take', 4))]),
      lesson('x-line', 'Find it on the line', 'Place a number on a nearly empty line from 0 to 100', ['s2-place'], [see(a('walk', 3))]),
    ],
  },
];

/** Every lesson in path order. */
export const LESSONS: Lesson[] = UNITS.flatMap((u) => u.lessons);
export const LESSON: ReadonlyMap<string, Lesson> = new Map(LESSONS.map((l) => [l.id, l]));
export const unitOf = (lessonId: string): Unit => UNITS.find((u) => u.lessons.some((l) => l.id === lessonId))!;
/** A lesson that has something to play. */
export const playable = (l: Lesson): boolean => l.steps.length > 0;
