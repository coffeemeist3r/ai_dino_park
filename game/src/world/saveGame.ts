/**
 * Save payload + (de)serialization.
 *
 * Pure TypeScript: no Phaser, no IndexedDB — runs in Node for tests.
 * The IndexedDB I/O lives in saveStore.ts. Migration across versions
 * is out of scope here (BACKLOG-040); this only gates on an exact
 * version match so an incompatible save is ignored rather than crashing.
 */

import type { GameTime } from './clock';
import type { Friendship } from '../social/friendship';
import type { MemoryStore } from '../ai/memory';
import type { Bonds } from '../social/bonds';
import type { Gratitude } from './comfort';
import type { Egg, BornDino } from '../social/breeding';

export const SAVE_VERSION = 1;

export interface SaveData {
  version: number;
  time: GameTime;
  player: { x: number; y: number };
  friendship: Friendship;
  memory: MemoryStore;
  bonds: Bonds;
  /** Who each dino owes a consolation back to (BACKLOG-132). Additive; absent → {}. */
  gratitude: Gratitude;
  /** Each dino's last greeting tone id (BACKLOG-142). Additive; absent → {}. */
  lastTone: Record<string, string>;
  /** The chosen observer's id (BACKLOG-155). Additive; absent → caller defaults to the first keeper. */
  keeperId?: string;
  /** The keeper's current zone (BACKLOG-143). Additive; absent → defaults to the bowl on load. */
  zoneId?: string;
  /** Each dino's settled (durable) role (BACKLOG-032). Additive; absent → {}. Stored as plain strings. */
  roles?: Record<string, string>;
  eggs: Egg[];
  born: BornDino[];
  /** Real epoch ms at save — seed for offline catch-up (BACKLOG-106). Additive. */
  savedAt?: number;
  /** Realtime multiplier in effect at save. Additive; absent → 1×. */
  scale?: number;
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

  // friendship is additive over v1 — absent in older saves (default {}); reject only if malformed.
  let friendship: Friendship = {};
  if (o.friendship !== undefined) {
    if (typeof o.friendship !== 'object' || o.friendship === null) return null;
    const entries = o.friendship as Record<string, unknown>;
    for (const k of Object.keys(entries)) {
      if (!isNum(entries[k])) return null;
      friendship[k] = entries[k] as number;
    }
  }

  // memory is additive over v1 — absent in older saves (default {}); reject only if malformed.
  let memory: MemoryStore = {};
  if (o.memory !== undefined) {
    if (typeof o.memory !== 'object' || o.memory === null) return null;
    const entries = o.memory as Record<string, unknown>;
    for (const k of Object.keys(entries)) {
      const arr = entries[k];
      if (!Array.isArray(arr) || !arr.every((e) => typeof e === 'string')) return null;
      memory[k] = arr as string[];
    }
  }

  // bonds is additive over v1 — absent in older saves (default {}); reject only if malformed.
  let bonds: Bonds = {};
  if (o.bonds !== undefined) {
    if (typeof o.bonds !== 'object' || o.bonds === null) return null;
    const entries = o.bonds as Record<string, unknown>;
    for (const k of Object.keys(entries)) {
      if (!isNum(entries[k])) return null;
      bonds[k] = entries[k] as number;
    }
  }

  // gratitude is additive over v1 — absent in older saves (default {}); shape mirrors memory
  // (name → string[]); reject only if malformed.
  let gratitude: Gratitude = {};
  if (o.gratitude !== undefined) {
    if (typeof o.gratitude !== 'object' || o.gratitude === null) return null;
    const entries = o.gratitude as Record<string, unknown>;
    for (const k of Object.keys(entries)) {
      const arr = entries[k];
      if (!Array.isArray(arr) || !arr.every((e) => typeof e === 'string')) return null;
      gratitude[k] = arr as string[];
    }
  }

  // lastTone is additive over v1 — absent in older saves (default {}); string values only
  // (a tone id; kept as plain string so saveGame stays free of a tones import and tolerant of
  // hand-edited ids). Reject only if malformed.
  let lastTone: Record<string, string> = {};
  if (o.lastTone !== undefined) {
    if (typeof o.lastTone !== 'object' || o.lastTone === null) return null;
    const entries = o.lastTone as Record<string, unknown>;
    for (const k of Object.keys(entries)) {
      if (typeof entries[k] !== 'string') return null;
      lastTone[k] = entries[k] as string;
    }
  }

  // keeperId is additive over v1 — absent in older saves (default undefined → caller picks the
  // first keeper); string only. Reject only if malformed.
  let keeperId: string | undefined;
  if (o.keeperId !== undefined) {
    if (typeof o.keeperId !== 'string') return null;
    keeperId = o.keeperId;
  }

  // zoneId is additive over v1 — absent in older saves (default 'bowl' so they load into the original
  // enclosure); string only. Reject only if malformed.
  let zoneId = 'bowl';
  if (o.zoneId !== undefined) {
    if (typeof o.zoneId !== 'string') return null;
    zoneId = o.zoneId;
  }

  // roles is additive over v1 — absent in older saves (default {}); string values only (a role id, kept
  // as plain string so saveGame stays free of a roles import). Reject only if malformed.
  let roles: Record<string, string> = {};
  if (o.roles !== undefined) {
    if (typeof o.roles !== 'object' || o.roles === null) return null;
    const entries = o.roles as Record<string, unknown>;
    for (const k of Object.keys(entries)) {
      if (typeof entries[k] !== 'string') return null;
      roles[k] = entries[k] as string;
    }
  }

  // eggs/born are additive over v1 — absent in older saves (default []); reject only if malformed.
  let eggs: Egg[] = [];
  if (o.eggs !== undefined) {
    if (!Array.isArray(o.eggs)) return null;
    for (const e of o.eggs) {
      if (typeof e !== 'object' || e === null) return null;
      const r = e as Record<string, unknown>;
      if (
        typeof r.id !== 'string' ||
        typeof r.parentA !== 'string' ||
        typeof r.parentB !== 'string' ||
        !isNum(r.layedDay) ||
        !isNum(r.hatchDay) ||
        !isNum(r.tileX) ||
        !isNum(r.tileY)
      )
        return null;
    }
    eggs = o.eggs as Egg[];
  }

  let born: BornDino[] = [];
  if (o.born !== undefined) {
    if (!Array.isArray(o.born)) return null;
    for (const b of o.born) {
      if (typeof b !== 'object' || b === null) return null;
      const r = b as Record<string, unknown>;
      if (
        typeof r.name !== 'string' ||
        typeof r.species !== 'string' ||
        typeof r.personality !== 'string' ||
        !isNum(r.color) ||
        !isNum(r.tileX) ||
        !isNum(r.tileY) ||
        typeof r.traits !== 'object' ||
        r.traits === null
      )
        return null;
    }
    born = o.born as BornDino[];
  }

  // savedAt/scale are additive over v1 — absent in older saves; reject only if malformed.
  let savedAt: number | undefined;
  if (o.savedAt !== undefined) {
    if (!isNum(o.savedAt)) return null;
    savedAt = o.savedAt;
  }
  let scale = 1;
  if (o.scale !== undefined) {
    if (!isNum(o.scale)) return null;
    scale = o.scale;
  }

  return {
    version: SAVE_VERSION,
    time: { day: time.day, hour: time.hour, minute: time.minute },
    player: { x: player.x, y: player.y },
    friendship,
    memory,
    bonds,
    gratitude,
    lastTone,
    keeperId,
    zoneId,
    roles,
    eggs,
    born,
    savedAt,
    scale,
  };
}
