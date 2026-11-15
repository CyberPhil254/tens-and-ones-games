import type { ComponentType } from 'react';
import type { GameId, QuestionOf } from '../maths/questions';
import type { RoundApi } from '../play/round';
import { BreakATen } from './BreakATen';
import { FillTheTen } from './FillTheTen';
import { FriendsOf20 } from './FriendsOf20';
import { FriendsOfTen } from './FriendsOfTen';
import { HighFive } from './HighFive';
import { JumpInTens } from './JumpInTens';
import { MysteryBox } from './MysteryBox';
import { NumberNames } from './NumberNames';
import { OreosStories } from './OreosStories';
import { OreosWalk } from './OreosWalk';
import { PackTen } from './PackTen';
import { QuickLook } from './QuickLook';
import { SumsTo20 } from './SumsTo20';
import { TensOnesSums } from './TensOnesSums';

export interface GameProps<G extends GameId> {
  q: QuestionOf[G];
  level: number;
  round: RoundApi;
}

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
  sums: SumsTo20,
  plus: TensOnesSums,
  bonds: FriendsOf20,
};

