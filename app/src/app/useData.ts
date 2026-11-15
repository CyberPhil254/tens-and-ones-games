import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { defaultSettings, newProfile, type Friend, type Profile, type ProfileData, type Settings } from '../data/profile';
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
      setCurrent(data);
      setReady(true);
    })();
    return () => {
      alive = false;
    };
  }, [store]);

  const saveSettings = useCallback((s: Settings) => {
    settingsNow.current = s;
    setSettings(s);
    void store.saveSettings(s);
  }, [store]);

  const save = useCallback((d: ProfileData) => {
    setCurrent(d);
    setProfiles((list) => (list.some((p) => p.id === d.profile.id) ? list.map((p) => (p.id === d.profile.id ? d.profile : p)) : [...list, d.profile]));
    void store.save(d);
  }, [store]);

  const choose = useCallback((id: string | null) => {
    saveSettings({ ...settingsNow.current, current: id ?? undefined });
    if (!id) return setCurrent(null);
    void store.load(id).then(setCurrent);
  }, [store, saveSettings]);

  const adopt = useCallback((d: ProfileData) => {
    save(d);
    saveSettings({ ...settingsNow.current, current: d.profile.id });
  }, [save, saveSettings]);

  const create = useCallback((nickname: string, picture: Friend, stage: 1 | 2) => {
    const id = `child-${Date.now().toString(36)}${Math.floor(Math.random() * 1e6).toString(36)}`;
    adopt(newProfile(id, nickname, picture, stage, today()));
  }, [adopt]);

  const remove = useCallback((id: string) => {
    setProfiles((list) => list.filter((p) => p.id !== id));
    setCurrent((c) => (c?.profile.id === id ? null : c));
    void store.remove(id);
  }, [store]);

  return { ready, settings, profiles, current, saveSettings, save, choose, create, adopt, remove };
}
