import { describe, expect, it, vi } from 'vitest';
import { VoicePlayer, type AudioOut, type VoiceIndex } from './player';

/** A stand-in for the browser's audio: every clip lasts one second. */
function fakeAudio(now = 5) {
  const started: { at: number; bytes: number }[] = [];
  let stopped = 0;
  const out: AudioOut = {
    currentTime: now,
    decodeAudioData: async (data) => ({ duration: 1, bytes: data.byteLength }),
    play: (buffer, at) => {
      started.push({ at: Math.round(at * 100) / 100, bytes: (buffer as unknown as { bytes: number }).bytes });
      return { stop: () => void stopped++ };
    },
  };
  return { out, started, stopped: () => stopped };
}

const index: VoiceIndex = {
  packs: ['core', 'extra'],
  clips: {
    'num.47.mid': [0, 0, 10], 'frag.plus': [0, 10, 20], 'num.10.mid': [0, 30, 30], 'frag.is': [0, 60, 40], 'num.57.end': [0, 100, 50],
    'only-the-tens-change': [0, 150, 60], 'try-again': [0, 210, 70], 'well-done': [1, 0, 80],
  },
};
const source = (fail = false) => {
  const loaded: string[] = [];
  return {
    loads: () => loaded.length,
    loaded,
    loadIndex: async () => index,
    loadPack: async (name: string) => {
      loaded.push(name);
      if (fail) throw new Error('offline');
      return new ArrayBuffer(300);
    },
  };
};

describe('VoicePlayer', () => {
  it('plays the clips in order: almost no gap inside a sentence, a breath after it', async () => {
    const a = fakeAudio();
    const player = new VoicePlayer(source(), () => a.out);
    const said = await player.say([47, 'plus', 10, 'is', 57, 'Only the tens change.']);
    expect(said).toEqual(['num.47.mid', 'frag.plus', 'num.10.mid', 'frag.is', 'num.57.end', 'only-the-tens-change']);
    // 1 s clips: +1.04 inside the sentence, +1.26 after "57."
    expect(a.started.map((s) => s.at)).toEqual([5.03, 6.07, 7.11, 8.15, 9.19, 10.45]);
    // Each clip is cut from the pack at its own place.
    expect(a.started.map((s) => s.bytes)).toEqual([10, 20, 30, 40, 50, 60]);
  });

  it('says it is speaking until the last clip has ended, and stops saying so when cut off', async () => {
    vi.useFakeTimers();
    try {
      const a = fakeAudio();
      const player = new VoicePlayer(source(), () => a.out);
      const seen: boolean[] = [];
      player.onChange(() => seen.push(player.speaking));
      await player.say(['try-again']); // one clip of 1 s, a lead-in and a breath after it
      expect(player.speaking).toBe(true);
      vi.advanceTimersByTime(1200);
      expect(player.speaking).toBe(true);
      vi.advanceTimersByTime(200);
      expect(player.speaking).toBe(false);

      await player.say(['try-again']);
      player.stop();
      expect(player.speaking).toBe(false);
      expect(seen.filter((s, i) => s !== (seen[i - 1] ?? false))).toEqual([true, false, true, false]);
    } finally {
      vi.useRealTimers();
    }
  });

  it('fetches a pack only when something in it is said', async () => {
    const a = fakeAudio(), s = source();
    const player = new VoicePlayer(s, () => a.out);
    await player.say(['try-again']);
    expect(s.loaded).toEqual(['core']);
    await player.say(['well-done']);
    expect(s.loaded).toEqual(['core', 'extra']);
    expect(a.started.at(-1)!.bytes).toBe(80);
  });

  it('loads the pack once', async () => {
    const a = fakeAudio(), s = source();
    const player = new VoicePlayer(s, () => a.out);
    await player.say(['try-again']);
    await player.say(['try-again']);
    expect(s.loads()).toBe(1);
  });

  it('cuts off the last sentence when a new one starts', async () => {
    const a = fakeAudio();
    const player = new VoicePlayer(source(), () => a.out);
    await player.say(['try-again']);
    await player.say(['Only the tens change.']);
    expect(a.stopped()).toBe(1);
  });

  it('drops a sentence that is overtaken while it loads', async () => {
    const a = fakeAudio();
    const player = new VoicePlayer(source(), () => a.out);
    const first = player.say(['try-again']);
    const second = player.say(['Only the tens change.']);
    expect(await first).toEqual([]);
    expect(await second).toEqual(['only-the-tens-change']);
    expect(a.started).toHaveLength(1);
  });

  it('stays silent when the pack cannot be loaded, and never throws', async () => {
    const a = fakeAudio();
    const player = new VoicePlayer(source(true), () => a.out);
    expect(await player.say(['try-again'])).toEqual([]);
    expect(player.silent).toBe(true);
    expect(a.started).toEqual([]);
  });

  it('can be asked to try again, and then speaks', async () => {
    const a = fakeAudio();
    let online = false;
    const changes: boolean[] = [];
    const player = new VoicePlayer(
      { loadIndex: async () => index, loadPack: async () => { if (!online) throw new Error('offline'); return new ArrayBuffer(300); } },
      () => a.out,
    );
    player.onChange(() => changes.push(player.silent));
    await player.say(['try-again']);
    expect(player.silent).toBe(true);
    online = true;
    await player.retry();
    expect(player.silent).toBe(false);
    expect(await player.say(['try-again'])).toEqual(['try-again']);
    expect(changes.filter((s, i) => s !== (changes[i - 1] ?? false))).toEqual([true, false]);
  });

  it('stays silent when the device has no audio', async () => {
    const player = new VoicePlayer(source(), () => {
      throw new Error('no audio');
    });
    expect(await player.say(['try-again'])).toEqual([]);
  });

  it('refuses a sentence that has no recording', async () => {
    const a = fakeAudio();
    const player = new VoicePlayer(source(), () => a.out);
    await expect(player.say(['Something new.'])).rejects.toThrow(/No recorded clip/);
  });
});
