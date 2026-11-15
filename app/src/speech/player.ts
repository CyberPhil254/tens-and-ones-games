/**
 * Plays recorded clips one after another. Everything spoken is a recording: if the voice pack
 * cannot be loaded the app stays silent (the words are on screen), it never falls back to a
 * computer voice.
 *
 * The pack is one audio file plus an index of where each clip starts: { clipId: [offset, length] }.
 */
import { CLIP_BY_ID, clipIds } from './catalogue';
import type { Piece } from './script';

export type VoiceIndex = Record<string, [offset: number, length: number]>;

/** The few parts of the Web Audio API the player uses, so tests can stand in for it. */
export interface AudioOut {
  readonly currentTime: number;
  readonly state?: string;
  resume?: () => Promise<void>;
  decodeAudioData(data: ArrayBuffer): Promise<{ duration: number }>;
  /** Schedules a decoded clip and returns a way to cut it off. */
  play(buffer: { duration: number }, at: number): { stop(): void };
}

export interface VoiceSource {
  loadIndex(): Promise<VoiceIndex>;
  loadAudio(): Promise<ArrayBuffer>;
}

/** Seconds of silence after a clip: a breath after a sentence, almost none inside one. */
const GAP_AFTER_SENTENCE = 0.26;
const GAP_INSIDE = 0.04;
const LEAD_IN = 0.03;

export class VoicePlayer {
  private state: 'idle' | 'loading' | 'ready' | 'failed' = 'idle';
  private loading: Promise<void> | null = null;
  private index: VoiceIndex = {};
  private audio: ArrayBuffer | null = null;
  private decoded = new Map<string, Promise<{ duration: number } | null>>();
  private live: { stop(): void }[] = [];
  private turn = 0;
  private listeners = new Set<() => void>();
  private talking = false;
  private quiet: ReturnType<typeof setTimeout> | undefined;

  constructor(
    private readonly source: VoiceSource,
    private readonly out: () => AudioOut,
  ) {}

  /** True once loading has failed: the app then shows words only. */
  get silent(): boolean {
    return this.state === 'failed';
  }

  /** True from the moment something is said until its last clip has ended. */
  get speaking(): boolean {
    return this.talking;
  }

  private setTalking(on: boolean): void {
    clearTimeout(this.quiet);
    if (this.talking === on) return;
    this.talking = on;
    this.listeners.forEach((fn) => fn());
  }

  /** Calls `fn` whenever the player starts or stops speaking, becomes silent or gets its voice back. Returns a way to stop listening. */
  onChange(fn: () => void): () => void {
    this.listeners.add(fn);
    return () => void this.listeners.delete(fn);
  }

  /** Tries to fetch the voice pack again after a failure. */
  retry(): Promise<void> {
    if (this.state !== 'failed') return this.load();
    this.loading = null;
    this.state = 'idle';
    return this.load();
  }

  /** Fetches the voice pack. Safe to call more than once; say() calls it when needed. */
  load(): Promise<void> {
    if (this.loading) return this.loading;
    this.state = 'loading';
    this.loading = Promise.all([this.source.loadIndex(), this.source.loadAudio()]).then(
      ([index, audio]) => {
        this.index = index;
        this.audio = audio;
        this.state = 'ready';
        this.listeners.forEach((fn) => fn());
      },
      () => {
        this.state = 'failed';
        this.listeners.forEach((fn) => fn());
      },
    );
    return this.loading;
  }

  /** Cuts off whatever is being said. */
  stop(): void {
    this.turn++;
    for (const s of this.live) {
      try {
        s.stop();
      } catch {
        /* already finished */
      }
    }
    this.live = [];
    this.setTalking(false);
  }

  /**
   * Says the pieces in order, replacing anything still being said.
   * Resolves with the clip ids that were scheduled (none when silent or interrupted).
   */
  async say(pieces: readonly Piece[], delay = 0): Promise<string[]> {
    const ids = clipIds(pieces);
    if (!ids.length) return [];
    this.stop();
    const mine = this.turn;

    let out: AudioOut;
    try {
      out = this.out();
      if (out.state === 'suspended') void out.resume?.();
    } catch {
      return [];
    }
    await this.load();
    if (mine !== this.turn || this.state !== 'ready') return [];

    const buffers = await Promise.all(ids.map((id) => this.buffer(id, out)));
    if (mine !== this.turn) return [];

    const said: string[] = [];
    let at = out.currentTime + delay + LEAD_IN;
    buffers.forEach((b, i) => {
      if (!b) return;
      const id = ids[i]!;
      this.live.push(out.play(b, at));
      said.push(id);
      at += b.duration + (CLIP_BY_ID.get(id)!.endsSentence ? GAP_AFTER_SENTENCE : GAP_INSIDE);
    });
    if (said.length) {
      this.setTalking(true);
      this.quiet = setTimeout(() => mine === this.turn && this.setTalking(false), (at - out.currentTime) * 1000);
    }
    return said;
  }

  private buffer(id: string, out: AudioOut): Promise<{ duration: number } | null> {
    let p = this.decoded.get(id);
    if (!p) {
      const where = this.index[id];
      p = where && this.audio
        ? out.decodeAudioData(this.audio.slice(where[0], where[0] + where[1])).catch(() => null)
        : Promise.resolve(null);
      this.decoded.set(id, p);
    }
    return p;
  }
}

/** The player the app uses: the voice pack under /voice/, played through the browser. */
export function browserVoice(base = '/voice/'): VoicePlayer {
  let ctx: AudioContext | null = null;
  const get = async (file: string) => {
    const r = await fetch(base + file);
    if (!r.ok) throw new Error(`${file}: ${r.status}`);
    return r;
  };
  return new VoicePlayer(
    {
      loadIndex: async () => (await get('index.json')).json() as Promise<VoiceIndex>,
      loadAudio: async () => (await get('voice.mp3')).arrayBuffer(),
    },
    () => {
      ctx ??= new AudioContext();
      const c = ctx;
      return {
        get currentTime() {
          return c.currentTime;
        },
        get state() {
          return c.state;
        },
        resume: () => c.resume(),
        decodeAudioData: (data) => c.decodeAudioData(data),
        play(buffer, at) {
          const src = c.createBufferSource();
          src.buffer = buffer as AudioBuffer;
          src.connect(c.destination);
          src.start(at);
          return src;
        },
      };
    },
  );
}
