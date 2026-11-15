import { describe, expect, it } from 'vitest';
import { CONFIG } from './config';
import { LESSON, LESSONS, playable } from './curriculum';
import { newChild, newLesson, withLesson, type ChildState } from './state';
import { choiceToday, nextPart, type Part } from './today';

const day = '2026-11-15';
const known = (s: ChildState, id: string): ChildState =>
  withLesson(s, id, { ...newLesson(), step: LESSON.get(id)!.steps.length - 1, passedOn: ['2026-11-01', '2026-11-02'], mastered: '2026-11-02', due: '2026-12-20', rating: 3, answers: 30, reviews: 3 });

/** Plays today through, taking each part as done, and returns the kinds in order. */
function order(s: ChildState, chosen?: string, strongerFirst = false): Part[] {
  const parts: Part[] = [];
  for (;;) {
    const p = nextPart(s, day, parts.map((x) => x.kind), chosen, strongerFirst);
    if (!p) return parts;
    parts.push(p);
    if (parts.length > 9) throw new Error('today never ends');
  }
}

describe('the choices she is offered', () => {
  it('two open lessons: she picks the stone, and the choice is honoured for both rounds', () => {
    const s = newChild();
    const c = choiceToday(s, day, []);
    expect(c?.kind).toBe('stone');
    for (const l of c!.options) {
      const news = order(s, l.id).filter((p) => p.kind === 'new');
      expect(news).toHaveLength(2);
      for (const p of news) expect(p.kind === 'new' && p.slot.lesson).toBe(l.id);
    }
  });

  it('which first: the same parts whichever she picks, only the order differs', () => {
    // Everything mastered but the last lesson: one lesson open, and a mastered one to get stronger at.
    let s = newChild();
    for (const l of LESSONS.filter(playable).slice(0, -1)) s = known(s, l.id);
    const c = choiceToday(s, day, ['warm']);
    expect(c?.kind).toBe('first');
    expect(c!.options[0].id).toBe('x-line');
    const a = order(s).map((p) => p.kind), b = order(s, undefined, true).map((p) => p.kind);
    expect([...a].sort()).toEqual([...b].sort());
    expect(a).toEqual(['warm', 'new', 'new', 'stronger']);
    expect(b).toEqual(['warm', 'stronger', 'new', 'new']);
  });

  it('no choice once a round of the lesson has been played, and never an option that means less work', () => {
    const s = newChild();
    expect(choiceToday(s, day, ['new'])).toBeNull();
    expect(choiceToday(s, day, ['warm', 'stronger'])).toBeNull();
    for (const first of [false, true]) {
      const parts = order(s, undefined, first);
      expect(parts.filter((p) => p.kind === 'new')).toHaveLength(2);
      for (const p of parts) expect(p.n).toBeGreaterThanOrEqual(CONFIG.warmUp);
    }
  });
});
