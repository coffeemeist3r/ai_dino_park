# Cycle 112 — Design (two tracks)

Build **Structure track (460) first** — it creates `world/decline.ts`, which the Lore track (464)
imports. Both edit `WorldScene.ts` (the `maybeMigrate` cadence + the lens model), no shared lines.

---

## Structure track — BACKLOG-460 (The draining zone)

### Spec
A zone whose population has fallen below its own high-water mark reads **declining** (⬇ on the map
lens). Its settled residents lean harder to leave (a weaker migrate-resist), giving a scarcity
exodus momentum — capped by a floor that never drains a zone below one resident.

**Pure module `world/decline.ts`:**
- `type ZonePeaks = Record<string, number>` — each zone's population high-water mark.
- `const ZONE_FLOOR = 1` — the floor: the ambient wander never drains a zone below this.
- `const DECLINING_MIGRATE_DAMP = 0.3` — a declining zone's settled resident resists the wander at
  this rate (vs. `SETTLED_MIGRATE_DAMP = 0.6` for a stable zone): a hollowing zone holds people more
  weakly. The calibration knob.
- `bumpPeak(peaks, zone, heads): ZonePeaks` — raise a zone's peak to `heads`; returns the **same**
  reference when `heads <= peak` (never lowers; cheap no-op).
- `isDeclining(peak, heads): boolean` → `heads < peak && heads >= ZONE_FLOOR` — has the zone lost
  residents from its peak while still holding at least the floor.
- `declineGlyph(): string` → `'⬇'` — the lens marker.

**WorldScene wiring:**
- Field `private zonePeaks: ZonePeaks = {}` (transient, like `tenure` — no save change).
- New `private bumpPeaks()`: for each `zoneChain()` zone, `bumpPeak(peaks, zone, heads(zone))`.
  Call it at the top of `maybeMigrate` (before the migration), next to `bumpTenures()`, so a zone's
  peak registers before anyone leaves it that roll.
- In `maybeMigrate`, after `tryHomesick` and before the settle-resist gate, compute `home` + `heads`:
  - **Floor:** `if (heads <= ZONE_FLOOR) return;` — the ambient push never empties a zone.
  - **Harder lean:** the settle-resist gate uses `DECLINING_MIGRATE_DAMP` when the home zone
    `isDeclining` (and `heads > ZONE_FLOOR`, already guaranteed past the floor return), else
    `SETTLED_MIGRATE_DAMP` — via a new optional `damp` param on `resistsMigration`.
- Lens: `ZoneMapEntry` gains `declining: boolean`; `zoneMapModel` takes a `declining` map (default
  `{}` → false, older callers valid); WorldScene passes each zone's `isDeclining(peak, heads)`;
  `drawZoneMap` appends `declineGlyph()` to the prosperity line when declining.
- Dev hooks: `__zoneDeclining()` → `Record<zone, boolean>`; `__zonePeaks()` → the peaks map;
  `__bumpPeaks()` → run one peak-bump pass now (lets the e2e seed a peak deterministically).

### Acceptance criteria (Structure)
1. `bumpPeak` raises to a higher head count, no-ops (same ref) at/below the current peak, never lowers.
2. `isDeclining` is true when `heads < peak && heads >= 1`, false at/above peak, false at `heads === 0`.
3. A zone drained from peak N to 1 reads `declining === true`; a stable/growing zone reads false.
4. The map lens shows ⬇ on a declining zone and not on a stable one (`__zoneDeclining` + a rendered ⬇).
5. The floor holds: the ambient `maybeMigrate` never leaves a zone at 0 residents (the last resident
   of a zone is not pushed out by the wander). [e2e drives the guard via the exposed path.]
6. `resistsMigration(true, rand, DECLINING_MIGRATE_DAMP)` resists at the lower rate; the default arg
   keeps every existing caller byte-identical (0.6).
7. Build clean · vitest green · no regression in 450/428/341 (migration, prosperity, belonging).

---

## Lore track — BACKLOG-464 (Last one standing)

### Spec
When a zone has hollowed to its final resident (`isDeclining` **and** `heads === 1`), that lone dino
sounds a wistful beat and keeps a memory of the emptiness.

**Pure module `world/lastone.ts`:**
- `lastoneLine(): string` → `'🍂 Gone quiet around here…'` — the wistful bubble.
- `lastoneEvent(name, zoneName): string` → `🍂 ${name} is the last one left in ${zoneName}` — ticker.
- `lastoneMemory(zoneName): string` → `you're the last one left in ${zoneName}` — the trace (rides
  recall into the next greeting; no leading article, the storesFedLine trap).

**WorldScene wiring:**
- New `private checkLastOne()`: for each `zoneChain()` zone where `isDeclining(peak, heads)` **and**
  `heads === 1`, find the lone resident; if it does **not** already carry `lastoneMemory(zoneName)`
  in its recall ring (dedup → a moment, not a tic), file the memory, `showBubble` the wistful line,
  and `logEvent` the ticker line. Call it in `maybeMigrate` next to `seedPlentyWord()`.
- Dev hook: `__checkLastOne()` → runs the scan now and returns the names that got the beat.

### Acceptance criteria (Lore)
1. `lastoneLine()` contains 🍂; `lastoneMemory('The Grove')` contains 'The Grove' with no double
   article; `lastoneEvent('Rex','The Grove')` names both.
2. A zone declining and down to its last resident: that dino gets the 🍂 bubble, the ticker line, and
   the `last one left` memory (via `__checkLastOne`).
3. Dedup: a second `__checkLastOne` on the same still-hollow zone does **not** re-file the memory or
   re-fire the beat (reads once per hollowing).
4. Control — a zone with 2+ residents, or a zone at its peak (not declining), fires **no** beat.
5. NPCBrain boundary intact (pure deterministic strings); no new save field; build + unit + e2e green.

---

**Combined touch estimate:** `decline.ts` + `decline.test.ts` + `lastone.ts` + `lastone.test.ts` +
`belonging.ts` (one optional param) + `lenses.ts` (one field) + `WorldScene.ts` + 2 e2e ≈ 9 files.
Within the arc budget.
