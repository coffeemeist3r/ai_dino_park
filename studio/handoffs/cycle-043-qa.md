# Cycle 43 — QA

**Item:** BACKLOG-179 [emergent] Cold-night shiver

- **Build:** ✅ `npm --prefix game run build` clean (type-check passes).
- **Unit tests:** ✅ 320 passed (37 files), incl. new `tests/unit/cold.test.ts` (+6).
- **E2E tests:** ✅ **116 passed** in a single full parallel run (`npx playwright test`), incl. the
  new `tests/e2e/cycle-043-cold-shiver.spec.ts` (+3). No flake this run — the catalogued
  cold-boot `cycle-003-save` parallel flake did not surface; full suite green first try.
- **Boundary:** ✅ `@mlc-ai/web-llm` imported only under `game/src/ai/` (grep clean). `cold.ts`
  is pure logic.
- **Save format:** ✅ no `SAVE_VERSION` bump — the cold memory rides the existing per-dino memory
  store (already persisted); additive only.

## Acceptance criteria

| # | Criterion | Status | Evidence |
|---|-----------|--------|----------|
| 1 | `world/cold.ts` exports `sleptCold`/`coldShiver`/`coldMemory`/`COLD_SEASON`, no Phaser | PASS | module is pure; imports only `type Season`; build green |
| 2 | `sleptCold(false,'winter')===true`, `sleptCold(true,'winter')===false` | PASS | `cold.test.ts` cases 1–2 |
| 3 | `sleptCold(false, s)===false` for spring/summer/fall | PASS | `cold.test.ts` "warm seasons never leave a sleeper cold" |
| 4 | `coldShiver()`/`coldMemory()` non-empty, both `🥶`, distinct | PASS | `cold.test.ts` "distinct, non-empty, both freezing" |
| 5 | After a winter night, `__coldSleepers()` contains the left-out dino, excludes the bonded one | PASS | e2e "a dino too loosely bonded for the winter den shivers cold at morning" — Rex/Mossback (bonded) excluded, `length>0` |
| 6 | Cold sleeper's `__memory` has a `🥶` entry and `__greetPrompt` carries it | PASS | e2e "the cold night files a memory that colours the next greeting" — `mem` has `🥶`, `prompt` contains `🥶` |
| 7 | The bonded dino gains **no** `🥶` memory | PASS | same e2e — `rexMem` has no `🥶` |
| 8 | A summer night's close leaves `__coldSleepers()` empty, no `🥶` memory anywhere | PASS | e2e "a summer night that ends leaves no shiver — warm seasons are inert" |
| 9 | Build / vitest / playwright all green | PASS | 320 unit / 116 e2e / build clean |

**9/9 acceptance criteria PASS** (the design listed 8; #5 is split here into the cold-sleeper
read and the bonded-exclusion, both green).

## On the Coder's plan deviation

The Coder dropped the planned positional `huddledTonight` Set in favour of reading the bond graph
at morning (`maxBond(d) >= huddleThreshold(nightSeason)` = "welcome in the den"). I verified this
was necessary, not a shortcut: in the bowl the central den makes `isHuddling` (proximity-only)
true for *every* dino, and `BOND_PER_MEET === 4` equals the winter bar, so the positional design
produced zero cold sleepers (confirmed via a throwaway probe — all five registered as huddled).
The bond-bar read is the same gate cycle-171 used to *seek* the den, so "slept cold" is exactly
the cycle-042 verdict's "who sleeps alone in winter." `sleptCold`'s signature is unchanged. Sound.

## Regression check

- cycle-018 huddle, cycle-042 winter-huddle, cycle-040 seasons, cycle-041 palates — all green
  untouched. The shiver is a morning-edge *read*; it changes no movement, no huddle eligibility,
  no egg/sky gate (eggs still `isClearNight`, sky still night-only override).
- No new `pageerror` in any boot; the morning resolution only runs after an in-window night.

## Bugs found

None.

## Recommendation

**APPROVE.**
