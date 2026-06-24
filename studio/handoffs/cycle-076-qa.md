# Cycle 76 — QA

**Build:** ✅ `npm run build` clean.
**Unit tests:** ✅ 775 passed (81 files), incl. `curiosity.test.ts` (4) + `saveGame.test.ts` per-zone block (+3).
**E2E tests:** ✅ effectively 240/240 — every spec passes. Two caveats, both the **known parallel-load flake** (CHARTER quality bar; memory `e2e-boot-flake`): (1) the two new cycle-076 specs hit the cold-boot `__ready` timeout on a cold-server first run, green on warm; (2) full runs show **2 rotating failures** out of 240 (run A: cycle-069-zone-objects + cycle-028-realtime; run B: cycle-057-grudging-thanks + cycle-076-news-pull) — a *different* pair each run, **all passing isolated**. A rotating, non-deterministic failure set that clears isolated is the parallel-worker flake, not a regression. Notably `cycle-069-zone-objects` (which exercises the exact gather/zone path 328 changed) passes isolated, confirming the per-zone banking is sound.

---

## Lore track — BACKLOG-345: News pulls a newcomer

| Criterion | Status | Evidence |
|---|---|---|
| `groveCurious` pure; true iff bowl + unvisited + has grove-news token | PASS | curiosity.test.ts "a bowl dino that heard grove news… is curious" |
| A *heard* rumor qualifies; a visited dino with first-hand news does not | PASS | curiosity.test.ts "already crossed is not curious, even carrying first-hand news" (uses a heard rumor line for the positive case) |
| With a curious candidate, the pick comes from the curious set | PASS | cycle-076-news-pull.spec.ts — `__maybeMigrate()` returns `'Mossback'` (the lone curious dino) and it starts migrating |
| No curious candidate → uniform random over all (existing specs green) | PASS | the cycle-072 liveliness + 073/074 migration specs pass (they drive `__startMigration`/`__migrate` directly); `pool === candidates` fallback unchanged |
| One-time: a crossed (visited) dino is no longer curious | PASS | curiosity.test.ts visited-exclusion; in the e2e Rex (visited) is not chosen despite carrying first-hand news |
| Pure, no `ai/` import, no save change, build clean | PASS | curiosity imports only groveword + zones; no save field added for 345; build ✅ |

**Bugs found:** none.
**Recommendation:** APPROVE.

---

## Structure track — BACKLOG-328: Per-zone stockpile

| Criterion | Status | Evidence |
|---|---|---|
| A zone banks into its own pile; the other is untouched | PASS | cycle-076-zone-stockpile.spec.ts — bowl `branch:1` while grove empty; grove `stone:1` while bowl `branch` stays 1 |
| The cap is per zone (a full bowl pile doesn't stall grove banking) | PASS | `atCap(this.pileFor(zone), kind)` reads the gatherer's zone pile; cycle-070-stockpile-cap unit + the per-zone bank e2e confirm independence |
| A craft/shelter spends the builder's zone pile only | PASS | `craft`/`buildShelter(this.pileFor(zone))` assign back to that zone; cycle-064-craft + cycle-074-shelter specs pass (bowl path), 069 zone path passes isolated |
| Plaque Stores + `__stockpile()` follow the keeper's active zone | PASS | cycle-076-zone-stockpile.spec.ts — `__stockpile()` reads `stone:1` in grove, `branch:1` back in the bowl |
| Additive save: round-trips `stockpileByZone`; pre-328 save loads; malformed rejected; version 2 | PASS | saveGame.test.ts — round-trip, pre-328 load (stockpileByZone undefined), two malformed → null |
| Pure `resource.ts` helpers reused unchanged; build + suite green | PASS | no resource.ts change in the diff; build ✅; suite green (mod the rotating flake) |

**Bugs found:** none. The per-zone banking path (`cycle-069-zone-objects`) passes isolated — no regression.
**Recommendation:** APPROVE.
