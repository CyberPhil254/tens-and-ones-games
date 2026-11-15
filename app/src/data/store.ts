/**
 * The one door all saved data goes through. Today it opens onto the device's own storage;
 * accounts and sync can later be another implementation of the same interface, and no lesson
 * or screen has to change. Every method is asynchronous for that reason.
 */
import type { Day } from '../engine/state';
import { defaultSettings, readProfileData, readSettings, type Profile, type ProfileData, type Settings } from './profile';

export interface DataStore {
  /** The children on this device. */
  profiles(): Promise<Profile[]>;
  load(id: string): Promise<ProfileData | null>;
  /** Saves a profile. Resolves false when the device refused (private browsing, storage full): the game goes on unsaved. */
  save(data: ProfileData): Promise<boolean>;
  remove(id: string): Promise<void>;
  settings(): Promise<Settings>;
  saveSettings(s: Settings): Promise<boolean>;
}

type KeyValue = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;
const INDEX = 'tens-and-ones.profiles';
const SETTINGS = 'tens-and-ones.settings';
const key = (id: string) => `tens-and-ones.profile.${id}`;

/** Saved data on the device itself. `today` is used only to fill in a missing date. */
export function deviceStore(storage: KeyValue | undefined, today: () => Day): DataStore {
  const read = (k: string): unknown => {
    try {
      return JSON.parse(storage?.getItem(k) ?? 'null');
    } catch {
      return null;
    }
  };
  const write = (k: string, v: unknown): boolean => {
    try {
      if (!storage) return false;
      storage.setItem(k, JSON.stringify(v));
      return true;
    } catch {
      return false;
    }
  };
  const ids = (): string[] => {
    const v = read(INDEX);
    return Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : [];
  };
  const loadNow = (id: string) => readProfileData(read(key(id)), today());

  return {
    async profiles() {
      return ids().map(loadNow).filter((d): d is ProfileData => d !== null).map((d) => d.profile);
    },
    async load(id) {
      return loadNow(id);
    },
    async save(data) {
      const known = ids();
      const ok = write(key(data.profile.id), data);
      return ok && (known.includes(data.profile.id) || write(INDEX, [...known, data.profile.id]));
    },
    async remove(id) {
      write(INDEX, ids().filter((x) => x !== id));
      try {
        storage?.removeItem(key(id));
      } catch {
        /* nothing to remove */
      }
    },
    async settings() {
      const raw = read(SETTINGS);
      return raw ? readSettings(raw) : defaultSettings();
    },
    async saveSettings(s) {
      return write(SETTINGS, s);
    },
  };
}
