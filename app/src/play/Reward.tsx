import { useEffect, useState } from 'react';
import crown from '../art/rewards/award-crown.webp';
import rosette from '../art/rewards/award-rosette.webp';
import trophy from '../art/rewards/award-trophy.webp';
import gift from '../art/rewards/gift.webp';
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
  useEffect(() => {
    if (!soundOff) speak([sentence], 0.2);
    return () => voice.stop();
  }, [sentence, soundOff]);

  return (
    <section>
      <div className="card game" data-testid="reward" data-reward={earned.kind}>
        <p className="prompt" data-testid="prompt">{wording(sentence)}</p>
        <div className="stage">
          {earned.kind === 'treasure' && !picked && (
            <>
              <img className="rewardpic small" src={gift} alt="Oreo with a present" draggable={false} />
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
              <img className="rewardpic hop" src={TRICK_PICS[earned.trick]} alt={`Oreo’s trick: ${TRICK_NAMES[earned.trick]}`} draggable={false} />
              <p className="sub">{TRICK_NAMES[earned.trick]}</p>
            </>
          )}
          {earned.kind === 'award' && (
            <>
              <img className="rewardpic hop" src={AWARD_PICS[earned.award]} alt={AWARD_NAMES[earned.award]} draggable={false} />
              <p className="sub">{AWARD_NAMES[earned.award]}</p>
            </>
          )}
        </div>
        {(earned.kind !== 'treasure' || picked) && (
          <div className="controls">
            <button className="ctl o" type="button" onClick={() => onDone(picked ?? undefined)}>Next</button>
          </div>
        )}
      </div>
    </section>
  );
}

/** On the home screen: the tricks Oreo knows and the awards won. Tapping a trick shows it. */
export function Shelf({ tricks, awards }: { tricks: Trick[]; awards: Award[] }) {
  const [show, setShow] = useState<Trick | null>(null);
  if (!tricks.length && !awards.length) return null;
  return (
    <div className="rewardshelf" data-testid="rewardshelf">
      <h2>Oreo’s tricks</h2>
      <div className="tricks">
        {tricks.map((t, i) => (
          <button key={`${t}${i}`} type="button" className="trickbtn" aria-pressed={show === t} aria-label={TRICK_NAMES[t]} onClick={() => setShow(show === t ? null : t)}>
            <img src={TRICK_PICS[t]} alt="" draggable={false} />
          </button>
        ))}
        {awards.map((a) => <img key={a} className="awardpic" src={AWARD_PICS[a]} alt={AWARD_NAMES[a]} draggable={false} />)}
      </div>
      {show && <img key={show} className="rewardpic hop" src={TRICK_PICS[show]} alt={`Oreo’s trick: ${TRICK_NAMES[show]}`} draggable={false} />}
    </div>
  );
}
