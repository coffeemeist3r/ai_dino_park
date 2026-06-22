# Cycle 68 — QA

Ran the full quality bar on the coder's commit. **Build clean; 687/687 unit; 219/219 e2e in one fresh run, no flake.** No `@mlc-ai/web-llm` import outside `game/src/ai/` (both tracks are pure-logic + Phaser glue; `homecoming.ts` and `zones.ts` stay Phaser-free). Save change is additive (`dinoZones?`), no `SAVE_VERSION` bump.

## Lore track — BACKLOG-306 (In-character homecoming)

| # | Criterion | Result |
|---|---|---|
| 1 | Welcome-back line contains homecomer name + `fidget()` quirk label + 👋 | **PASS** — e2e asserts all three on Sunny's homecoming after a 2-day catch-up |
| 2 | Quirk label equals `fidget(traitsOf(homecomer)).label` | **PASS** — e2e reads `__fidget('Sunny').label` and asserts the line contains exactly it |
| 3 | Two different most-pronounced traits → different welcome-back lines | **PASS** — unit (two stub labels → different lines) |
| 4 | No quirk lookup → byte-identical cycle-30 strings | **PASS** — unit locks all three tiers verbatim; the untouched cycle-030 e2e + cycle-112 unit pass |
| 5 | Pure/deterministic, no WebLLM, no save change; `homecoming.ts` Phaser-free | **PASS** |

Bonus: unit confirms only the homecomer's name is looked up (not the jealous runner-up), and an `undefined` lookup falls back to the plain line.

## Structure track — BACKLOG-274 (Populate the grove)

| # | Criterion | Result |
|---|---|---|
| 1 | `__migrate('X','grove')` (keeper in bowl) hides X + `nearestDino` no longer returns X | **PASS** — e2e: Mossback drops out of `__visibleDinos`; warped onto its tile, `__nearestDino` ≠ Mossback |
| 2 | After crossing into the grove, a grove dino is visible + `nearestDino` returns it | **PASS** — e2e: `__visibleDinos` === ['Mossback'], `__nearestDino` === Mossback |
| 3 | A grove dino doesn't eat bowl food / pick up bowl resources | **PASS (by construction)** — `checkFeeding`/`checkGather` both AND-gate the find on `inView`, the same predicate the e2e exercises through `nearestDino`; covered by code + the shared-predicate unit-evidence |
| 4 | Home zones persist across save/reload | **PASS** — e2e migrates Glade, `__saveNow`, reload → Glade still in the grove |
| 5 | Old save with no `dinoZones` → all bowl | **PASS** — unit (`deserialize` defaults `{}`); the cycle-061 v2 round-trip + cycle-059 zone specs green |
| 6 | Spawn byte-identical (all 5 in bowl, every existing interaction unchanged) | **PASS** — `__visibleDinos` contains the full roster at boot; 216 prior e2e green untouched |
| 7 | Ambient migration capped ≤1/in-game-day, never on boot/restore | **PASS (by construction)** — real-time roll (`MIGRATE_ROLL_INTERVAL_MS=90s`) + `lastMigrationDay` guard, no `onHour`/`clock.set` hook; no spec flaked across the full 1.9-min run |

## Notes
- Object render-scoping (food/cairn/plot/resource sprites still draw at bowl coords regardless of zone) is **explicitly out of scope** (BACKLOG-308) per the design — not a regression.
- No screenshots needed; no failures.

**Recommend APPROVE / APPROVE.** State → validator-pending.
