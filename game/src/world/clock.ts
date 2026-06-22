/**
 * WorldClock — authoritative in-game time, anchored to the wall clock.
 *
 * Time is derived from a real-time source (`Date.now()` by default) so the
 * in-game clock stays correct even when the Phaser timer throttles in a
 * background tab: on return, one `update()` catches the clock up to true time.
 *
 * `scale` is a realtime multiplier. At 1× a full in-game day takes 24 real
 * hours (the fishbowl default); at 60× it takes 24 real minutes (1 real second
 * ≈ 1 in-game minute — the old feel, for active watching).
 *
 * `tick()` is preserved as the one-minute boundary primitive: it advances
 * exactly one in-game minute and fires listeners. `update()` realizes the
 * wall-clock target by calling `tick()` for each whole minute crossed. The
 * now-source is injectable so everything stays testable in Node.
 */

export interface GameTime {
  day: number;
  hour: number;   // 0-23
  minute: number; // 0-59
}

type TimeListener = (t: GameTime) => void;

/** Minimal structural type for the Phaser scene timer — avoids a Phaser runtime import. */
interface SceneTimer {
  time: {
    addEvent(config: {
      delay: number;
      callback: () => void;
      loop: boolean;
    }): void;
  };
}

const MINUTES_PER_DAY = 24 * 60;
const MS_PER_REAL_MINUTE = 60_000;
/**
 * Cap on per-`update()` catch-up. A gap larger than this (a long-backgrounded
 * tab) jumps the clock to the target instead of firing thousands of per-minute
 * listeners and freezing the frame. Rich "while you were away" catch-up is
 * BACKLOG-106; this only keeps the realtime clock honest without hanging.
 */
const MAX_CATCHUP_TICKS = MINUTES_PER_DAY;

/** GameTime → absolute minutes since Day 1 00:00. */
function timeToAbs(t: GameTime): number {
  return (t.day - 1) * MINUTES_PER_DAY + t.hour * 60 + t.minute;
}

/** Absolute minutes since Day 1 00:00 → GameTime. */
function absToTime(abs: number): GameTime {
  const day = Math.floor(abs / MINUTES_PER_DAY) + 1;
  const rem = ((abs % MINUTES_PER_DAY) + MINUTES_PER_DAY) % MINUTES_PER_DAY;
  return { day, hour: Math.floor(rem / 60), minute: rem % 60 };
}

/** Pure helper: `t` moved forward by `minutes` (negative/fractional clamped to a whole step ≥ 0). */
export function advanceTime(t: GameTime, minutes: number): GameTime {
  return absToTime(timeToAbs(t) + Math.max(0, Math.floor(minutes)));
}

/**
 * Real-time cooldown gate (BACKLOG-333): has at least `cooldownMs` of wall-clock time passed since
 * `lastMs`? Used to pace migration off real time instead of the in-game clock, so the cadence holds at
 * any time scale (at the 1× default an in-game day is 24 real hours — far too sparse for a live beat).
 */
export function cooldownReady(nowMs: number, lastMs: number, cooldownMs: number): boolean {
  return nowMs - lastMs >= cooldownMs;
}

export class WorldClock {
  private _time: GameTime = { day: 1, hour: 8, minute: 0 };
  private _tickListeners: TimeListener[] = [];
  private _hourListeners: TimeListener[] = [];

  private _scale = 1; // realtime multiplier; 1× = 24 real hours per in-game day
  private _nowSource: () => number = () => Date.now();
  private _anchorEpochMs = 0;
  private _anchorAbsMin = 0;

  constructor() {
    this.reanchor();
  }

  /** Re-base the wall-clock anchor at the current time, so future elapsed counts from now. */
  private reanchor(): void {
    this._anchorEpochMs = this._nowSource();
    this._anchorAbsMin = timeToAbs(this._time);
  }

  /** Inject the real-time source (defaults to Date.now). Re-anchors. Test/dev hook. */
  setNowSource(fn: () => number): void {
    this._nowSource = fn;
    this.reanchor();
  }

  getScale(): number {
    return this._scale;
  }

  /** Change the realtime multiplier without jumping the displayed time. */
  setScale(s: number): void {
    if (!(s > 0)) return;
    this._scale = s;
    this.reanchor();
  }

  now(): GameTime {
    return { ...this._time };
  }

  /** Overwrite current time — used to restore a save. Re-anchors so flow continues from t. */
  set(t: GameTime): void {
    this._time = { ...t };
    this.reanchor();
  }

  onTick(fn: TimeListener): void {
    this._tickListeners.push(fn);
  }

  onHour(fn: TimeListener): void {
    this._hourListeners.push(fn);
  }

  tick(): void {
    const prevHour = this._time.hour;
    let total = this._time.hour * 60 + this._time.minute + 1;
    const dayWrap = Math.floor(total / MINUTES_PER_DAY);
    total = total % MINUTES_PER_DAY;
    this._time = {
      day: this._time.day + dayWrap,
      hour: Math.floor(total / 60),
      minute: total % 60,
    };
    const snapshot = { ...this._time };
    for (const fn of this._tickListeners) fn(snapshot);
    if (this._time.hour !== prevHour || dayWrap > 0) {
      for (const fn of this._hourListeners) fn(snapshot);
    }
  }

  /** Advance the clock to the wall-clock target. Called each frame/pump. */
  update(): void {
    const elapsedMs = this._nowSource() - this._anchorEpochMs;
    if (elapsedMs <= 0) return;
    const targetAbs = this._anchorAbsMin + Math.floor((elapsedMs * this._scale) / MS_PER_REAL_MINUTE);
    let behind = targetAbs - timeToAbs(this._time);
    if (behind <= 0) return;
    if (behind > MAX_CATCHUP_TICKS) {
      // Long gap: jump to target without flooding listeners (BACKLOG-106 owns the digest).
      this.set(absToTime(targetAbs));
      return;
    }
    while (behind-- > 0) this.tick();
  }

  start(scene: SceneTimer): void {
    this.reanchor();
    scene.time.addEvent({
      delay: 500,
      callback: () => this.update(),
      loop: true,
    });
  }
}

let _instance: WorldClock | null = null;

export function getWorldClock(): WorldClock {
  if (!_instance) _instance = new WorldClock();
  return _instance;
}

/** Reset singleton — test use only. */
export function resetClockForTest(): void {
  _instance = null;
}

/** Backward-compatible top-level now() — delegates to singleton. */
export function now(): GameTime {
  return getWorldClock().now();
}
