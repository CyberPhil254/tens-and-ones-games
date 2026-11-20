import { useEffect, useState } from 'react';
import crown from '../art/rewards/award-crown.webp';
import rosette from '../art/rewards/award-rosette.webp';
import trophy from '../art/rewards/award-trophy.webp';
import beg from '../art/rewards/trick-beg.webp';
import fetchTrick from '../art/rewards/trick-fetch.webp';
import highFive from '../art/rewards/trick-high-five.webp';
import playBow from '../art/rewards/trick-play-bow.webp';
import rollOver from '../art/rewards/trick-roll-over.webp';
import spin from '../art/rewards/trick-spin.webp';
import withBall from '../art/rewards/with-ball.webp';
import withBandana from '../art/rewards/with-bandana.webp';
import withBed from '../art/rewards/with-bed.webp';
import withBowl from '../art/rewards/with-bowl.webp';
import withKennel from '../art/rewards/with-kennel.webp';
import withRope from '../art/rewards/with-rope-toy.webp';
import badge from '../art/rewards/award-paw-badge.webp';
import type { ProfileData } from '../data/profile';
import type { Day } from '../engine/state';
import { UNITS } from '../engine/curriculum';
import { AWARDS, TREASURES as KINDS, TRICKS, WELCOME, awardsWon, badgesWon, goals, lessonsMastered, stageToWin, treasuresHad, tricksKnown, unitToWin, type Award, type Earned, type Goal, type StageKey, type Treasure, type Trick } from '../engine/rewards';
import { opens } from '../engine/rules';
import { unitOf } from '../engine/curriculum';
import { Paw } from '../ui/Oreo';
import { wording } from '../speech/catalogue';
import { OreoAnim } from '../ui/Oreo';
import { TREASURE_NAMES, TREASURES } from './Garden';
import { speak, voice } from './voice';

const WITH: Record<Treasure, string> = { ball: withBall, bandana: withBandana, bed: withBed, bowl: withBowl, 'rope-toy': withRope, kennel: withKennel };
export const TRICK_PICS: Record<Trick, string> = { 'high-five': highFive, beg, spin, 'roll-over': rollOver, 'play-bow': playBow, fetch: fetchTrick };
export const TRICK_NAMES: Record<Trick, string> = { 'high-five': 'High five', beg: 'Beg', spin: 'Spin', 'roll-over': 'Roll over', 'play-bow': 'Play bow', fetch: 'Fetch' };
export const AWARD_PICS: Record<Award, string> = { rosette, trophy, crown };
export const AWARD_NAMES: Record<Award, string> = { rosette: 'The rosette for Stage 1', trophy: 'The trophy for Stage 2', crown: 'The crown for the stretch lessons' };

/** What Oreo will be able to do, for the line that says what earns a trick. */
const TRICK_DOES: Record<Trick, string> = { 'high-five': 'give a high five', beg: 'beg', spin: 'spin', 'roll-over': 'roll over', 'play-bow': 'do a play bow', fetch: 'fetch' };
const STAGE_NAMES: Record<StageKey, string> = { s1: 'Stage 1', s2: 'Stage 2', x: 'the stretch lessons' };
const AWARD_SHORT: Record<Award, string> = { rosette: 'the rosette', trophy: 'the trophy', crown: 'the crown' };
const more = (n: number, one: string, many: string) => `${n} more ${n === 1 ? one : many}`;

/** One plain line: what earns the thing she is working towards. */
export function goalLine(g: Goal): string {
  if (g.kind === 'welcome') return 'Finish today’s games and Oreo gets a treasure.';
  // Earned already: it comes when today's games are done, or, if she had a reward today, with tomorrow's.
  const when = g.waits === 'next' ? 'Finish tomorrow’s games' : 'Finish today’s games';
  if (g.kind === 'treasure') return g.waits ? `${when} and Oreo gets a treasure.` : `${more(g.more, 'paw', 'paws')} and Oreo gets a treasure.`;
  return g.waits ? `${when} and Oreo learns to ${TRICK_DOES[g.trick!]}.` : `Master ${more(g.more, 'lesson', 'lessons')} and Oreo learns to ${TRICK_DOES[g.trick!]}.`;
}

/**
 * One reward. Every one comes from what she has achieved, never from time played: a treasure for Oreo
 * (she picks which of two), a trick Oreo has learnt, the badge of a finished part of the garden, or the
 * award of a finished stage. Nothing here is random.
 */
