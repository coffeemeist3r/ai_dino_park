/**
 * Save payload + (de)serialization.
 *
 * Pure TypeScript: no Phaser, no IndexedDB — runs in Node for tests.
 * The IndexedDB I/O lives in saveStore.ts. Versioning + migration (BACKLOG-040,
 * rooted at v0 by BACKLOG-426): an older-version save is *upgraded* to the current
 * shape on load via the `migrate` chain rather than discarded. The rail starts at
 * v0 — a *versionless* save (the oldest, pre-versioning shape) is read as v0 and
 * lifted through a v0→v1 no-op, so every save ever written rides the chain instead
 * of being silently dropped as a new game. A present-but-newer/non-integer/negative
 * version is still rejected (null) so a genuinely incompatible save is ignored
 * rather than crashing.
 */

import type { GameTime } from './clock';
import type { Friendship } from '../social/friendship';
import type { MemoryStore } from '../ai/memory';
import type { Bonds } from '../social/bonds';
import type { Gratitude } from './comfort';
import type { Egg, BornDino } from '../social/breeding';

export const SAVE_VERSION = 2;

type Migration = (o: Record<string, unknown>) => Record<string, unknown>;

/**
 * Step migrations, keyed by the version they upgrade FROM (N → N+1). The chain runs them in order to
 * lift an old save to SAVE_VERSION. A future non-additive change registers its own step here.
 */
const MIGRATIONS: Record<number, Migration> = {
  // v0 → v1: a versionless save predates any non-additive change — every field written since is
  // additive-optional, so the pre-versioning payload is already shape-compatible. The step just
  // stamps v1, rooting the rail at the origin (BACKLOG-426) so no save is ever dropped for lacking a version.
  0: (o) => ({ ...o, version: 1 }),
  // v1 → v2: every field added since v1 was additive-optional, so a v1 payload is already
  // shape-compatible — the step just stamps the new version (the worked example proving the hook).
  1: (o) => ({ ...o, version: 2 }),
};

/**
 * Lift a parsed save of any supported version up to SAVE_VERSION, returning the upgraded object — or
 * null for a present-but-non-integer/negative/newer version or a gap in the migration chain. A missing
 * `version` is read as v0 (the versionless origin) and lifted through the chain. Pure: never mutates `raw`.
 */
