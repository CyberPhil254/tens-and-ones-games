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
import type { Award, Earned, Treasure, Trick } from '../engine/rewards';
import { wording } from '../speech/catalogue';
import { OreoAnim } from '../ui/Oreo';
import { TREASURE_NAMES, TREASURES } from './Garden';
import { speak, voice } from './voice';

const WITH: Record<Treasure, string> = { ball: withBall, bandana: withBandana, bed: withBed, bowl: withBowl, 'rope-toy': withRope, kennel: withKennel };
export const TRICK_PICS: Record<Trick, string> = { 'high-five': highFive, beg, spin, 'roll-over': rollOver, 'play-bow': playBow, fetch: fetchTrick };
export const TRICK_NAMES: Record<Trick, string> = { 'high-five': 'High five', beg: 'Beg', spin: 'Spin', 'roll-over': 'Roll over', 'play-bow': 'Play bow', fetch: 'Fetch' };
export const AWARD_PICS: Record<Award, string> = { rosette, trophy, crown };
export const AWARD_NAMES: Record<Award, string> = { rosette: 'The rosette for Stage 1', trophy: 'The trophy for Stage 2', crown: 'The crown for the stretch lessons' };

/**
 * One reward, earned by mastery: a treasure for Oreo (she picks which of two), a trick Oreo
 * has learnt, or an award. Nothing here is random, and nothing is earned by time played.
 */
export function Reward({ earned, soundOff, onDone }: { earned: Earned; soundOff: boolean; onDone: (pick?: Treasure) => void }) {
  const [picked, setPicked] = useState<Treasure | null>(null);
  const sentence =
    earned.kind === 'treasure' ? (picked ? 'oreo-loves-it-thank-you' : 'oreo-gets-a-treasure-which-one')
    : earned.kind === 'trick' ? 'you-finished-a-whole-part-of'
    : 'you-finished-the-whole-stage-this';
  // A new trick is named as well: the sentence, then what the trick is called, while Oreo does it.
  const trick = earned.kind === 'trick' ? earned.trick : null;
  useEffect(() => {
    if (!soundOff) speak(trick ? [sentence, TRICK_SAYS[trick]] : [sentence], 0.2);
    return () => voice.stop();
  }, [sentence, soundOff, trick]);

  return (
    <section>
      <div className="card game" data-testid="reward" data-reward={earned.kind}>
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
 * On the home screen: the tricks Oreo knows, each with its name, and the awards won. Tapping a
 * trick shows it: Oreo says what it is called and does it once (the trick's own animation), then is still.
 */
export function Shelf({ tricks, awards, soundOff }: { tricks: Trick[]; awards: Award[]; soundOff: boolean }) {
  // `n` counts taps, so that tapping the same trick again does it again.
  const [show, setShow] = useState<{ trick: Trick; n: number } | null>(null);
  useEffect(() => () => voice.stop(), []);
  if (!tricks.length && !awards.length) return null;
  const tap = (t: Trick) => {
    setShow((s) => ({ trick: t, n: (s?.n ?? 0) + 1 }));
    if (!soundOff) speak([TRICK_SAYS[t]]);
  };
  return (
    <div className="rewardshelf" data-testid="rewardshelf">
      <h2>Oreo’s tricks</h2>
      <div className="tricks">
        {tricks.map((t, i) => (
          <button key={`${t}${i}`} type="button" className="trickbtn" aria-pressed={show?.trick === t} data-trick={t} onClick={() => tap(t)}>
            <span className="trickframe"><img src={TRICK_PICS[t]} alt="" draggable={false} /></span>
            <span className="trickname">{TRICK_NAMES[t]}</span>
          </button>
        ))}
        {awards.map((a) => <img key={a} className="awardpic" src={AWARD_PICS[a]} alt={AWARD_NAMES[a]} draggable={false} />)}
      </div>
      {show && (
        <div className="trickshow" data-testid="trickshow">
          <OreoAnim key={show.n} name={`trick-${show.trick}`} className="rewardpup" alt={`Oreo’s trick: ${TRICK_NAMES[show.trick]}`} />
          <p className="sub">{wording(TRICK_SAYS[show.trick])}</p>
        </div>
      )}
    </div>
  );
}
