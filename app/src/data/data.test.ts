import { describe, expect, it } from 'vitest';
import { place, roundFinished } from '../engine/rules';
import { lessonState, withLesson } from '../engine/state';
import { addAttempt, cleanNickname, exportCode, FRIENDS, importCode, KEEP_ATTEMPTS, newProfile, readProfileData, sameData, type Attempt } from './profile';
import { deviceStore } from './store';

const TODAY = '2026-11-16';
const memory = () => {
  const m = new Map<string, string>();
  return { m, getItem: (k: string) => m.get(k) ?? null, setItem: (k: string, v: string) => void m.set(k, v), removeItem: (k: string) => void m.delete(k) };
};
const attempt: Attempt = { lesson: 's1-ten', step: 1, part: 'new', clean: true, misses: 0, hint: false, ms: 2300, at: '2026-11-16T15:04:05.000Z' };
/** A profile with some real progress in it. */
function played() {
  let d = newProfile('child-1', 'Amani', 'zebra', 1, TODAY);
  let child = place(d.child, 's1-see', TODAY);
  child = withLesson(child, 's1-ten', { ...lessonState(child, 's1-ten'), step: 2 });
  child = roundFinished(child, 's1-ten', 6, TODAY).state;
  d = { ...d, child: { ...child, doneOn: TODAY }, bones: 37, best: 41, checked: true, rewards: { treasures: { t1: 'ball' }, tricks: {}, awards: {} } };
  return addAttempt(d, attempt);
}

describe('profiles', () => {
  it('keep only a nickname, a picture, a stage and progress', () => {
    const d = newProfile('child-1', 'Amani', 'zebra', 2, TODAY);
    expect(Object.keys(d.profile).sort()).toEqual(['created', 'id', 'nickname', 'picture', 'stage']);
    expect(d.checked).toBe(false);
  });
  it('clean a nickname: letters, digits and spaces, at most 16', () => {
    expect(cleanNickname('  Amani  K. ')).toBe('Amani K');
    expect(cleanNickname('<b>x</b>')).toBe('bxb');
    expect(cleanNickname('Zoë Müller-Ochieng the Third')).toBe('Zoë MüllerOchien');
    expect(newProfile('child-2', '!!!', 'kitten', 1, TODAY).profile.nickname).toBe('Friend');
  });
  it('have nine animal pictures to choose from', () => {
    expect(FRIENDS).toHaveLength(9);
  });
  it('keep only the newest answers', () => {
    let d = newProfile('child-1', 'A', 'kitten', 2, TODAY);
    for (let i = 0; i < KEEP_ATTEMPTS + 5; i++) d = addAttempt(d, { ...attempt, ms: i });
    expect(d.attempts).toHaveLength(KEEP_ATTEMPTS);
    expect(d.attempts[0]!.ms).toBe(5);
  });
});

describe('reading saved data', () => {
  it('gives back exactly what was saved', () => {
    const d = played();
    expect(readProfileData(JSON.parse(JSON.stringify(d)), TODAY)).toEqual(d);
  });
  it('drops what does not belong and repairs what is out of range', () => {
    const raw = JSON.parse(JSON.stringify(played()));
    raw.profile.picture = 'dragon';
    raw.profile.email = 'someone@example.com';
    raw.child.lessons['made-up'] = { step: 1 };
    raw.child.lessons['s1-ten'].step = 99;
    raw.child.lessons['s1-ten'].rating = 'high';
    raw.attempts.push({ lesson: 'made-up', at: 'yesterday' });
    raw.bones = -5;
    const d = readProfileData(raw, TODAY)!;
    expect(d.profile.picture).toBe('kitten');
    expect(d.profile).not.toHaveProperty('email');
    expect(Object.keys(d.child.lessons).sort()).toEqual(['s1-see', 's1-ten']);
    expect(d.child.lessons['s1-ten']).toMatchObject({ step: 2, rating: 0 });
    expect(d.attempts).toHaveLength(1);
    expect(d.bones).toBe(0);
  });
  it('refuses what is not a profile', () => {
    for (const raw of [null, 7, 'x', [], {}, { profile: { id: '../../etc', nickname: 'x' } }]) expect(readProfileData(raw, TODAY)).toBeNull();
  });
});

