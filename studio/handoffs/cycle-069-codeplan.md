# Cycle 69 — Code Plan

## Lore track — BACKLOG-312

**Files.**
- `game/src/keeper/scan.ts` — import `fidget` from `../world/fidget`; after the `mood:` line push
  `habit: ${q.glyph} ${q.label}` where `q = fidget(subject.traits)`.

**Reuse.** `fidget()` already exists (298) and `ScanSubject` already carries `traits`. No new module, no
new hook (the `__scanLines` and `__fidget` e2e hooks already exist).

**Tests.**
- `tests/unit/scan.test.ts` — assert the `habit:` line equals the `fidget()` glyph+label.
- `tests/e2e/cycle-038-scan.spec.ts` — new case: the dossier `habit:` line contains `__fidget('Rex').label`.

## Structure track — BACKLOG-308

**Files.**
- `game/src/scenes/WorldScene.ts`
  - `resource` field type gains `zone: string`; `spawnResource` sets `zone: this.zoneId`.
  - `cairns` field type gains `zone: string`; `placeCairn` stamps the crafter's zone
    (`zoneOf(this.dinoZones, crafter.name, BOWL_ID)`); `drawCairn` sets initial visibility by zone.
  - `checkGather` early-returns unless `this.resource.zone === this.zoneId`.
  - `handlePlot` early-returns unless `this.zoneId === BOWL_ID`; `refreshPlot` sets plot sprite visibility
    by bowl.
  - New `applyObjectVisibility()` (resource / cairn sprites / plot), called from `tryCrossZone`,
    `__setZone`, and the restore tail.
  - Restore backfills cairn zones (`zone: c.zone ?? BOWL_ID`).
  - New dev hook `__objVisible` → `{ resource, plot, cairns[] }` sprite-visibility (the render check).
- `game/src/world/saveGame.ts` — `cairns?` type gains optional `zone?: string`; deserialize validates
  `zone` is a string when present and preserves it.

**Reuse.** Leans entirely on existing primitives: `zoneOf`/`BOWL_ID` (zones.ts), the `inView` predicate
and `__setZone`/`tryCrossZone` zone-switch path (274), the additive-save validation pattern (`dinoZones`).
No new pure module — the gate is `zone === activeZone`, inline; the load-bearing behaviour lives in
WorldScene and is proven by e2e (as 274 was).

**Tests.**
- `tests/unit/saveGame.test.ts` — cairn `zone` round-trips; pre-308 cairn loads; non-string zone rejected.
- `tests/e2e/cycle-069-zone-objects.spec.ts` — resource zone render gate; plot bowl-only; resource
  gather gated by zone (migrate a dino to the grove, prove bowl can't gather it, grove can).

**No `SAVE_VERSION` bump** — cairn `zone` is additive over v2, validated, old saves default to bowl.
**Boundary intact** — neither track touches `ai/brain.ts` or adds a dependency.
