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
import { AXES } from '../ai/personality';

/** The axis names a BACKLOG-407 echo may name — read off the personality table itself, so the save's
 *  validation can never drift from the axes that exist. */
const TIC_AXES: string[] = AXES.map((a) => a.key);

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
  /** Where each dino belongs — the zone it last settled in (BACKLOG-452). Additive; absent → {} (no roots yet). */
  roots?: Record<string, string>;
  /** Each dino's banked-food tally (BACKLOG-448) — what the `provider` role reads. Additive; absent → {}. */
  foodBanked?: Record<string, number>;
  /** Each dino's gathered-resource tally (BACKLOG-146). Additive; absent → {}. */
  gathered?: Record<string, number>;
  /** Each dino's hunger/thirst drives (BACKLOG-371). Additive; absent → {} (every dino starts sated). */
  needs?: Record<string, { hunger: number; thirst: number }>;
  /** Shared per-kind park stockpile (BACKLOG-285). Additive; absent → {}. kind→count. Legacy = bowl pile since 328. */
  stockpile?: Record<string, number>;
  /** Per-zone stockpiles (BACKLOG-328). Additive over `stockpile`; absent in pre-328 saves (→ bowl pile on restore). zone→kind→count. */
  stockpileByZone?: Record<string, Record<string, number>>;
  /** Per-zone banked food (BACKLOG-446) — the food twin of `stockpileByZone`. Additive; absent → {}. zone→foodId→count. */
  foodPileByZone?: Record<string, Record<string, number>>;
  /** Per-zone provider-set spend priority (BACKLOG-463) — zone→'feed'|'bank'. Additive; absent → {} (no policy). */
  spendPriorityByZone?: Record<string, 'feed' | 'bank'>;
  /** Who last held each zone's say (BACKLOG-467) — zone→provider name. Additive; absent → {} (no handover tracked yet). */
  lastProviderByZone?: Record<string, string>;
  /** Per-zone provider-set work priority (BACKLOG-473) — zone→'gather'|'build'. Additive; absent → {}. */
  workPriorityByZone?: Record<string, 'gather' | 'build'>;
  /** BACKLOG-407: dino → the personality axis whose ritual it has picked up off a friend. The *key*, never
   *  the rendered tic, so a reworded glyph or label can't invalidate a save. */
  ticEchoes?: Record<string, string>;
  /** BACKLOG-407: `watcher>performer` → how many of that friend's solitary rituals this dino has watched. */
  ticWatches?: Record<string, number>;
  /** BACKLOG-409: the dinos whose ritual has ever *formed* in this park — the book's line is earned, not
   *  derived from personality. Lifetime, unlike the per-stretch `ticInvented` flag. Additive; absent → none
   *  recorded (an old save back-fills every dino already carrying an echo, which was announced when it took). */
  ticsFormed?: string[];
  /** BACKLOG-409: dino → the friend it caught its ritual off (407). Additive; absent → {} (an echo without a
   *  recorded source reads as "picked up from a friend"). */
  ticEchoFrom?: Record<string, string>;
  /** BACKLOG-422: lifetime affinity each dino has earned from being caught mid-ritual — the ceiling that
   *  stops a reload re-buying the same warmth. Additive-optional; absent on every pre-137 save. */
  catchWarmth?: Record<string, number>;
  /** BACKLOG-421: dino → zone → the worn tile that dino's ritual returns to on that ground, and how far the
   *  path has drifted since it was laid. Additive; absent → {} (every ritual on that save is a first one). */
  ticHaunts?: Record<string, Record<string, { tileX: number; tileY: number; drifts: number }>>;
  /** dino → zone → the in-game day it last crossed *out* of that ground (BACKLOG-362). Additive; absent →
   *  {} (no back-fill: a ground you have never been recorded leaving cannot yet be missed). */
  leftDays?: Record<string, Record<string, number>>;
  /** dino → the ground it last crossed *out* of (BACKLOG-347). Additive; absent → {} (nothing carried
   *  until it crosses). */
  cameFrom?: Record<string, string>;
  /** zone → first dino ever to arrive there (BACKLOG-343). Additive; absent → {} (no back-fill: we did
   *  not record it then and must not invent it). */
  pioneers?: Record<string, string>;
  /** zone → its held council seating, most-banked first (BACKLOG-484). Additive; absent → no term held yet,
   *  so every ground reads live until the next in-game day boundary — which is exactly the fresh-save path. */
  councilSeats?: Record<string, string[]>;
  /** The in-game day the current council term began (BACKLOG-484). Additive; absent → 0, re-armed to the
   *  current day on restore so a reload never holds a term against a day it did not watch. */
  councilTermDay?: number;
  /** dino → the grounds it has set foot on (BACKLOG-364). Additive; absent → {} (re-seeded from live home
   *  zones on load, which is all an older save can honestly tell us). */
  seenZones?: Record<string, string[]>;
  /** dino → how many times it has ever arrived on a new ground (BACKLOG-361). Additive; absent → {}: an
   *  older save never counted, so every dino reads homebody until it next crosses. No back-fill — inventing
   *  a tally from `seenZones` would claim journeys we did not watch. */
  crossings?: Record<string, number>;
  /** Crafted cairns (BACKLOG-286). Additive over v2; absent → []. `zone` additive (BACKLOG-308; absent → bowl). */
  cairns?: { tileX: number; tileY: number; zone?: string; derelict?: boolean }[];
  /** Dino-built shelters (BACKLOG-315). Additive; absent → []. Zone-scoped (308); mirrors `cairns`. */
  shelters?: { tileX: number; tileY: number; zone?: string; derelict?: boolean }[];
  /** Woven frond thatches (BACKLOG-417) — the Fernreach's landmark. Additive; absent → []. Mirrors `shelters`. */
  thatches?: { tileX: number; tileY: number; zone?: string; derelict?: boolean }[];
  /** Beacons (BACKLOG-503) — the Ridge's obsidian landmark. Additive; absent → []. Mirrors `thatches`. */
  beacons?: { tileX: number; tileY: number; zone?: string; derelict?: boolean }[];
  /** Granaries (BACKLOG-454) — the food-cap-lifting upgrade, one per zone. Additive; absent → []. Mirrors `thatches`. */
  granaries?: { tileX: number; tileY: number; zone?: string; derelict?: boolean }[];
  /** Dinos that have ever been to the grove (BACKLOG-339). Additive; absent → []. Gates the once-ever arrival beat. */
  groveVisited?: string[];
  /** Dinos that have ever seen the grove pond (BACKLOG-359). Additive; absent → []. Gates the once-ever pond-sight beat. */
  pondSeen?: string[];
  /** The bowl's planted plot (BACKLOG-145), or null/absent when empty. Stores the in-game day it was planted. */
  plot?: { plantedDay: number } | null;
  /** The grove's planted plot (BACKLOG-349). Additive over `plot`; absent → null (old saves load grove-empty). */
  grovePlot?: { plantedDay: number } | null;
  /** The Fernreach's planted plot (BACKLOG-432). Additive over `grovePlot`; absent → null (old saves load Fernreach-empty). */
  fernreachPlot?: { plantedDay: number } | null;
  /** The Hollow's planted plot (BACKLOG-472). Additive; absent → null (old saves load Hollow-empty).
   *  Note: per-zone plots are still four hand-written fields — logged in the cycle-119 codeplan as the
   *  one place a fourth ground genuinely cost a line, and left for a future save-shape item. */
  hollowPlot?: { plantedDay: number } | null;
  ridgePlot?: { plantedDay: number } | null; // BACKLOG-478
  /** Lifetime crop harvest tally (BACKLOG-145). Additive; absent → 0. */
  harvested?: number;
  /** Per-zone crop harvest tally (BACKLOG-428) — the prosperity index's farming term. Additive; absent → {}. */
  harvestedByZone?: Record<string, number>;
  eggs: Egg[];
  born: BornDino[];
  /** Real epoch ms at save — seed for offline catch-up (BACKLOG-106). Additive. */
  savedAt?: number;
  /** Realtime multiplier in effect at save. Additive; absent → 1×. */
  scale?: number;
  /**
   * The local hours the keeper has opened the park at (BACKLOG-121). Newest last, capped at
   * `VISIT_HISTORY_MAX`. Additive; absent → `[]`, and a park with no history simply never claims to know
   * your hour. Hours, not timestamps, deliberately: what the vigil reasons about is *when in a day* you
   * turn up, and storing epoch ms would put a timezone into the save file.
   */
  visitHours?: number[];
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

  // roots is additive — absent in older saves (default {}); name→zone-id, mirrors dinoZones (string values
  // only). Absent → nobody has a recorded root, so no crossing reads as a homecoming. (BACKLOG-452)
  let roots: Record<string, string> = {};
  if (o.roots !== undefined) {
    if (typeof o.roots !== 'object' || o.roots === null) return null;
    const entries = o.roots as Record<string, unknown>;
    for (const k of Object.keys(entries)) {
      if (typeof entries[k] !== 'string') return null;
      roots[k] = entries[k] as string;
    }
  }

  // foodBanked is additive — absent in older saves (default {}); name→count, mirrors gathered. (BACKLOG-448)
  let foodBanked: Record<string, number> = {};
  if (o.foodBanked !== undefined) {
    if (typeof o.foodBanked !== 'object' || o.foodBanked === null) return null;
    const entries = o.foodBanked as Record<string, unknown>;
    for (const k of Object.keys(entries)) {
      if (!isNum(entries[k])) return null;
      foodBanked[k] = entries[k] as number;
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

  // foodPileByZone (BACKLOG-446) — zone→(foodId→count). Was declared on SaveData but never validated or
  // returned here, so every reload silently dropped a zone's banked food back to empty; fixed cycle 107
  // alongside 448 (a provider tally is meaningless if the pantry it fills resets each session). Absent →
  // undefined, caller defaults to {}. Shape-identical to stockpileByZone above.
  let foodPileByZone: Record<string, Record<string, number>> | undefined;
  if (o.foodPileByZone !== undefined) {
    if (typeof o.foodPileByZone !== 'object' || o.foodPileByZone === null) return null;
    const zones = o.foodPileByZone as Record<string, unknown>;
    foodPileByZone = {};
    for (const z of Object.keys(zones)) {
      const pile = zones[z];
      if (typeof pile !== 'object' || pile === null) return null;
      const entries = pile as Record<string, unknown>;
      const out: Record<string, number> = {};
      for (const k of Object.keys(entries)) {
        if (!isNum(entries[k])) return null;
        out[k] = entries[k] as number;
      }
      foodPileByZone[z] = out;
    }
  }

  // spendPriorityByZone (BACKLOG-463) — zone→'feed'|'bank', the provider-set policy. Additive; absent →
  // undefined, caller defaults to {} (no zone has a policy until a provider sets one). Any value other than
  // the two literals is a corrupt save → reject.
  let spendPriorityByZone: Record<string, 'feed' | 'bank'> | undefined;
  if (o.spendPriorityByZone !== undefined) {
    if (typeof o.spendPriorityByZone !== 'object' || o.spendPriorityByZone === null) return null;
    const zones = o.spendPriorityByZone as Record<string, unknown>;
    spendPriorityByZone = {};
    for (const z of Object.keys(zones)) {
      if (zones[z] !== 'feed' && zones[z] !== 'bank') return null;
      spendPriorityByZone[z] = zones[z] as 'feed' | 'bank';
    }
  }

  // lastProviderByZone (BACKLOG-467) — zone→provider name, who last held each zone's say. Additive; absent →
  // undefined, caller defaults to {}. Each value must be a string (a dino name); anything else is corrupt.
  let lastProviderByZone: Record<string, string> | undefined;
  if (o.lastProviderByZone !== undefined) {
    if (typeof o.lastProviderByZone !== 'object' || o.lastProviderByZone === null) return null;
    const zones = o.lastProviderByZone as Record<string, unknown>;
    lastProviderByZone = {};
    for (const z of Object.keys(zones)) {
      if (typeof zones[z] !== 'string') return null;
      lastProviderByZone[z] = zones[z] as string;
    }
  }

  // workPriorityByZone (BACKLOG-473) — the second governance call. Same string-valued-object guard as
  // spendPriorityByZone above; additive, absent → undefined, caller defaults to {}.
  let workPriorityByZone: Record<string, 'gather' | 'build'> | undefined;
  if (o.workPriorityByZone !== undefined) {
    if (typeof o.workPriorityByZone !== 'object' || o.workPriorityByZone === null) return null;
    const zones = o.workPriorityByZone as Record<string, unknown>;
    workPriorityByZone = {};
    for (const z of Object.keys(zones)) {
      if (zones[z] !== 'gather' && zones[z] !== 'build') return null;
      workPriorityByZone[z] = zones[z] as 'gather' | 'build';
    }
  }

  // ticEchoes / ticWatches (BACKLOG-407) — the picked-up ritual and the watches building toward one. The
  // echo is validated against the axis names themselves, so a save naming an axis this build doesn't have
  // is rejected rather than restoring a dino with no ritual at all. Additive; absent → undefined.
  let ticEchoes: Record<string, string> | undefined;
  if (o.ticEchoes !== undefined) {
    if (typeof o.ticEchoes !== 'object' || o.ticEchoes === null) return null;
    const byDino = o.ticEchoes as Record<string, unknown>;
    ticEchoes = {};
    for (const n of Object.keys(byDino)) {
      if (typeof byDino[n] !== 'string' || !TIC_AXES.includes(byDino[n] as string)) return null;
      ticEchoes[n] = byDino[n] as string;
    }
  }
  let ticWatches: Record<string, number> | undefined;
  if (o.ticWatches !== undefined) {
    if (typeof o.ticWatches !== 'object' || o.ticWatches === null) return null;
    const byPair = o.ticWatches as Record<string, unknown>;
    ticWatches = {};
    for (const k of Object.keys(byPair)) {
      const n = byPair[k];
      if (typeof n !== 'number' || !Number.isFinite(n)) return null;
      ticWatches[k] = n;
    }
  }

  // ticsFormed / ticEchoFrom (BACKLOG-409) — the lifetime "this ritual happened" set and who each echo was
  // caught off. Additive; absent → undefined.
  let ticsFormed: string[] | undefined;
  if (o.ticsFormed !== undefined) {
    if (!Array.isArray(o.ticsFormed)) return null;
    for (const n of o.ticsFormed) if (typeof n !== 'string') return null;
    ticsFormed = [...(o.ticsFormed as string[])];
  }
  let ticEchoFrom: Record<string, string> | undefined;
  if (o.ticEchoFrom !== undefined) {
    if (typeof o.ticEchoFrom !== 'object' || o.ticEchoFrom === null || Array.isArray(o.ticEchoFrom)) return null;
    const byDino = o.ticEchoFrom as Record<string, unknown>;
    ticEchoFrom = {};
    for (const n of Object.keys(byDino)) {
      if (typeof byDino[n] !== 'string') return null;
      ticEchoFrom[n] = byDino[n] as string;
    }
  }

  // leftDays (BACKLOG-362) — dino→zone→the day it last left. Object of objects of finite numbers: the
  // seenZones nesting with harvestedByZone's numeric leaf.
  let leftDays: Record<string, Record<string, number>> | undefined;
  if (o.leftDays !== undefined) {
    if (typeof o.leftDays !== 'object' || o.leftDays === null) return null;
    const dinos = o.leftDays as Record<string, unknown>;
    leftDays = {};
    for (const n of Object.keys(dinos)) {
      const zones = dinos[n];
      if (typeof zones !== 'object' || zones === null || Array.isArray(zones)) return null;
      const byZone: Record<string, number> = {};
      for (const z of Object.keys(zones as Record<string, unknown>)) {
        const day = (zones as Record<string, unknown>)[z];
        if (typeof day !== 'number' || !Number.isFinite(day)) return null;
        byZone[z] = day;
      }
      leftDays[n] = byZone;
    }
  }

  // catchWarmth (BACKLOG-422) — the lifetime being-found ceiling. Additive, the foodBanked idiom.
  //
  // **This block is the repair, not the original.** 422 declared the field, wrote it, and never parsed it,
  // so the ceiling that exists to stop being-found becoming farmable was reset by every reload — the exact
  // failure BACKLOG-498 filed by name the same night. The whole-shape round-trip spec beside this file is
  // the part that stops the next one.
  let catchWarmth: Record<string, number> | undefined;
  if (o.catchWarmth !== undefined) {
    if (typeof o.catchWarmth !== 'object' || o.catchWarmth === null || Array.isArray(o.catchWarmth)) return null;
    const entries = o.catchWarmth as Record<string, unknown>;
    catchWarmth = {};
    for (const k of Object.keys(entries)) {
      if (!isNum(entries[k])) return null;
      catchWarmth[k] = entries[k] as number;
    }
  }

  // ticHaunts (BACKLOG-421) — dino→zone→{tileX,tileY,drifts}. The leftDays nesting with a tile leaf.
  let ticHaunts: Record<string, Record<string, { tileX: number; tileY: number; drifts: number }>> | undefined;
  if (o.ticHaunts !== undefined) {
    if (typeof o.ticHaunts !== 'object' || o.ticHaunts === null || Array.isArray(o.ticHaunts)) return null;
    const dinos = o.ticHaunts as Record<string, unknown>;
    ticHaunts = {};
    for (const n of Object.keys(dinos)) {
      const zones = dinos[n];
      if (typeof zones !== 'object' || zones === null || Array.isArray(zones)) return null;
      const byZone: Record<string, { tileX: number; tileY: number; drifts: number }> = {};
      for (const z of Object.keys(zones as Record<string, unknown>)) {
        const h = (zones as Record<string, unknown>)[z] as Record<string, unknown> | null;
        if (typeof h !== 'object' || h === null || Array.isArray(h)) return null;
        if (!isNum(h.tileX) || !isNum(h.tileY) || !isNum(h.drifts)) return null;
        byZone[z] = { tileX: h.tileX as number, tileY: h.tileY as number, drifts: h.drifts as number };
      }
      ticHaunts[n] = byZone;
    }
  }

  // cameFrom (BACKLOG-347) — dino→the ground it last crossed out of. String-valued object, the `pioneers`
  // guard below with dinos for keys; additive, absent → undefined, caller defaults to {}.
  let cameFrom: Record<string, string> | undefined;
  if (o.cameFrom !== undefined) {
    if (typeof o.cameFrom !== 'object' || o.cameFrom === null) return null;
    const names = o.cameFrom as Record<string, unknown>;
    cameFrom = {};
    for (const n of Object.keys(names)) {
      if (typeof names[n] !== 'string') return null;
      cameFrom[n] = names[n] as string;
    }
  }

  // pioneers (BACKLOG-343) — zone→the first dino ever to arrive there. Same shape and same guard as
  // lastProviderByZone above; additive, absent → undefined, caller defaults to {}.
  let pioneers: Record<string, string> | undefined;
  if (o.pioneers !== undefined) {
    if (typeof o.pioneers !== 'object' || o.pioneers === null) return null;
    const zones = o.pioneers as Record<string, unknown>;
    pioneers = {};
    for (const z of Object.keys(zones)) {
      if (typeof zones[z] !== 'string') return null;
      pioneers[z] = zones[z] as string;
    }
  }

  // seenZones (BACKLOG-364) — dino→the grounds it has set foot on. Same object guard as `pioneers` above,
  // but the values are string *arrays*, not strings: the one line where the two blocks genuinely differ.
  let seenZones: Record<string, string[]> | undefined;
  if (o.seenZones !== undefined) {
    if (typeof o.seenZones !== 'object' || o.seenZones === null) return null;
    const dinos = o.seenZones as Record<string, unknown>;
    seenZones = {};
    for (const n of Object.keys(dinos)) {
      const zones = dinos[n];
      if (!Array.isArray(zones)) return null;
      for (const z of zones) if (typeof z !== 'string') return null;
      seenZones[n] = zones as string[];
    }
  }

  // councilSeats (BACKLOG-484) — zone→its held seating. Same string-array guard as seenZones above; the
  // absent case is meaningful (no term held yet → read live), so it stays `undefined` rather than {}.
  let councilSeats: Record<string, string[]> | undefined;
  if (o.councilSeats !== undefined) {
    if (typeof o.councilSeats !== 'object' || o.councilSeats === null) return null;
    const zones = o.councilSeats as Record<string, unknown>;
    councilSeats = {};
    for (const z of Object.keys(zones)) {
      const seats = zones[z];
      if (!Array.isArray(seats)) return null;
      for (const n of seats) if (typeof n !== 'string') return null;
      councilSeats[z] = seats as string[];
    }
  }

  // councilTermDay (BACKLOG-484) — the day the held term began. A plain non-negative finite day number.
  let councilTermDay: number | undefined;
  if (o.councilTermDay !== undefined) {
    if (typeof o.councilTermDay !== 'number' || !Number.isFinite(o.councilTermDay) || o.councilTermDay < 0) return null;
    councilTermDay = o.councilTermDay;
  }

  // crossings (BACKLOG-361) — dino→lifetime arrival count. Same guard shape as harvestedByZone below:
  // an object of non-negative finite numbers.
  let crossings: Record<string, number> | undefined;
  if (o.crossings !== undefined) {
    if (typeof o.crossings !== 'object' || o.crossings === null) return null;
    const names = o.crossings as Record<string, unknown>;
    crossings = {};
    for (const n of Object.keys(names)) {
      if (!isNum(names[n]) || (names[n] as number) < 0) return null;
      crossings[n] = names[n] as number;
    }
  }

  // harvestedByZone is additive over the global `harvested` (BACKLOG-428) — zone→harvest count. Absent in
  // pre-428 saves (left undefined; WorldScene defaults it to {}). Non-negative integers only.
  let harvestedByZone: Record<string, number> | undefined;
  if (o.harvestedByZone !== undefined) {
    if (typeof o.harvestedByZone !== 'object' || o.harvestedByZone === null) return null;
    const zones = o.harvestedByZone as Record<string, unknown>;
    harvestedByZone = {};
    for (const z of Object.keys(zones)) {
      if (!isNum(zones[z]) || (zones[z] as number) < 0) return null;
      harvestedByZone[z] = zones[z] as number;
    }
  }

  // cairns is additive over v2 — absent in older saves (default []); array of {tileX,tileY}. (BACKLOG-286)
  // `zone` is additive over that (BACKLOG-308); absent → bowl, backfilled on restore.
  let cairns: { tileX: number; tileY: number; zone?: string; derelict?: boolean }[] = [];
  if (o.cairns !== undefined) {
    if (!Array.isArray(o.cairns)) return null;
    for (const c of o.cairns) {
      if (typeof c !== 'object' || c === null) return null;
      const r = c as Record<string, unknown>;
      if (!isNum(r.tileX) || !isNum(r.tileY)) return null;
      if (r.zone !== undefined && typeof r.zone !== 'string') return null;
      // BACKLOG-480: `derelict` is additive over that; absent → maintained, so a pre-480 save restores
      // with its whole skyline standing.
      if (r.derelict !== undefined && typeof r.derelict !== 'boolean') return null;
    }
    cairns = o.cairns as { tileX: number; tileY: number; zone?: string; derelict?: boolean }[];
  }

  // shelters is additive — absent in older saves (default []); array of {tileX,tileY,zone?}, mirrors cairns. (BACKLOG-315)
  let shelters: { tileX: number; tileY: number; zone?: string; derelict?: boolean }[] = [];
  if (o.shelters !== undefined) {
    if (!Array.isArray(o.shelters)) return null;
    for (const s of o.shelters) {
      if (typeof s !== 'object' || s === null) return null;
      const r = s as Record<string, unknown>;
      if (!isNum(r.tileX) || !isNum(r.tileY)) return null;
      if (r.zone !== undefined && typeof r.zone !== 'string') return null;
      // BACKLOG-480: `derelict` is additive over that; absent → maintained, so a pre-480 save restores
      // with its whole skyline standing.
      if (r.derelict !== undefined && typeof r.derelict !== 'boolean') return null;
    }
    shelters = o.shelters as { tileX: number; tileY: number; zone?: string; derelict?: boolean }[];
  }

  // thatches is additive — absent in older saves (default []); array of {tileX,tileY,zone?}, mirrors shelters. (BACKLOG-417)
  let thatches: { tileX: number; tileY: number; zone?: string; derelict?: boolean }[] = [];
  if (o.thatches !== undefined) {
    if (!Array.isArray(o.thatches)) return null;
    for (const t of o.thatches) {
      if (typeof t !== 'object' || t === null) return null;
      const r = t as Record<string, unknown>;
      if (!isNum(r.tileX) || !isNum(r.tileY)) return null;
      if (r.zone !== undefined && typeof r.zone !== 'string') return null;
      // BACKLOG-480: `derelict` is additive over that; absent → maintained, so a pre-480 save restores
      // with its whole skyline standing.
      if (r.derelict !== undefined && typeof r.derelict !== 'boolean') return null;
    }
    thatches = o.thatches as { tileX: number; tileY: number; zone?: string; derelict?: boolean }[];
  }

  // beacons is additive — absent in older saves (default []); array of {tileX,tileY,zone?}, mirrors thatches. (BACKLOG-503)
  let beacons: { tileX: number; tileY: number; zone?: string; derelict?: boolean }[] = [];
  if (o.beacons !== undefined) {
    if (!Array.isArray(o.beacons)) return null;
    for (const b of o.beacons) {
      if (typeof b !== 'object' || b === null) return null;
      const r = b as Record<string, unknown>;
      if (!isNum(r.tileX) || !isNum(r.tileY)) return null;
      if (r.zone !== undefined && typeof r.zone !== 'string') return null;
      if (r.derelict !== undefined && typeof r.derelict !== 'boolean') return null;
    }
    beacons = o.beacons as { tileX: number; tileY: number; zone?: string; derelict?: boolean }[];
  }

  // granaries is additive — absent in older saves (default []); array of {tileX,tileY,zone?}, mirrors thatches. (BACKLOG-454)
  let granaries: { tileX: number; tileY: number; zone?: string; derelict?: boolean }[] = [];
  if (o.granaries !== undefined) {
    if (!Array.isArray(o.granaries)) return null;
    for (const g of o.granaries) {
      if (typeof g !== 'object' || g === null) return null;
      const r = g as Record<string, unknown>;
      if (!isNum(r.tileX) || !isNum(r.tileY)) return null;
      if (r.zone !== undefined && typeof r.zone !== 'string') return null;
      // BACKLOG-480: `derelict` is additive over that; absent → maintained, so a pre-480 save restores
      // with its whole skyline standing.
      if (r.derelict !== undefined && typeof r.derelict !== 'boolean') return null;
    }
    granaries = o.granaries as { tileX: number; tileY: number; zone?: string; derelict?: boolean }[];
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
  const fernreachPlot = readPlot(o.fernreachPlot); // BACKLOG-432: additive, absent → null (readPlot)
  if (fernreachPlot === undefined) return null;
  const hollowPlot = readPlot(o.hollowPlot); // BACKLOG-472: additive, absent → null (readPlot)
  if (hollowPlot === undefined) return null;
  const ridgePlot = readPlot(o.ridgePlot); // BACKLOG-478: additive, absent → null (readPlot)
  if (ridgePlot === undefined) return null;
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
  // BACKLOG-121: additive over v1 too — absent in every save written before this cycle.
  let visitHours: number[] | undefined;
  if (o.visitHours !== undefined) {
    if (!Array.isArray(o.visitHours) || !o.visitHours.every(isNum)) return null;
    visitHours = o.visitHours as number[];
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
    roots,
    gathered,
    foodBanked,
    needs,
    stockpile,
    stockpileByZone,
    foodPileByZone,
    spendPriorityByZone,
    lastProviderByZone,
    pioneers,
    seenZones,
    councilSeats,
    councilTermDay,
    crossings,
    workPriorityByZone,
    ticEchoes,
    ticWatches,
    ticsFormed,
    ticEchoFrom,
    leftDays,
    catchWarmth,
    ticHaunts,
    cameFrom,
    cairns,
    shelters,
    thatches,
    beacons,
    granaries,
    groveVisited,
    pondSeen,
    plot,
    grovePlot,
    fernreachPlot,
    hollowPlot,
    ridgePlot,
    harvested,
    harvestedByZone,
    eggs,
    born,
    savedAt,
    scale,
    visitHours,
  };
}