describe('moving a profile to another device', () => {
  it('goes out as a code and comes back the same, without the answer log', () => {
    const d = played();
    const code = exportCode(d);
    expect(code).toMatch(/^TENS1\.[A-Za-z0-9_-]+$/);
    expect(importCode(`  ${code}\n`, TODAY)).toEqual({ ...d, attempts: [] });
  });
  it('keeps letters from any language in the nickname', () => {
    const d = newProfile('child-3', 'Zoë 明', 'lion', 1, TODAY);
    expect(importCode(exportCode(d), TODAY)!.profile.nickname).toBe('Zoë 明');
  });
  it('refuses anything else that is pasted in', () => {
    for (const junk of ['', 'hello', 'TENS1.', 'TENS1.!!!!', 'TENS1.e30', `TENS9.${exportCode(played()).slice(6)}`]) expect(importCode(junk, TODAY)).toBeNull();
  });
});

describe('the device store', () => {
  it('keeps several children apart', async () => {
    const store = deviceStore(memory(), () => TODAY);
    expect(await store.profiles()).toEqual([]);
    const a = played(), b = newProfile('child-2', 'Baraka', 'lion', 1, TODAY);
    expect(await store.save(a)).toBe(true);
    expect(await store.save(b)).toBe(true);
    expect(await store.save({ ...a, bones: 40 })).toBe(true);
    expect((await store.profiles()).map((p) => p.nickname)).toEqual(['Amani', 'Baraka']);
    expect((await store.load('child-1'))!.bones).toBe(40);
    expect((await store.load('child-2'))!.child.lessons).toEqual({});
    await store.remove('child-1');
    expect((await store.profiles()).map((p) => p.id)).toEqual(['child-2']);
    expect(await store.load('child-1')).toBeNull();
  });
  it('remembers the settings, with Oreo as Star\'s sister off unless a parent turns it on', async () => {
    const store = deviceStore(memory(), () => TODAY);
    expect(await store.settings()).toEqual({ soundOff: false, currency: 'KES', starsSister: false });
    await store.saveSettings({ soundOff: true, currency: 'KES', starsSister: true, current: 'child-2' });
    expect(await store.settings()).toEqual({ soundOff: true, currency: 'KES', starsSister: true, current: 'child-2' });
  });
  it('carries on without storage, with broken storage and with rubbish in it', async () => {
    const none = deviceStore(undefined, () => TODAY);
    expect(await none.profiles()).toEqual([]);
    expect(await none.save(played())).toBe(false);
    const full = deviceStore({ getItem: () => null, setItem: () => { throw new Error('full'); }, removeItem: () => {} }, () => TODAY);
    expect(await full.save(played())).toBe(false);
    const s = memory();
    s.m.set('tens-and-ones.profiles', '{not json');
    s.m.set('tens-and-ones.settings', '[1,2');
    const broken = deviceStore(s, () => TODAY);
    expect(await broken.profiles()).toEqual([]);
    expect(await broken.settings()).toEqual({ soundOff: false, currency: 'KES', starsSister: false });
  });
  it('stores nothing but what is in a profile', async () => {
    const s = memory();
    await deviceStore(s, () => TODAY).save(played());
    expect([...s.m.keys()].sort()).toEqual(['tens-and-ones.profile.child-1', 'tens-and-ones.profiles']);
    expect(Object.keys(JSON.parse(s.m.get('tens-and-ones.profile.child-1')!)).sort()).toEqual(['attempts', 'best', 'bones', 'checked', 'child', 'profile', 'rewards']);
  });
});

describe('telling whether two profiles hold the same data', () => {
  it('does not mind how each was put together, and notices every real difference', () => {
    const d = played();
    const reread = readProfileData(JSON.parse(JSON.stringify(d)), TODAY)!;
    const shuffled = Object.fromEntries(Object.entries(d).reverse()) as typeof d; // the same fields in another order
    expect(sameData(d, reread, TODAY)).toBe(true);
    expect(sameData(d, shuffled, TODAY)).toBe(true);
    expect(sameData(null, null, TODAY)).toBe(true);
    expect(sameData(d, null, TODAY)).toBe(false);
    expect(sameData(d, { ...d, bones: d.bones + 1 }, TODAY)).toBe(false);
    expect(sameData(d, newProfile(d.profile.id, d.profile.nickname, d.profile.picture, d.profile.stage, d.profile.created), TODAY)).toBe(false); // started again
    expect(sameData(d, { ...d, profile: { ...d.profile, nickname: 'Zuri' } }, TODAY)).toBe(false);
  });
});
