import { useEffect } from 'react';
import type { Lesson } from '../engine/curriculum';
import type { Choice } from '../engine/today';
import { wording } from '../speech/catalogue';
import { Oreo } from '../ui/Oreo';
import { speak, voice } from './voice';

/**
 * A choice between two things the app has already decided she will do today. Whichever she taps
 * is right, both get done, and there is no way to choose less work.
 */
export function ChoiceCard({ choice, soundOff, onChoose, onHome }: { choice: Choice; soundOff: boolean; onChoose: (l: Lesson) => void; onHome: () => void }) {
  useEffect(() => {
    if (!soundOff) speak(['which-one-would-you-like-first'], 0.2);
    return () => voice.stop();
  }, [soundOff]);
  return (
    <section>
      <div className="gbar">
        <button className="back" type="button" onClick={onHome}>← Home</button>
      </div>
      <div className="card game" data-testid="choice" data-choice={choice.kind}>
        <p className="prompt" data-testid="prompt">{wording('which-one-would-you-like-first')}</p>
        <div className="stage">
          <Oreo pose="pointing" className="endpup" />
          <div className="choosecards">
            {choice.options.map((l) => (
              <button key={l.id} type="button" className="choosecard" data-lesson={l.id} onClick={() => onChoose(l)}>
                <strong>{l.title}</strong>
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/** Before the first day: a short check of what she already knows, so that she does not start too far back. */
export function StartCheck({ name, n, soundOff, onStart, onSkip }: { name: string; n: number; soundOff: boolean; onStart: () => void; onSkip: () => void }) {
  useEffect(() => {
    if (!soundOff) speak(['lets-see-what-you-know'], 0.2);
    return () => voice.stop();
  }, [soundOff]);
  return (
    <section>
      <div className="card game" data-testid="startcheck">
        <p className="prompt" data-testid="prompt">{wording('lets-see-what-you-know')}</p>
        <div className="stage">
          <Oreo pose="hello" className="endpup" />
          <p className="sub">{n === 1 ? 'One question' : `${n} questions`} for {name}. What she gets right first time, she does not have to learn again; it still comes back in the warm-ups.</p>
        </div>
        <div className="controls">
          <button className="ctl o" type="button" onClick={onStart}>Start</button>
          <button className="ctl brk" type="button" onClick={onSkip}>For a grown-up: skip, start at the beginning</button>
        </div>
      </div>
    </section>
  );
}
