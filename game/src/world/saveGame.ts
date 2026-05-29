/**
 * Save payload + (de)serialization.
 *
 * Pure TypeScript: no Phaser, no IndexedDB — runs in Node for tests.
 * The IndexedDB I/O lives in saveStore.ts. Migration across versions
 * is out of scope here (BACKLOG-040); this only gates on an exact
 * version match so an incompatible save is ignored rather than crashing.
 */

import type { GameTime } from './clock';

export const SAVE_VERSION = 1;

export interface SaveData {
  version: number;
  time: GameTime;
  player: { x: number; y: number };
}

export function serialize(data: SaveData): string {
  return JSON.stringify(data);
}

function isNum(v: unknown): v is number {
  return typeof v === 'number' && Number.isFinite(v);
}

/** Parse + validate. Returns null on malformed input or version mismatch — never throws. */
export function deserialize(json: string): SaveData | null {
  let raw: unknown;
  try {
    raw = JSON.parse(json);
  } catch {
    return null;
  }
  if (typeof raw !== 'object' || raw === null) return null;
  const o = raw as Record<string, unknown>;
  if (o.version !== SAVE_VERSION) return null;

  const time = o.time as Record<string, unknown> | undefined;
  if (!time || !isNum(time.day) || !isNum(time.hour) || !isNum(time.minute)) return null;

  const player = o.player as Record<string, unknown> | undefined;
  if (!player || !isNum(player.x) || !isNum(player.y)) return null;

  return {
    version: SAVE_VERSION,
    time: { day: time.day, hour: time.hour, minute: time.minute },
    player: { x: player.x, y: player.y },
  };
}
