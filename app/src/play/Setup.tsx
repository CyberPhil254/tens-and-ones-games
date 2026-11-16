import { useState } from 'react';
import { cleanNickname, FRIENDS, type Friend, type Profile } from '../data/profile';
import { FriendPicture } from '../ui/FriendPicture';
import { Oreo } from '../ui/Oreo';

/** For a grown-up: add a child. A nickname, an animal and the stage, nothing else. */
export function AddChild({ first, onAdd, onCancel }: {
  first: boolean;
  onAdd: (nickname: string, picture: Friend, stage: 1 | 2) => void;
  onCancel?: () => void;
}) {
  const [name, setName] = useState('');
  const [picture, setPicture] = useState<Friend>('zebra');
  const [stage, setStage] = useState<1 | 2>(2);
  const nickname = cleanNickname(name);
  return (
    <section className="setup">
      <div className="top">
        <h1 className="title"><span className="t">Tens</span> <span className="amp">&amp;</span> <span className="o">Ones</span></h1>
        <Oreo pose="hello" className="toppup" />
      </div>
      <form
        className="today"
        onSubmit={(e) => {
          e.preventDefault();
          if (nickname) onAdd(nickname, picture, stage);
        }}
      >
        <h2>{first ? 'For a grown-up: who is going to play?' : 'For a grown-up: add a child'}</h2>
        <label className="field">
          <span>A nickname</span>
          <input value={name} onChange={(e) => setName(e.target.value)} maxLength={24} autoComplete="off" placeholder="For example Amani" />
        </label>
        <fieldset className="field">
          <legend>A picture</legend>
          <div className="friends">
            {FRIENDS.map((f) => (
              <button key={f} type="button" className="friendbtn" aria-pressed={picture === f} aria-label={f} onClick={() => setPicture(f)}>
                <FriendPicture friend={f} />
              </button>
            ))}
          </div>
        </fieldset>
        <fieldset className="field">
          <legend>Where to start</legend>
          <div className="stages">
            <button type="button" className="stagebtn" aria-pressed={stage === 1} onClick={() => setStage(1)}>
              <strong>Stage 1</strong><span>Numbers to 20</span>
            </button>
            <button type="button" className="stagebtn" aria-pressed={stage === 2} onClick={() => setStage(2)}>
              <strong>Stage 2</strong><span>Numbers to 100</span>
            </button>
          </div>
        </fieldset>
        <p className="h2note">Only this is saved, on this device: the nickname, the picture, the stage and how she gets on. There is no account and no email.</p>
        <div className="trow">
          <button className="next" type="submit" disabled={!nickname}>Start</button>
          {onCancel && <button className="soundbtn" type="button" onClick={onCancel}>Cancel</button>}
        </div>
      </form>
    </section>
  );
}

/** Several children share the device: who is playing now? Pictures, so a child can choose herself. */
export function WhoIsPlaying({ profiles, onChoose, onAdd }: { profiles: Profile[]; onChoose: (id: string) => void; onAdd: () => void }) {
  return (
    <section className="setup">
      <div className="top">
        <h1 className="title">Who is playing?</h1>
        <Oreo pose="hello" className="toppup" />
      </div>
      <div className="who">
        {profiles.map((p) => (
          <button key={p.id} type="button" className="whobtn" onClick={() => onChoose(p.id)}>
            <FriendPicture friend={p.picture} size={96} />
            <strong>{p.nickname}</strong>
          </button>
        ))}
      </div>
      <button className="soundbtn" type="button" onClick={onAdd}>For a grown-up: add a child</button>
    </section>
  );
}
