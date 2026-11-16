import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { dice } from '../maths/random';
import { chime } from '../speech/chime';
import type { Piece } from '../speech/script';
import { HundredSquare, type SquareMark } from '../ui/HundredSquare';
import { Box, Num } from '../ui/Num';
import { Oreo, preloadPoses, type Pose } from '../ui/Oreo';
import { Controls, Prompt, Stage, useWait } from './parts';
import { VoiceRetry } from './Play';
import type { RoundApi } from './round';
import { speak, useVoiceSilent, useVoiceSpeaking, voice } from './voice';

const d = dice(Math.random);
/** The spinner: a jump of ten is twice as likely as each small step. */
const SPINS = [1, 2, 3, 10, 10] as const;

type Partner = 'Grown-up' | 'Oreo';
interface Racer { name: string; pos: number }

/**
 * Race to 100: a board game for two on the hundred square. After each spin the player taps the
 * square she lands on, counting on from where she stands, never from 1. No bones, no rounds.
 */
export function Race({ soundOff, onHome }: { soundOff: boolean; onHome: () => void }) {
  const wait = useWait();
  const silent = useVoiceSilent();
  const speaking = useVoiceSpeaking();
  const [game, setGame] = useState(0); // counts games, so "Play again" starts clean
  const [partner, setPartner] = useState<Partner | null>(null);
  const [racers, setRacers] = useState<[Racer, Racer]>([{ name: 'You', pos: 0 }, { name: '', pos: 0 }]);
  const [turn, setTurn] = useState<0 | 1>(0);
  const [move, setMove] = useState(0);
  const [miss, setMiss] = useState<number | null>(null);
  const [column, setColumn] = useState(false);
  const [landed, setLanded] = useState<number | null>(null);
  const [won, setWon] = useState(false);
  const [fb, setFb] = useState<{ msg: ReactNode; kind: 'ok' | 'hint' } | null>(null);
  const [lastSaid, setLastSaid] = useState<Piece[]>([]);
  useEffect(() => preloadPoses(), []);

  const say = useCallback((pieces: readonly Piece[], delay = 0, force = false) => {
    if (force || !soundOff) speak(pieces, delay);
  }, [soundOff]);
  // Race has no rounds; this is just enough of a round for the shared question heading.
  const round: RoundApi = useMemo(() => ({
    over: false,
    started: () => {},
    ask: (pieces) => { setLastSaid(pieces); say(pieces); },
    win: () => {}, wrong: () => {}, note: () => {}, clear: () => {}, helped: () => {},
  }), [say]);

  const me = racers[turn];
  const oreoPlays = partner === 'Oreo';
  const target = Math.min(100, me.pos + move);

  const start = (p: Partner) => {
    setPartner(p);
    setRacers([{ name: 'You', pos: 0 }, { name: p, pos: 0 }]);
  };
  const again = () => {
    voice.stop();
    setGame(game + 1); setPartner(null); setTurn(0); setMove(0); setWon(false); setFb(null); setLanded(null); setColumn(false);
  };

  const tap = async (v: number) => {
    if (!move || won || landed !== null) return;
    if (v !== target) {
      const tenOn = move === 10;
      if (tenOn && me.pos) setColumn(true);
      setFb({ msg: tenOn ? 'Ten on: go one row down. The ones stay the same.' : `Start at ${me.pos} and count on ${move}.`, kind: 'hint' });
      say(tenOn ? ['ten-on-go-one-row-down'] : ['frag.start-at', me.pos, 'frag.and-count-on', move]);
      setMiss(v);
      await wait(500);
      setMiss(null);
      return;
    }
    const next: [Racer, Racer] = [{ ...racers[0] }, { ...racers[1] }];
    next[turn].pos = v;
    setRacers(next);
    setLanded(v);
    setColumn(false);
    if (!soundOff) chime();
    if (v === 100) {
      setWon(true);
      setMove(0);
      const msg = turn ? 'What a race! Play again?' : 'You won the race!';
      setFb({ msg: <>Woof! {msg}</>, kind: 'ok' });
      say([turn ? 'what-a-race-play-again' : 'you-won-the-race'], 0.3);
      return;
    }
    await wait(900);
    setMove(0); setLanded(null); setFb(null);
    setTurn(turn ? 0 : 1);
  };

  const marks: Partial<Record<number, SquareMark[]>> = {};
  racers.forEach((r, i) => { if (r.pos) marks[r.pos] = [...(marks[r.pos] ?? []), i ? 'p2' : 'p1']; });
  if (miss !== null) marks[miss] = [...(marks[miss] ?? []), 'miss'];

  const whose = turn ? `${me.name}’s turn` : 'Your turn';
  const spinSay = turn ? (oreoPlays ? 'the-puppys-turn-spin' : 'the-grown-ups-turn-spin') : 'your-turn-spin';
  const landSay = turn ? (oreoPlays ? 'where-does-the-puppy-land' : 'where-does-the-grown-up-land') : 'where-do-you-land';
  const pose: Pose = fb ? (fb.kind === 'ok' ? (won ? 'celebrating' : 'happy') : 'not-yet') : speaking ? 'listening' : 'thinking';

  return (
    <section key={game}>
      <div className="gbar">
        <button className="back" type="button" onClick={() => { voice.stop(); onHome(); }}>← Home</button>
      </div>
      <p className="gtitle">Race to 100</p>
      <div className="card game">
        <button className="say" type="button" aria-label="Read it to me" hidden={silent} onClick={() => say(lastSaid, 0, true)}>🔊</button>
        {!partner ? (
          <>
            <Prompt round={round} say={['race-to-one-hundred-who-do']} sub="Who do you want to play with?">Race to 100</Prompt>
            <Controls>
              <button className="ctl go" type="button" onClick={() => start('Grown-up')}>A grown-up</button>
              <button className="ctl brk" type="button" onClick={() => start('Oreo')}>Oreo</button>
            </Controls>
          </>
        ) : (
          <>
            {won ? (
              <p className="prompt"><span data-testid="prompt">{turn ? `${me.name} got to 100!` : 'You got to 100!'}</span></p>
            ) : move ? (
              <Prompt
                round={round} say={[me.pos - (landed !== null ? move : 0), 'frag.plus', move, landSay]}
                sub={me.pos + move > 100 && landed === null ? 'That is past the end. Tap 100 to win!' : `Tap the square where ${turn ? (oreoPlays ? 'Oreo lands' : 'the grown-up lands') : 'you land'}.`}
              >
                <Num n={landed !== null ? landed - move : me.pos} /> + <Num n={move} /> = <Box found={landed ?? undefined} />
              </Prompt>
            ) : (
              <Prompt round={round} say={[spinSay]} sub="Tap Spin.">{whose}</Prompt>
            )}
            <Stage>
              <div className="legend">
                {racers.map((r, i) => (
                  <span key={i} className={[i ? 'p2' : 'p1', i === turn && !won && 'on'].filter(Boolean).join(' ')}>{r.name}: {r.pos || 'start'}</span>
                ))}
              </div>
              <HundredSquare marks={marks} column={column ? me.pos : undefined} onTap={(v) => void tap(v)} />
            </Stage>
            {won ? (
              <Controls>
                <button className="ctl go" type="button" onClick={again}>Play again</button>
                <button className="ctl brk" type="button" onClick={onHome}>Home</button>
              </Controls>
            ) : !move ? (
              <Controls>
                <button className="ctl go" type="button" onClick={() => { setFb(null); setMove(d.pick(SPINS)); }}>Spin</button>
              </Controls>
            ) : null}
          </>
        )}
        <div className="cheer">
          <Oreo key={pose} pose={pose} />
          <p className={fb ? `fb ${fb.kind}` : 'fb'} aria-live="polite" data-testid="feedback">{fb?.msg}</p>
        </div>
        {silent && <VoiceRetry />}
      </div>
    </section>
  );
}