export function migrate(raw: Record<string, unknown>): Record<string, unknown> | null {
  // Absent version ⇒ v0 (the pre-versioning origin). `null`/any non-number stays rejected below.
  const v = raw.version === undefined ? 0 : raw.version;
  if (typeof v !== 'number' || !Number.isInteger(v) || v < 0 || v > SAVE_VERSION) return null;
  let o = raw;
  for (let from = v; from < SAVE_VERSION; from++) {
    const step = MIGRATIONS[from];
    if (!step) return null; // gap in the chain — refuse rather than guess
    o = step(o);
  }
  return o;
}

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
  /** Each dino's generate-once persona (BACKLOG-103). Additive; absent → {} (regenerated deterministically).
   *  `source` kept as plain string so saveGame stays free of an ai import. */
  personas?: Record<string, { text: string; source: string }>;
  /** The chosen observer's id (BACKLOG-155). Additive; absent → caller defaults to the first keeper. */
  keeperId?: string;
  /** The keeper's current zone (BACKLOG-143). Additive; absent → defaults to the bowl on load. */
  zoneId?: string;
  /** Each dino's settled (durable) role (BACKLOG-032). Additive; absent → {}. Stored as plain strings. */
  roles?: Record<string, string>;
  /** Each dino's home zone (BACKLOG-274). Additive; absent → {} (every dino defaults to the bowl). */
  dinoZones?: Record<string, string>;
  /** Each dino's home-zone tenure in rolls (BACKLOG-341) — how settled it is. Additive; absent → {} (settle from scratch). */
  tenure?: Record<string, number>;
  /** Each dino's gathered-resource tally (BACKLOG-146). Additive; absent → {}. */
  gathered?: Record<string, number>;
  /** Each dino's hunger/thirst drives (BACKLOG-371). Additive; absent → {} (every dino starts sated). */
  needs?: Record<string, { hunger: number; thirst: number }>;
  /** Shared per-kind park stockpile (BACKLOG-285). Additive; absent → {}. kind→count. Legacy = bowl pile since 328. */
  stockpile?: Record<string, number>;
  /** Per-zone stockpiles (BACKLOG-328). Additive over `stockpile`; absent in pre-328 saves (→ bowl pile on restore). zone→kind→count. */
  stockpileByZone?: Record<string, Record<string, number>>;
  /** Crafted cairns (BACKLOG-286). Additive over v2; absent → []. `zone` additive (BACKLOG-308; absent → bowl). */
  cairns?: { tileX: number; tileY: number; zone?: string }[];
  /** Dino-built shelters (BACKLOG-315). Additive; absent → []. Zone-scoped (308); mirrors `cairns`. */
  shelters?: { tileX: number; tileY: number; zone?: string }[];
  /** Woven frond thatches (BACKLOG-417) — the Fernreach's landmark. Additive; absent → []. Mirrors `shelters`. */
  thatches?: { tileX: number; tileY: number; zone?: string }[];
  /** Dinos that have ever been to the grove (BACKLOG-339). Additive; absent → []. Gates the once-ever arrival beat. */
  groveVisited?: string[];
  /** Dinos that have ever seen the grove pond (BACKLOG-359). Additive; absent → []. Gates the once-ever pond-sight beat. */
  pondSeen?: string[];
  /** The bowl's planted plot (BACKLOG-145), or null/absent when empty. Stores the in-game day it was planted. */
  plot?: { plantedDay: number } | null;
  /** The grove's planted plot (BACKLOG-349). Additive over `plot`; absent → null (old saves load grove-empty). */
  grovePlot?: { plantedDay: number } | null;
  /** Lifetime crop harvest tally (BACKLOG-145). Additive; absent → 0. */
  harvested?: number;
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
  // Upgrade an older save to the current shape before validating; reject unknown/newer/missing versions.
  const o = migrate(raw as Record<string, unknown>);
  if (!o) return null;

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

  // personas is additive (BACKLOG-103) — absent in older saves (left undefined; the caller
  // defaults to {} and regenerates deterministically); name→{text,source}, both strings.
  // Reject only if malformed. Mirrors stockpileByZone's undefined-when-absent shape.
  let personas: Record<string, { text: string; source: string }> | undefined;
  if (o.personas !== undefined) {
    if (typeof o.personas !== 'object' || o.personas === null) return null;
    const entries = o.personas as Record<string, unknown>;
    personas = {};
    for (const k of Object.keys(entries)) {
      const v = entries[k] as { text?: unknown; source?: unknown } | null;
      if (!v || typeof v !== 'object' || typeof v.text !== 'string' || typeof v.source !== 'string') return null;
      personas[k] = { text: v.text, source: v.source };
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

  // dinoZones is additive over v2 — absent in older saves (default {}); name→zone-id, mirrors roles
  // (string values only). Absent/empty → every dino reads the bowl via zoneOf's fallback. (BACKLOG-274)
  let dinoZones: Record<string, string> = {};
  if (o.dinoZones !== undefined) {
    if (typeof o.dinoZones !== 'object' || o.dinoZones === null) return null;
    const entries = o.dinoZones as Record<string, unknown>;
    for (const k of Object.keys(entries)) {
      if (typeof entries[k] !== 'string') return null;
      dinoZones[k] = entries[k] as string;
    }
  }

  // tenure is additive — absent in older saves (default {}); name→roll count, mirrors gathered (number values
  // only). Absent → every dino settles from scratch on load. (BACKLOG-341)
  let tenure: Record<string, number> = {};
  if (o.tenure !== undefined) {
    if (typeof o.tenure !== 'object' || o.tenure === null) return null;
    const entries = o.tenure as Record<string, unknown>;
    for (const k of Object.keys(entries)) {
      if (!isNum(entries[k])) return null;
      tenure[k] = entries[k] as number;
    }
  }

  // gathered is additive over v1 — absent in older saves (default {}); name→count, mirrors friendship.
  let gathered: Record<string, number> = {};
  if (o.gathered !== undefined) {
    if (typeof o.gathered !== 'object' || o.gathered === null) return null;
    const entries = o.gathered as Record<string, unknown>;
    for (const k of Object.keys(entries)) {
      if (!isNum(entries[k])) return null;
      gathered[k] = entries[k] as number;
    }
  }

  // needs is additive (BACKLOG-371) — absent in older saves (default {}); name→{hunger,thirst}, both finite.
  let needs: Record<string, { hunger: number; thirst: number }> = {};
  if (o.needs !== undefined) {
    if (typeof o.needs !== 'object' || o.needs === null) return null;
    const entries = o.needs as Record<string, unknown>;
    for (const k of Object.keys(entries)) {
      const v = entries[k] as { hunger?: unknown; thirst?: unknown } | null;
      if (!v || typeof v !== 'object' || !isNum(v.hunger) || !isNum(v.thirst)) return null;
      needs[k] = { hunger: v.hunger as number, thirst: v.thirst as number };
    }
  }

  // stockpile is additive over v2 — absent in older saves (default {}); kind→count, mirrors gathered.
  let stockpile: Record<string, number> = {};
  if (o.stockpile !== undefined) {
    if (typeof o.stockpile !== 'object' || o.stockpile === null) return null;
    const entries = o.stockpile as Record<string, unknown>;
    for (const k of Object.keys(entries)) {
      if (!isNum(entries[k])) return null;
      stockpile[k] = entries[k] as number;
    }
  }

  // stockpileByZone is additive over the global stockpile (BACKLOG-328) — zone→(kind→count). Absent in
  // pre-328 saves (left undefined; WorldScene migrates the global `stockpile` into the bowl pile on restore).
  let stockpileByZone: Record<string, Record<string, number>> | undefined;
  if (o.stockpileByZone !== undefined) {
    if (typeof o.stockpileByZone !== 'object' || o.stockpileByZone === null) return null;
    const zones = o.stockpileByZone as Record<string, unknown>;
    stockpileByZone = {};
    for (const z of Object.keys(zones)) {
      const pile = zones[z];
      if (typeof pile !== 'object' || pile === null) return null;
      const entries = pile as Record<string, unknown>;
      const out: Record<string, number> = {};
      for (const k of Object.keys(entries)) {
        if (!isNum(entries[k])) return null;
        out[k] = entries[k] as number;
      }
      stockpileByZone[z] = out;
    }
  }

  // cairns is additive over v2 — absent in older saves (default []); array of {tileX,tileY}. (BACKLOG-286)
  // `zone` is additive over that (BACKLOG-308); absent → bowl, backfilled on restore.
  let cairns: { tileX: number; tileY: number; zone?: string }[] = [];
  if (o.cairns !== undefined) {
    if (!Array.isArray(o.cairns)) return null;
    for (const c of o.cairns) {
      if (typeof c !== 'object' || c === null) return null;
      const r = c as Record<string, unknown>;
      if (!isNum(r.tileX) || !isNum(r.tileY)) return null;
      if (r.zone !== undefined && typeof r.zone !== 'string') return null;
    }
    cairns = o.cairns as { tileX: number; tileY: number; zone?: string }[];
  }

  // shelters is additive — absent in older saves (default []); array of {tileX,tileY,zone?}, mirrors cairns. (BACKLOG-315)
  let shelters: { tileX: number; tileY: number; zone?: string }[] = [];
  if (o.shelters !== undefined) {
    if (!Array.isArray(o.shelters)) return null;
    for (const s of o.shelters) {
      if (typeof s !== 'object' || s === null) return null;
      const r = s as Record<string, unknown>;
      if (!isNum(r.tileX) || !isNum(r.tileY)) return null;
      if (r.zone !== undefined && typeof r.zone !== 'string') return null;
    }
    shelters = o.shelters as { tileX: number; tileY: number; zone?: string }[];
  }

  // thatches is additive — absent in older saves (default []); array of {tileX,tileY,zone?}, mirrors shelters. (BACKLOG-417)
  let thatches: { tileX: number; tileY: number; zone?: string }[] = [];
  if (o.thatches !== undefined) {
    if (!Array.isArray(o.thatches)) return null;
    for (const t of o.thatches) {
      if (typeof t !== 'object' || t === null) return null;
      const r = t as Record<string, unknown>;
      if (!isNum(r.tileX) || !isNum(r.tileY)) return null;
      if (r.zone !== undefined && typeof r.zone !== 'string') return null;
    }
    thatches = o.thatches as { tileX: number; tileY: number; zone?: string }[];
  }

  // groveVisited is additive — absent in older saves (default []); a flat list of dino names. (BACKLOG-339)
  let groveVisited: string[] = [];
  if (o.groveVisited !== undefined) {
    if (!Array.isArray(o.groveVisited)) return null;
    for (const n of o.groveVisited) if (typeof n !== 'string') return null;
    groveVisited = o.groveVisited as string[];
  }

  // pondSeen is additive — absent in older saves (default []); a flat list of dino names. (BACKLOG-359)
  let pondSeen: string[] = [];
  if (o.pondSeen !== undefined) {
    if (!Array.isArray(o.pondSeen)) return null;
    for (const n of o.pondSeen) if (typeof n !== 'string') return null;
    pondSeen = o.pondSeen as string[];
  }

  // plot/grovePlot/harvested are additive over v2 — absent in older saves (plots → null, harvested → 0). (BACKLOG-145/349)
  const readPlot = (v: unknown): { plantedDay: number } | null | undefined => {
    if (v === undefined || v === null) return null;
    if (typeof v !== 'object') return undefined; // signal malformed
    const r = v as Record<string, unknown>;
    if (!isNum(r.plantedDay)) return undefined;
    return { plantedDay: r.plantedDay as number };
  };
  const plot = readPlot(o.plot);
  if (plot === undefined) return null;
  const grovePlot = readPlot(o.grovePlot);
  if (grovePlot === undefined) return null;
  let harvested = 0;
  if (o.harvested !== undefined) {
    if (!isNum(o.harvested) || (o.harvested as number) < 0) return null;
    harvested = o.harvested as number;
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
    personas,
    keeperId,
    zoneId,
    roles,
    dinoZones,
    tenure,
    gathered,
    needs,
    stockpile,
    stockpileByZone,
    cairns,
    shelters,
    thatches,
    groveVisited,
    pondSeen,
    plot,
    grovePlot,
    harvested,
    eggs,
    born,
    savedAt,
    scale,
  };
}
