/**
 * WorldClock — authoritative in-game time.
 *
 * One real second = one in-game minute.
 * Fires onTick every minute, onHour every hour boundary.
 *
 * Pure TypeScript — no Phaser import in the class body.
 * Call start(scene) to wire the Phaser timer; everything else
 * is testable in Node without a browser.
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

export class WorldClock {
  private _time: GameTime = { day: 1, hour: 8, minute: 0 };
  private _tickListeners: TimeListener[] = [];
  private _hourListeners: TimeListener[] = [];

  now(): GameTime {
    return { ...this._time };
  }

  /** Overwrite current time — used to restore a save. Does not fire tick/hour listeners. */
  set(t: GameTime): void {
    this._time = { ...t };
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
    const dayWrap = Math.floor(total / (24 * 60));
    total = total % (24 * 60);
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

  start(scene: SceneTimer): void {
    scene.time.addEvent({
      delay: 1000,
      callback: () => this.tick(),
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
