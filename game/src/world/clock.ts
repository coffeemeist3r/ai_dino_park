/**
 * Stub for in-game time. Real clock arrives via BACKLOG-007.
 * NPCBrain implementations may consult this to seasonally bias replies.
 */

export interface GameTime {
  day: number;
  hour: number;   // 0-23
  minute: number; // 0-59
}

let _time: GameTime = { day: 1, hour: 8, minute: 0 };

export function now(): GameTime {
  return { ..._time };
}

export function advanceMinutes(n: number): void {
  let total = _time.hour * 60 + _time.minute + n;
  const dayWrap = Math.floor(total / (24 * 60));
  total = total % (24 * 60);
  _time = {
    day: _time.day + dayWrap,
    hour: Math.floor(total / 60),
    minute: total % 60,
  };
}
