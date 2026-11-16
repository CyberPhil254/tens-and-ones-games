import type { Lesson } from '../engine/curriculum';
import { NOTES, SOURCES, STRENGTH_WORDS } from './notes';

/**
 * The note for parents about one lesson: why it is built the way it is, where that comes from and
 * how strong the evidence is. Opened from the small link under a lesson in the garden, without the
 * parents' check, because nothing can be changed here.
 */
export function Why({ lesson, onBack, onApproach }: { lesson: Lesson; onBack: () => void; onApproach: () => void }) {
  const note = NOTES[lesson.id];
  const source = note && SOURCES[note.source];
  return (
    <section className="adult">
      <div className="adultcard" data-testid="why" data-lesson={lesson.id}>
        <p className="adultnote">For parents</p>
        <h1>Why this works: {lesson.title}</h1>
        {note && source ? (
          <>
            <p data-testid="why-text">{note.why}</p>
            <dl>
              <dt>Source</dt>
              <dd data-testid="why-source">{source.url ? <a href={source.url} target="_blank" rel="noreferrer">{source.label}</a> : source.label}</dd>
              <dt>How strong is the evidence?</dt>
              <dd data-testid="why-strength">{STRENGTH_WORDS[note.strength]}</dd>
            </dl>
          </>
        ) : <p>There is no note for this lesson yet.</p>}
        <p><button className="adultlink" type="button" onClick={onApproach}>How this app teaches</button></p>
        <div className="adultrow"><button className="adultbtn main" type="button" onClick={onBack}>Back to the game</button></div>
      </div>
    </section>
  );
}