export function Reward({ earned, soundOff, onDone }: { earned: Earned; soundOff: boolean; onDone: (pick?: Treasure) => void }) {
  const [picked, setPicked] = useState<Treasure | null>(null);
  const sentence =
    earned.kind === 'treasure' ? (picked ? 'oreo-loves-it-thank-you' : earned.slot === WELCOME ? 'you-finished-todays-games-oreo-gets' : 'oreo-gets-a-treasure-which-one')
    : earned.kind === 'trick' ? 'oreo-has-learnt-a-new-trick'
    : earned.kind === 'badge' ? 'you-finished-a-whole-part-of'
    : 'you-finished-the-whole-stage-this';
  // A new trick is named as well: the sentence, then what the trick is called, while Oreo does it.
  const trick = earned.kind === 'trick' ? earned.trick : null;
  useEffect(() => {
    if (!soundOff) speak(trick ? [sentence, TRICK_SAYS[trick]] : [sentence], 0.2);
    return () => voice.stop();
  }, [sentence, soundOff, trick]);
  const unit = earned.kind === 'badge' ? UNITS.find((u) => u.id === earned.unit) : undefined;

  return (
    <section>
      <div className="card game" data-testid="reward" data-reward={earned.kind} data-slot={'slot' in earned ? earned.slot : undefined}>
        <p className="prompt" data-testid="prompt">{wording(sentence)}</p>
        <div className="stage">
          {earned.kind === 'treasure' && !picked && (
            <>
              <OreoAnim name="wag-proud" className="rewardpup small" alt="Oreo is proud of you" />
              <div className="choosecards">
                {earned.options.map((t) => (
                  <button key={t} type="button" className="choosecard treasurecard" aria-label={TREASURE_NAMES[t]} data-treasure={t} onClick={() => setPicked(t)}>
                    <img src={TREASURES[t]} alt="" draggable={false} />
                  </button>
                ))}
              </div>
            </>
          )}
          {earned.kind === 'treasure' && picked && <img className="rewardpic hop" src={WITH[picked]} alt={`Oreo with ${TREASURE_NAMES[picked]}`} draggable={false} />}
          {earned.kind === 'trick' && (
            <>
              <OreoAnim name={`trick-${earned.trick}`} className="rewardpup" alt={`Oreo’s trick: ${TRICK_NAMES[earned.trick]}`} />
              <p className="sub">{wording(TRICK_SAYS[earned.trick])}</p>
            </>
          )}
          {earned.kind === 'badge' && (
            <>
              <div className="awardrow">
                <img className="rewardpic hop" src={badge} alt={`The badge for ${unit?.title ?? 'this part of the garden'}`} draggable={false} />
                <OreoAnim name="wag-proud" className="rewardpup small" />
              </div>
              <p className="sub">{unit?.title}</p>
            </>
          )}
          {earned.kind === 'award' && (
            <>
              <div className="awardrow">
                <img className="rewardpic hop" src={AWARD_PICS[earned.award]} alt={AWARD_NAMES[earned.award]} draggable={false} />
                <OreoAnim name="wag-proud" className="rewardpup small" />
              </div>
              <p className="sub">{AWARD_NAMES[earned.award]}</p>
            </>
          )}
        </div>
        {(earned.kind !== 'treasure' || picked) && (
          <div className="controls">
            <button className="ctl go" type="button" onClick={() => onDone(picked ?? undefined)}>Next</button>
          </div>
        )}
      </div>
    </section>
  );
}

/** What Oreo says a trick is called, as a recorded sentence. */
export const TRICK_SAYS: Record<Trick, string> = {
  'high-five': 'oreo-can-give-a-high-five', beg: 'oreo-can-beg', spin: 'oreo-can-spin', 'roll-over': 'oreo-can-roll-over', 'play-bow': 'oreo-can-do-a-play-bow', fetch: 'oreo-can-fetch',
};

/**
 * A small row of paws that fills up towards the next reward: as many paws as lie between the reward
 * before and this one. `fresh` of the filled ones were won just now and pop in, once.
 */
export function PawRow({ goal, fresh = 0 }: { goal: Goal; fresh?: number }) {
  return (
    <span className="pawrow" role="img" aria-label={`${goal.done} of ${goal.of}`} data-testid="pawrow" data-done={goal.done} data-of={goal.of}>
      {Array.from({ length: goal.of }, (_, i) => <span key={i} className={i < goal.done ? (i >= goal.done - fresh ? 'on new' : 'on') : undefined}><Paw /></span>)}
    </span>
  );
}

/**
 * "Oreo's things", on the home screen: everything there is to earn, earned or not. What she does not
 * have yet is a grey shape, and each row has one plain line saying what earns the next one. Tapping
 * a trick Oreo knows shows it: she says what it is called and does it once.
 */
