import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { defaultSettings, newProfile, sameData, type Friend, type Profile, type ProfileData, type Settings } from '../data/profile';
import { deviceStore, type DataStore } from '../data/store';
import { dayOf } from '../engine/state';

const storage = () => {
  try {
    return window.localStorage;
  } catch {
    return undefined; // some browsers refuse storage altogether; the app then runs unsaved
  }
};
export const today = () => dayOf(new Date());

export interface Data {
  /** False until what is saved has been read. */
  ready: boolean;
  /**
   * Counts the times what is saved was changed from outside this window (the app open a second time on
   * the same device) and read in again. A screen that was built on the old data must be left.
   */
  changedElsewhere: number;
  settings: Settings;
  profiles: Profile[];
  /** The child who is playing. */
  current: ProfileData | null;
  saveSettings(s: Settings): void;
  /** Saves the current child's data. */
  save(d: ProfileData): void;
  choose(id: string | null): void;
  create(nickname: string, picture: Friend, stage: 1 | 2): void;
  /** Adds a profile loaded from a code. A profile with the same id is replaced. */
  adopt(d: ProfileData): void;
  remove(id: string): void;
}

/** Everything saved, read once and kept in step with the store. The screens see plain values. */
export function useData(): Data {
  const store: DataStore = useMemo(() => deviceStore(storage(), today), []);
  const [ready, setReady] = useState(false);
  const [settings, setSettings] = useState<Settings>(defaultSettings);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [current, setCurrent] = useState<ProfileData | null>(null);
  const settingsNow = useRef(settings);
  const [changedElsewhere, setChangedElsewhere] = useState(0);
  /** What this window believes is saved for the child who is playing, and whether the device took the last save. */
  const currentNow = useRef<ProfileData | null>(null);
  const unsaved = useRef(false);
  const show = useCallback((d: ProfileData | null) => {
    currentNow.current = d;
    setCurrent(d);
  }, []);

  useEffect(() => {
    let alive = true;
    void (async () => {
      const [s, list] = await Promise.all([store.settings(), store.profiles()]);
      // With one child on the device she is who is playing; with several, the last one who played.
      const id = list.length === 1 ? list[0]!.id : list.find((p) => p.id === s.current)?.id;
      const data = id ? await store.load(id) : null;
      if (!alive) return;
      settingsNow.current = s;
      setSettings(s);
      setProfiles(list);
      show(data);
      setReady(true);
    })();
    return () => {
      alive = false;
    };
  }, [store, show]);

  const saveSettings = useCallback((s: Settings) => {
    settingsNow.current = s;
    setSettings(s);
    void store.saveSettings(s);
  }, [store]);

  const save = useCallback((d: ProfileData) => {
    show(d);
    setProfiles((list) => (list.some((p) => p.id === d.profile.id) ? list.map((p) => (p.id === d.profile.id ? d.profile : p)) : [...list, d.profile]));
    void store.save(d).then((ok) => { unsaved.current = !ok; });
  }, [store, show]);

  const choose = useCallback((id: string | null) => {
    saveSettings({ ...settingsNow.current, current: id ?? undefined });
    if (!id) return show(null);
    void store.load(id).then(show);
  }, [store, saveSettings, show]);

  // The app can be open twice on one device: a browser tab beside the installed app, or two tabs. Each window
  // holds the child's data in memory and saves all of it, so a window that did not notice "Start again" in
  // the other would show the old progress and write it back with its next save. So: whenever another window
  // changes what is saved, and whenever this one comes back into view, what is saved is read again; if it is
  // not what this window has, this window takes it over and leaves whatever screen it was on.
  useEffect(() => {
    if (!ready) return;
    let alive = true;
    const refresh = async () => {
      if (unsaved.current) return; // the device is not keeping saves: memory is all there is
      const [s, list] = await Promise.all([store.settings(), store.profiles()]);
      const had = currentNow.current?.profile.id;
      const id = had && list.some((p) => p.id === had) ? had : list.length === 1 ? list[0]!.id : had ? undefined : list.find((p) => p.id === s.current)?.id;
      const data = id ? await store.load(id) : null;
      if (!alive) return;
      const sameList = (a: Profile[], b: Profile[]) => JSON.stringify(a) === JSON.stringify(b);
      setProfiles((old) => (sameList(old, list) ? old : list));
      if (JSON.stringify(s) !== JSON.stringify(settingsNow.current)) {
        settingsNow.current = s;
        setSettings(s);
      }
      if (sameData(currentNow.current, data, today())) return;
      show(data);
      setChangedElsewhere((n) => n + 1);
    };
    const onStorage = (e: StorageEvent) => { if (e.key === null || e.key.startsWith('tens-and-ones.')) void refresh(); };
    const onShow = () => { if (document.visibilityState === 'visible') void refresh(); };
    window.addEventListener('storage', onStorage);
    window.addEventListener('pageshow', onShow);
    document.addEventListener('visibilitychange', onShow);
    return () => {
      alive = false;
      window.removeEventListener('storage', onStorage);
      window.removeEventListener('pageshow', onShow);
      document.removeEventListener('visibilitychange', onShow);
    };
  }, [ready, store, show]);

  const adopt = useCallback((d: ProfileData) => {
    save(d);
    saveSettings({ ...settingsNow.current, current: d.profile.id });
  }, [save, saveSettings]);

  const create = useCallback((nickname: string, picture: Friend, stage: 1 | 2) => {
    const id = `child-${Date.now().toString(36)}${Math.floor(Math.random() * 1e6).toString(36)}`;
    adopt(newProfile(id, nickname, picture, stage, today()));
  }, [adopt]);

  const remove = useCallback((id: string) => {
    const left = profiles.filter((p) => p.id !== id);
    setProfiles(left);
    void store.remove(id).then(() => {
      // With one child left she is the one playing; with several, they choose.
      if (current?.profile.id === id) choose(left.length === 1 ? left[0]!.id : null);
    });
  }, [store, profiles, current, choose]);

  return { ready, changedElsewhere, settings, profiles, current, saveSettings, save, choose, create, adopt, remove };
}
