# Cycle 112 — Code Plan (two tracks)

**Order:** Structure (460) first — `world/decline.ts` is imported by the Lore track. Both edit
`WorldScene.ts` (`maybeMigrate` + lens) and no shared lines.

---

## Structure track — BACKLOG-460

### Create
- `game/src/world/decline.ts`:
  - `export type ZonePeaks = Record<string, number>;`
  - `export const ZONE_FLOOR = 1;`
  - `export const DECLINING_MIGRATE_DAMP = 0.3;` (< `SETTLED_MIGRATE_DAMP` 0.6 — the calibration knob)
  - `export function bumpPeak(peaks, zone, heads): ZonePeaks` — `heads <= (peaks[zone] ?? 0)` → return `peaks`; else `{ ...peaks, [zone]: heads }`.
  - `export function isDeclining(peak, heads): boolean` → `heads < peak && heads >= ZONE_FLOOR`.
  - `export function declineGlyph(): string` → `'⬇'`.
- `game/src/world/decline.test.ts` — see Test plan.

### Modify
- `game/src/world/belonging.ts`: add optional third arg to `resistsMigration`:
  `resistsMigration(settled, rand = Math.random, damp = SETTLED_MIGRATE_DAMP)` → `settled && rand() < damp`.
  (Default keeps all existing callers byte-identical.)
- `game/src/ui/lenses.ts`:
  - `ZoneMapEntry` gains `declining: boolean;`.
  - `zoneMapModel(..., declining: Record<string, boolean> = {})` new last param; each entry
    `declining: declining[id] ?? false`.
- `game/src/scenes/WorldScene.ts`:
  - Import `{ ZonePeaks, ZONE_FLOOR, DECLINING_MIGRATE_DAMP, bumpPeak, isDeclining, declineGlyph }` from `../world/decline`.
  - Field `private zonePeaks: ZonePeaks = {};` (next to `tenure`).
  - Helper `private zoneHeads(): Record<string, number>` = `zonePopulations(this.dinoZones, this.dinos.map(d=>d.name), BOWL_ID)` (dedupe the repeated call), or inline.
  - `private bumpPeaks()`: `const pop = zoneHeads(); for (const z of zoneChain()) this.zonePeaks = bumpPeak(this.zonePeaks, z, pop[z] ?? 0);`
  - `private isZoneDeclining(zone): boolean` = `isDeclining(this.zonePeaks[zone] ?? 0, pop[zone] ?? 0)`.
  - In `maybeMigrate` top: `this.bumpPeaks();` (before the cooldown/chance gates so the peak always
    tracks). Keep `bumpTenures()` + `seedPlentyWord()`.
  - In `maybeMigrate`, after `tryHomesick(d)` returns false, before the settle-resist line:
    ```
    const home = zoneOf(this.dinoZones, d.name, BOWL_ID);
    const heads = zoneHeads()[home] ?? 0;
    if (heads <= ZONE_FLOOR) { this.lastMigrationMs = Date.now(); return; } // 460 floor
    const damp = this.isZoneDeclining(home) ? DECLINING_MIGRATE_DAMP : SETTLED_MIGRATE_DAMP;
    if (isSettled(tenureOf(this.tenure, d.name)) && resistsMigration(true, Math.random, damp)) return;
    ```
    (import `SETTLED_MIGRATE_DAMP` from belonging — already re-exported there.)
  - `zoneMapEntries()`: pass a declining map — build `{ [z]: this.isZoneDeclining(z) }` over `zoneChain()`.
  - `drawZoneMap`: after the `prosperityBadge(...) 🌾N` on the tier line, `+ (e.declining ? ` ${declineGlyph()}` : '')`.
  - Dev hooks (near `__zoneMap`): `__zonePeaks` → `{ ...this.zonePeaks }`; `__zoneDeclining` → map over `zoneChain()`; `__bumpPeaks` → `this.bumpPeaks(); return { ...this.zonePeaks };`.

### Reuse
`belonging.ts` (`resistsMigration`/`isSettled`/`tenureOf`/`SETTLED_MIGRATE_DAMP`), `zones.ts`
(`zonePopulations`/`zoneChain`/`zoneOf`), `lenses.ts` `zoneMapModel`. No new bias math.

### Test plan (Structure)
- Unit `decline.test.ts`: bumpPeak raises / no-ops same-ref at-or-below / never lowers; isDeclining
  true `heads<peak && heads>=1`, false at peak, false at 0; declineGlyph is '⬇'; DECLINING_MIGRATE_DAMP
  < SETTLED_MIGRATE_DAMP.
- Unit (belonging): `resistsMigration(true, ()=>0.4, 0.3)` false (0.4 ≥ 0.3), `resistsMigration(true, ()=>0.2, 0.3)` true; default damp unchanged (`()=>0.5` true at 0.6 default).
- E2E `tests/e2e/cycle-112-decline.spec.ts`: move dinos so a zone peaks at N then drains to 1 via
  `__startMigrationTo` + step across; `__bumpPeaks` between; assert `__zoneDeclining()[zone] === true`
  and the map lens renders ⬇; a full/at-peak zone reads false, no ⬇.

