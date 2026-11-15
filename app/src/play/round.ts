import type { ReactNode } from 'react';
import type { Piece } from '../speech/script';

/** What a game can tell the round it is played in. */
export interface RoundApi {
  /** The question has been answered right; nothing more can be tapped. */
  readonly over: boolean;
  /** Sets what the speaker button repeats, and says it now. Called by <Prompt>. */
  ask(say: Piece[]): void;
  /** The right answer. `msg` explains why it is right; `say` is spoken instead of it when given. */
  win(msg: ReactNode, say?: Piece[]): void;
  /** A wrong answer. `msg` explains or hints, never a bare "wrong". The question no longer earns a bone. */
  wrong(msg: ReactNode, say?: Piece[]): void;
  /** A remark that is neither right nor wrong ("Keep packing!"). */
  note(msg: ReactNode, kind: 'ok' | 'hint', say?: Piece[] | false): void;
  /** Takes the remark away again, when the child starts over. */
  clear(): void;
  /** She asked for the help picture: the question no longer earns a bone. */
  helped(): void;
}
