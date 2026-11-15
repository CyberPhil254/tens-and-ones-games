/** Two little yips for a right answer. Made in the browser, not a recording, and it says no words. */
let ctx: AudioContext | null = null;

export function chime(): void {
  try {
    ctx ??= new AudioContext();
    const ac = ctx;
    [520, 600].forEach((f, i) => {
      const o = ac.createOscillator(), g = ac.createGain(), t = ac.currentTime + i * 0.17;
      o.type = 'triangle';
      o.frequency.setValueAtTime(f, t);
      o.frequency.exponentialRampToValueAtTime(f * 1.7, t + 0.09);
      o.connect(g);
      g.connect(ac.destination);
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.16, t + 0.015);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.13);
      o.start(t);
      o.stop(t + 0.16);
    });
  } catch {
    /* no audio on this device */
  }
}