---

## Lore track — BACKLOG-464

### Create
- `game/src/world/lastone.ts`:
  - `lastoneLine()` → `'🍂 Gone quiet around here…'`
  - `lastoneEvent(name, zoneName)` → `` `🍂 ${name} is the last one left in ${zoneName}` ``
  - `lastoneMemory(zoneName)` → `` `you're the last one left in ${zoneName}` ``
- `game/src/world/lastone.test.ts` — see Test plan.

### Modify
- `WorldScene.ts`:
  - Import `{ lastoneLine, lastoneEvent, lastoneMemory }` from `../world/lastone`.
  - `private checkLastOne()`: `const pop = zoneHeads();` for each `zoneChain()` zone where
    `this.isZoneDeclining(z) && (pop[z] ?? 0) === 1`: find the lone resident
    `this.dinos.find(d => zoneOf(this.dinoZones, d.name, BOWL_ID) === z && !this.migrating.has(d.name))`;
    `const mem = lastoneMemory(zoneById(z).name);` if `recall(this.memory, d.name).includes(mem)` skip
    (dedup); else `this.memory = remember(this.memory, d.name, mem)`, `this.showBubble(d, lastoneLine())`,
    `this.logEvent(lastoneEvent(d.name, zoneById(z).name))`. Return the names beat.
  - Call `this.checkLastOne();` in `maybeMigrate` next to `seedPlentyWord()`.
  - Dev hook `__checkLastOne` → `this.checkLastOne()`.

### Reuse
`ai/memory.ts` (`recall`/`remember` — imported), `zones.ts` (`zoneById`/`zoneOf`), `WorldScene`
`showBubble`/`logEvent`, and 460's `isZoneDeclining` + peaks. No new save field.

### Test plan (Lore)
- Unit `lastone.test.ts`: line has 🍂; memory('The Grove') has 'The Grove' + no 'the The'; event names both.
- E2E `tests/e2e/cycle-112-lastone.spec.ts`: drain a zone to 1 resident (declining), `__bumpPeaks`,
  `__checkLastOne()` → the lone dino named; assert its `__memory` has the `last one left` line, a 🍂
  ticker line in `__events`. Second `__checkLastOne` → same dino NOT re-listed (dedup). Control: a
  2-resident zone → not beat.

---

**Combined ≈ 9 files.** Within arc budget. `showBubble` (not `flashFeed`) for the readable wistful line.

## Blockers
_(none at plan time)_

---

## Shipped (Coder)

**Structure track (460) — built first:**
- Created `world/decline.ts` (`ZonePeaks`, `ZONE_FLOOR=1`, `DECLINING_MIGRATE_DAMP=0.3`, `bumpPeak`,
  `isDeclining`, `declineGlyph`) + `world/decline.test.ts` (10 cases: peak raise/no-op/never-lower,
  declining true/false/floor/zero, knob ordering, glyph).
- `belonging.ts`: `resistsMigration` gains an optional `damp` param (default `SETTLED_MIGRATE_DAMP` —
  every existing caller byte-identical).
- `ui/lenses.ts`: `ZoneMapEntry.declining` + a `declining` map param on `zoneMapModel` (default `{}`).
- `WorldScene.ts`: import; `zonePeaks` field; `zoneHeads`/`bumpPeaks`/`isZoneDeclining`/`decliningZones`
  helpers; `bumpPeaks()` on the migrate cadence; the **floor** (`heads <= ZONE_FLOOR → return`, consumes
  the roll) and the **declining damp** in the settle-resist gate; ⬇ appended on the lens tier line; dev
  hooks `__zonePeaks`/`__zoneDeclining`/`__bumpPeaks`.

**Lore track (464) — built second (reuses 460's `isDeclining` + peaks):**
- Created `world/lastone.ts` (`lastoneLine`, `lastoneEvent`, `lastoneMemory`) + `world/lastone.test.ts`
  (3 cases: 🍂 mood, no double article, both-named event).
- `WorldScene.ts`: `checkLastOne()` — scans for a declining zone at `heads === 1`, files the memory +
  🍂 bubble + ticker for the lone resident, deduped against its recall ring; called on the migrate
  cadence; `__checkLastOne` dev hook.

**Deviations:** none — used `showBubble` (readable wistful line) per plan. `zonePeaks` is transient
(a live per-session high-water mark, like a peak-of-run), so no save-shape change; a restore reseeds
the peak to current, which is the honest transient behaviour (persisting decline across reload is a
natural follow-up, not stubbed).

**Status:** `npm run build` ✅ clean · `npx vitest run` ✅ **1329/1329** (+13) · new e2e ✅ (decline 1/1,
lastone 1/1, single-worker; decline tripped the catalogued cold Vite/Phaser boot flake once in a shared
run, green isolated).
