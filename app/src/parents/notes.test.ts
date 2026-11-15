import { describe, expect, it } from 'vitest';
import { LESSONS } from '../engine/curriculum';
import { NOTES, SOURCES, STRENGTH_WORDS } from './notes';

describe('the parent notes', () => {
  it('every lesson has one, and there are none for lessons that do not exist', () => {
    expect(Object.keys(NOTES).sort()).toEqual(LESSONS.map((l) => l.id).sort());
  });

  it.each(Object.entries(NOTES))('%s: two sentences, a source that exists, a strength', (_id, note) => {
    expect(note.why.match(/[.!?](?:\s|$)/g)).toHaveLength(2);
    expect(SOURCES[note.source]).toBeDefined();
    expect(STRENGTH_WORDS[note.strength]).toBeDefined();
  });

  it('says nothing the research file does not: no promises, no endorsement, no name of the curriculum', () => {
    const all = Object.values(NOTES).map((n) => n.why).join(' ') + Object.values(SOURCES).map((s) => s.label).join(' ');
    expect(all).not.toMatch(/endorse|cambridge|proven|guarantee|will make|always works/i);
  });

  it('a finding the research calls mixed or small is not called strong', () => {
    for (const note of Object.values(NOTES)) {
      if (note.source === 'frey' || note.source === 'schild') expect(note.strength).toBe('mixed');
      if (note.source === 'zhang' || note.source === 'fyfe') expect(note.strength).toBe('promising');
      if (note.source === 'eef' || note.source === 'fractions' || note.source === 'groups') expect(note.strength).toBe('guidance');
    }
  });
});
