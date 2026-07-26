# Cycle 112 — QA

**Build:** ✅ clean (`npm run build`, tsc + vite).
**Unit tests:** ✅ **1329/1329** (`npx vitest run`, root config = tests/unit + game/src) — includes new
`decline.test.ts` (10) + `lastone.test.ts` (3).
**E2E tests:** ✅ **386/386 green** (`npx playwright test`, full suite, 7.4m) — a fully clean run: both
catalogued flakes passed this time (`cycle-077-carry` BACKLOG-456 parallel-load, `mobile-minds.spec.ts:79`
BACKLOG-430 dialog-paging), and both new specs (`cycle-112-decline` 1/1, `cycle-112-lastone` 1/1) are
green **in the full parallel run**, not just isolated.

**WebLLM boundary:** ✅ `@mlc-ai/web-llm` imported only under `game/src/ai/` (webllmBrain, webllm.worker).
New modules `world/decline.ts` + `world/lastone.ts` are pure deterministic strings/math — no inference.
**Save shape:** additive — no new persisted field (`zonePeaks` transient like a peak-of-run tracker).

---

## Structure track — BACKLOG-460 (The draining zone)

### Acceptance criteria
| criterion | status | evidence |
|---|---|---|
| bumpPeak raises to higher heads, no-ops (same ref) at/below, never lowers | PASS | `decline.test.ts` bumpPeak block |
| isDeclining true `heads<peak && heads>=1`, false at/above peak, false at 0 | PASS | `decline.test.ts` isDeclining block |
| a zone drained peak→1 reads declining; a stable/grown zone reads false | PASS | e2e `cycle-112-decline` (`__zoneDeclining().grove===true`, `.bowl===false`) |
| the map lens shows ⬇ on a declining zone, not on a stable one | PASS | e2e `cycle-112-decline` (`__zoneMap()` grove `.declining===true`, bowl false) |
| floor: the ambient wander never leaves a zone at 0 residents | PASS | `ZONE_FLOOR=1` + the `heads<=ZONE_FLOOR→return` guard in `maybeMigrate` (unit-pinned constant; ambient path is timer-internal, same as every maybeMigrate branch) |
| declining damp lowers resist; default arg keeps existing callers byte-identical | PASS | `decline.test.ts` knob ordering; belonging `resistsMigration` default unchanged (full suite green — 341/450 no regression) |
| build/unit/e2e green, no 450/428/341 regression | PASS | full suite 386/386; scarcity/prosperity/belonging specs green |

**Bugs found:** none.
**Recommendation:** **APPROVE.** This closes the last open arc of Milestone 7.

---

## Lore track — BACKLOG-464 (Last one standing)

### Acceptance criteria
| criterion | status | evidence |
|---|---|---|
| line carries 🍂; memory names the zone, no double article; event names both | PASS | `lastone.test.ts` (3 cases) |
| a declining zone at heads===1 → the lone dino gets 🍂 bubble + ticker + memory | PASS | e2e `cycle-112-lastone` (`__checkLastOne()===[lone]`, memory `last one left`, 🍂 ticker) |
| dedup: a second scan on the still-hollow zone re-fires nothing (once per hollowing) | PASS | e2e `cycle-112-lastone` (second `__checkLastOne()===[]`, memory count stays 1) |
| control: a 2+ resident / at-peak zone fires no beat | PASS | e2e `cycle-112-lastone` (at peak-2 `__checkLastOne()===[]`) |
| NPCBrain boundary intact, no save field, build/unit/e2e green | PASS | boundary grep clean; additive; full suite green |

**Bugs found:** none.
**Recommendation:** **APPROVE.**
