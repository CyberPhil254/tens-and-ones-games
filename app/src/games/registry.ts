import type { ComponentType } from 'react';
import type { GameId, QuestionOf } from '../maths/questions';
import type { RoundApi } from '../play/round';
import { BreakATen } from './BreakATen';
import { FillTheTen } from './FillTheTen';
import { FriendsOfTen } from './FriendsOfTen';
import { HighFive } from './HighFive';
import { JumpInTens } from './JumpInTens';
import { MysteryBox } from './MysteryBox';
import { NumberNames } from './NumberNames';
import { OreosStories } from './OreosStories';
import { OreosWalk } from './OreosWalk';
import { PackTen } from './PackTen';
import { QuickLook } from './QuickLook';

export interface GameProps<G extends GameId> {
  q: QuestionOf[G];
  level: number;
  round: RoundApi;
}

/** Names and one-line descriptions, as in the live game. */
export const GAME_INFO: Record<GameId | 'race' | 'quick', { name: string; d: string }> = {
  five: { name: 'High Five', d: 'See five and some more. No counting!' },
  pack: { name: 'Pack Ten', d: 'Pack loose ones into tens.' },
  look: { name: 'Quick Look', d: 'See the number without counting.' },
  names: { name: 'Number Names', d: 'Hear a number and find it.' },
  walk: { name: 'Oreo’s Walk', d: 'Find numbers on the number line.' },
  friends: { name: 'Friends of Ten', d: 'Which two numbers make 10?' },
  jump: { name: 'Jump in Tens', d: 'Hop up and down the hundred square.' },
  fill: { name: 'Fill the Ten', d: 'Add by filling up the blue tower.' },
  take: { name: 'Break a Ten', d: 'Take away. Break a ten when you need ones.' },
  mystery: { name: 'Mystery Box', d: 'Find the hidden number.' },
  story: { name: 'Oreo’s Stories', d: 'Little number stories about Oreo.' },
  race: { name: 'Race to 100', d: 'A board game for two players.' },
  quick: { name: 'Quick Paws', d: 'Ten fast questions. Beat your own time.' },
};

export const SHELVES: [string, (GameId | 'race' | 'quick')[]][] = [
  ['See the number', ['five', 'pack', 'look', 'names', 'walk']],
  ['Add and take away', ['friends', 'jump', 'fill', 'take']],
  ['Puzzles and stories', ['mystery', 'story']],
  ['Play together', ['race', 'quick']],
];

/** The games that exist in the new app so far. The rest are still only in the live game. */
export const GAMES: { [G in GameId]?: ComponentType<GameProps<G>> } = {
  five: HighFive,
  pack: PackTen,
  look: QuickLook,
  names: NumberNames,
  walk: OreosWalk,
  friends: FriendsOfTen,
  jump: JumpInTens,
  fill: FillTheTen,
  take: BreakATen,
  mystery: MysteryBox,
  story: OreosStories,
};

/** The learning path, cut down to the games that exist. Grows with every game pull request. */
export const READY: GameId[] = (Object.keys(GAMES) as GameId[]);