export function Things({ data, soundOff, today }: { data: ProfileData; soundOff: boolean; today: Day }) {
  // `n` counts taps, so that tapping the same trick again does it again.
  const [show, setShow] = useState<{ trick: Trick; n: number } | null>(null);
  useEffect(() => () => voice.stop(), []);
  const tap = (t: Trick) => {
    setShow((s) => ({ trick: t, n: (s?.n ?? 0) + 1 }));
    if (!soundOff) speak([TRICK_SAYS[t]]);
  };
  const had = treasuresHad(data), known = tricksKnown(data), badges = badgesWon(data), awards = awardsWon(data);
  const all = goals(data, today);
  const treasureGoal = all.find((g) => g.kind === 'welcome') ?? all.find((g) => g.kind === 'treasure');
  const trickGoal = all.find((g) => g.kind === 'trick');
  // The badge she is working towards: the part of the garden her next stone is in, or the first one not yet won.
  const next = opens(data.child);
  // A part she knew entirely before she came earns no badge, so it is never the one she is working towards.
  const nextUnit = (next && unitToWin(data, unitOf(next.id)) ? unitOf(next.id) : undefined) ?? UNITS.find((u) => unitToWin(data, u));
  const nextStage = (Object.keys(AWARDS) as StageKey[]).find((k) => stageToWin(data, k));
  return (
    <div className="things" data-testid="things">
      <h2>Oreo’s things</h2>

      <h3>Treasures</h3>
      <div className="thingrow" data-testid="things-treasures">
        {KINDS.map((t) => (
          <span key={t} className={had[t] ? 'thing' : 'thing not'} role="img" aria-label={had[t] ? `${TREASURE_NAMES[t]}: ${had[t]}` : `${TREASURE_NAMES[t]}: not yet`} data-treasure={t} data-count={had[t]}>
            <img src={TREASURES[t]} alt="" draggable={false} />
            {had[t] > 1 && <b>×{had[t]}</b>}
          </span>
        ))}
      </div>
      {treasureGoal && (
        <p className="thingline" data-testid="line-treasure">
          {treasureGoal.kind === 'treasure' && <PawRow goal={treasureGoal} />} {goalLine(treasureGoal)}
        </p>
      )}

      <h3>Tricks</h3>
      <div className="thingrow tricks" data-testid="things-tricks">
        {TRICKS.map((t) => (known.includes(t) ? (
          <button key={t} type="button" className="trickbtn" aria-pressed={show?.trick === t} data-trick={t} onClick={() => tap(t)}>
            <span className="trickframe"><img src={TRICK_PICS[t]} alt="" draggable={false} /></span>
            <span className="trickname">{TRICK_NAMES[t]}</span>
          </button>
        ) : (
          <span key={t} className="trickbtn not" role="img" aria-label={`${TRICK_NAMES[t]}: not yet`} data-trick={t}>
            <span className="trickframe"><img src={TRICK_PICS[t]} alt="" draggable={false} /></span>
            <span className="trickname">{TRICK_NAMES[t]}</span>
          </span>
        )))}
      </div>
      {trickGoal && <p className="thingline" data-testid="line-trick"><PawRow goal={trickGoal} /> {goalLine(trickGoal)}</p>}
      {show && (
        <div className="trickshow" data-testid="trickshow">
          <OreoAnim key={show.n} name={`trick-${show.trick}`} className="rewardpup" alt={`Oreo’s trick: ${TRICK_NAMES[show.trick]}`} />
          <p className="sub">{wording(TRICK_SAYS[show.trick])}</p>
        </div>
      )}

      <h3>Badges and awards</h3>
      <div className="thingrow badges" data-testid="things-badges">
        {UNITS.map((u) => (
          <span key={u.id} className={badges.includes(u.id) ? 'thing badge' : 'thing badge not'} role="img" aria-label={`The badge for ${u.title}${badges.includes(u.id) ? '' : ': not yet'}`} data-badge={u.id}>
            <img src={badge} alt="" draggable={false} />
          </span>
        ))}
        {(Object.keys(AWARDS) as StageKey[]).map((k) => (
          <span key={k} className={awards.includes(AWARDS[k]) ? 'thing award' : 'thing award not'} role="img" aria-label={`${AWARD_NAMES[AWARDS[k]]}${awards.includes(AWARDS[k]) ? '' : ': not yet'}`} data-award={AWARDS[k]}>
            <img src={AWARD_PICS[AWARDS[k]]} alt="" draggable={false} />
          </span>
        ))}
      </div>
      {nextUnit && <p className="thingline" data-testid="line-badge">Master every lesson in “{nextUnit.title}” for its badge.</p>}
      {nextStage && <p className="thingline" data-testid="line-award">Master all of {STAGE_NAMES[nextStage]} for {AWARD_SHORT[AWARDS[nextStage]]}.</p>}
      <p className="thingline small" data-testid="line-paws">A paw is for every step you pass and every lesson you master. You have mastered {lessonsMastered(data)}.</p>
    </div>
  );
}
