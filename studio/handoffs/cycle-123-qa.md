# Cycle 123 — QA

**Runs:** `npm run build` clean. `npx vitest run` → **1584/1584** (172 files, +43 this cycle).
`npx --yes kill-port 5173` → `npx playwright test` → **458/458** on a fresh full run (+12 this cycle).

**Boundary check:** `grep -rn "@mlc-ai/web-llm" game/src --include=*.ts` → `ai/webllm.worker.ts` and
`ai/webllmBrain.ts` only, both under `game/src/ai/`. Neither new module imports anything outside
`game/src/world/`. Neither calls `Math.random()` (the one textual hit in `capacity.ts` is its header comment
pinning the BACKLOG-456 rule).

**Save check:** `SAVE_VERSION` unchanged. One new optional field (`crossings`), guarded, absent-tolerant.

---

## Lore track — BACKLOG-361

| # | criterion | verdict | evidence |
|---|---|---|---|
| L1 | `recordCrossing` returns 1 first, then increments | **PASS** | `wandering.test.ts` "returns 1 on the first crossing and increments monotonically" |
| L2 | `crossingsOf` → 0 for an unknown name | **PASS** | "reads 0 for a dino that has never crossed" (both the empty and the populated map) |
| L3 | `originOf` → `seen[0]`, undefined for absent/empty | **PASS** | two `originOf` specs |
| L4 | reach 0 / 1 / 3 across the chain | **PASS** | three `reachOf` specs, bowl→Hollow = 3 |
| L5 | `reachOf` skips an unreachable id | **PASS** | "skips an unreachable ground rather than counting it as 0 hops" |
| L6 | `wanderStanding(0, anything)` is homebody | **PASS** | asserted at reach 0 **and** a fabricated reach of 99 |
| L7 | wanderer at reach ≥ 2, rambler below | **PASS** | thresholds written against `WANDERER_REACH`, not a literal |
| L8 | book line names the origin / carries both numbers | **PASS** | plus the singular-`crossing` case |
| L9 | a walked crossing is exactly +1 | **PASS** | e2e "a walked crossing counts once too" — drives `__startMigrationTo` + `__stepWorld` to arrival |
| L10 | the instant seam is exactly +1, never twice | **PASS** | e2e "the instant path counts exactly one crossing per arrival" (1 → 2, and nobody else moved) |
| L11 | save round-trips; an old save loads clean | **PASS** | `cycle-123-wandering.test.ts` save block, incl. malformed rejection and the no-back-fill case |
| L12 | every dino shows exactly one wander line; a fresh boot is all homebodies | **PASS** | e2e "a fresh park is all homebodies" iterates **every** row |
| L13 | e2e: homebody on boot → non-homebody with a count after a crossing | **PASS** | covered by the boot spec + "moving a lot and going nowhere is a rambler" |

**13/13.**

Extra checks QA ran beyond the criteria:

- **The two dimensions actually separate.** Sunny takes 4 crossings and stays `a rambler — 4 crossings, 1
  ground out`; Twitch takes 3 and reads `a wanderer — 3 crossings, 3 grounds out`. Fewer journeys, higher
  standing. If the item had shipped on a crossing count alone, Sunny would outrank Twitch, which is exactly
  backwards. This is the design's whole claim and it holds in-game, not just in a unit test.
- **Same-zone `__migrate` is not a journey** — explicit spec; the count holds at 1.
- **Reload** — the standing and the raw count both survive `page.reload()`.

---

## Structure track — BACKLOG-476

| # | criterion | verdict | evidence |
|---|---|---|---|
| S1 | grass only — waterhole, trail, creek, scrub all excluded | **PASS** | `capacity.test.ts` — the bowl is asserted as `COLS*ROWS - 6`, the other three by count |
| S2 | capacities 5 / 5 / 4 / 5 at 20×15 | **PASS** | `zoneCapacity` spec, and again live via `__zoneCapacity()` in e2e |
| S3 | never below 1, incl. an unknown id | **PASS** | `zoneCapacity('nowhere')` → 1; a 1×1 grid → ≥ 1 |
| S4 | false at capacity, true at capacity + 1 | **PASS** | `isCrowded(5,5)` false, `isCrowded(6,5)` true |
| S5 | `crowdedAppeal` is an exact identity when uncrowded | **PASS** | `toBe` (not `toBeCloseTo`) across four appeal values at both under- and at-capacity |
| S6 | strictly decreasing in excess, stays ≥ 0 | **PASS** | three-step ladder |
| S7 | monotonic in plenty at fixed heads | **PASS** | varied independently over food and prosperity |
| S8 | crowded < same ground at capacity | **PASS** | unit **and** e2e (the fifth mouth into the Fernreach, nothing else changed) |
| S9 | an uncrowded neighbour beats a richer crowded one | **PASS** | `richestNeighbor` picks `grove` on raw appeal and `fernreach` once damped |
| S10 | crowded resident resists at `CROWDED_MIGRATE_DAMP` | **PASS** | wired in `maybeMigrate`; constant asserted below `SETTLED_MIGRATE_DAMP` |
| S11 | crowded + declining takes the weaker hold | **PASS** | the `Math.min` pinned in the test, symmetric in argument order |
| S12 | the founding state is not crowded | **PASS** | unit `isCrowded(5, zoneCapacity(bowl))` false, **and** e2e `__crowded()` all-false on boot |
| S13 | no save field added | **PASS** | `saveGame.ts` diff touches only `crossings` (lore track); e2e "capacity re-derives on reload" |
| S14 | e2e: cast piled past capacity reads crowded, appeal drops | **PASS** | five into the four-capacity Fernreach |

**14/14.**

**The calibration verdict, which QA treats as the item's real acceptance test:** the plan said that if a
pinned migration spec moved, the knob was wrong and the *spec must not be amended*. **No pinned spec moved.**
Every pre-existing migration, carry, decline, frontier, plenty, yearning and distance spec passes unedited,
and no test file outside this cycle's two new ones was touched. That is the M10 finding read the right way
round: the suite not moving is the evidence that the feature is genuinely dormant at the founding state.

---

## Flakes seen, and why they are flakes

The **first** full e2e run lost two specs:

1. `cycle-077-carry` → "a crossing dino ferries one banked resource…" — the original pinned-pile noun on
   BACKLOG-456.
2. `cycle-121-work-priority` → "the work policy persists across a reload" — the **fourth** noun, added to
   456 last cycle: a reload racing the IndexedDB write under parallel load.

Both were re-run together in isolation (**6/6 pass, 12.3s**) and a fresh full run came back **458/458
including both**. Neither is off either of this cycle's diffs: 077 touches the resource carry (untouched
here), and 121 touches the work-priority save path (untouched here — the only save change this cycle is a
new optional field appended to a different part of the record). Catalogued, not excused; 456 already names
both.

## Verdict input

Both tracks clean. **27/27 criteria pass** (13 lore + 14 structure). Build clean, unit 1584, e2e 458.
