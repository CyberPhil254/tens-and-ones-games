import { SOURCES } from './notes';

/** One page, in plain words: how the app teaches and what that rests on. No promises beyond the sources. */
export function Approach({ onBack }: { onBack: () => void }) {
  return (
    <section className="parents" data-testid="approach">
      <div className="gbar"><button className="back" type="button" onClick={onBack}>← Back</button></div>
      <h1 className="ptitle">How this app teaches</h1>
      <div className="pcard prose">
        <p>Tens and Ones is maths practice for learners following the Cambridge Primary curriculum, Stages 1 and 2, the Number part: counting, tens and ones, adding and taking away to 100, equal groups, halves and quarters, money. The lessons are written in our own words.</p>
        <h2>Ten minutes a day</h2>
        <p>One short session a day: a warm-up, two rounds of the next lesson, one round on what is weakest. Trials of structured maths apps used 15 to 30 minutes a day at school. Ten minutes at home, on top of school, is our own judgement; no study has tested exactly that.</p>
        <h2>See it, sketch it, do it in your head, use it</h2>
        <p>Every lesson starts with something to see and move: blocks, fingers, a ten frame, a number line. Then the picture becomes a sketch, then it is gone, and at the end the idea is used in a small story. Tens are always red rods, ones are always blue, in every lesson.</p>
        <h2>The app chooses, the child cannot skip</h2>
        <p>Young children cannot yet judge what they need to practise, so the app decides what comes next and there is no skip button. A lesson opens when what it is built on has been done. She does get to choose, but only between things that are both on today’s list, and which treasure Oreo gets.</p>
        <h2>Mastered means remembered</h2>
        <p>A lesson counts as mastered when its last step is passed on two different days. After that it comes back in the warm-ups after 1, 3, 7, 14 and 30 days, mixed with other lessons. If it is forgotten, it opens again.</p>
        <h2>A wrong answer is explained</h2>
        <p>The app never just says “wrong”. It shows or says why, with the same picture the lesson uses, and she tries again. If a step is too hard the picture comes back.</p>
        <h2>No clock, no pressure</h2>
        <p>Nothing on a child’s screen counts time. The app does notice quietly how long answers take, to see what is known but slow. The one speed game, Quick Paws, opens only for facts she has already mastered.</p>
        <h2>Rewards for what she has learnt</h2>
        <p>Bones are for right answers and are packed in tens. Treasures, tricks and awards come only from mastering lessons, never from minutes played. There are no lives, no streaks to lose, no surprise prizes and nothing to buy.</p>
        <h2>Plain screens</h2>
        <p>A question screen shows the question and nothing else. Oreo reacts to answers and is still while the child thinks. Instructions are spoken and can be heard again.</p>
        <h2>Together is better</h2>
        <p>Children whose parents used a maths app with them, even once a week, did better in maths at school. Ask “How did you know?” and play Race to 100 with her.</p>
        <h2>What is saved</h2>
        <p>A nickname, an animal picture, the stage and the progress, on this device only. No account, no email, no advertising, no tracking, and nothing is sent to anyone.</p>
        <h2>How sure are we?</h2>
        <p>Each lesson has a note in the parents’ area that names its source and says how strong the evidence is. Some of it is strong, some is one small study, some is expert guidance without a trial, and for a few ideas studies disagree. We say which.</p>
      </div>
      <div className="pcard">
        <h2>Sources</h2>
        <ul className="sources">
          {Object.entries(SOURCES).map(([id, s]) => (
            <li key={id}>{s.url ? <a href={s.url} target="_blank" rel="noreferrer">{s.label}</a> : s.label}</li>
          ))}
        </ul>
      </div>
    </section>
  );
}
