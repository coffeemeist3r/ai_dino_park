# Cycle 136 — QA

**Build:** ✅ `npm --prefix game run build` clean (TypeScript strict, no errors).
**Unit tests:** ✅ `npx vitest run` — **193 files / 1888 tests passed**, 0 failed (+30 this cycle).
**E2E tests:** ⚠️ `npx playwright test` — **548 passed / 4 failed**, all four accounted for:

| spec | verdict | evidence |
|---|---|---|
| `cycle-038-scan` "B again closes the dossier" | flake | passes isolated (re-run this fire, 5/5 green) |
| `cycle-047-warmth` "the tone path mends too" | flake | passes isolated (re-run this fire, 5/5 green) |
| `cycle-110-plenty` "hearsay chooses the destination" | flake | passes isolated (re-run this fire, 2/2 green) |
| `mobile-minds` long-dialog paging | pre-existing | BACKLOG-430; reproduced on a stashed clean HEAD in cycle 135, not from this diff |

The first three are the catalogued parallel-load flake (a different victim each run; all three were green
in a targeted re-run immediately after). Per the CHARTER's quality bar that is a note, not a regression.

**Boundary check:** ✅ `grep -rn "@mlc-ai/web-llm" game/src | grep -v "^game/src/ai/"` → empty.
**Save check:** ✅ no new save key, no version bump. The structure track writes existing `cairns` /
`stockpileByZone` fields; the lore track persists nothing. A pre-136 save restores unchanged and is **not**
given a founding ruin (asserted by the restore round-trip test).

---

## Lore track — BACKLOG-420

### Acceptance criteria

| criterion | status | evidence |
|---|---|---|
| 1st greet on a fond ticcing dino returns the 413 opener; `cycle-089-fond-caught` passes unchanged | **PASS** | `cycle-089-fond-caught.spec.ts` green **unedited**; `cycle-136-caught-again` "the register climbs" asserts `"don't mind"` on catch 1 |
| 2nd greet returns neither existing opener and reads as teasing | **PASS** | same spec — asserts `not.toContain("don't mind")` and `not.toContain('caught mid-fidget')` |
| 3rd and 4th both return the resigned opener (floors at 3+) | **PASS** | same spec compares the opening clause of catch 3 and catch 4; unit `caughtRegister(9, true) === 'resigned'` |
| two dinos with different signature axes tease differently | **PASS** | unit `new Set(axes.map(teaseOpener)).size === 5`; e2e "two fond dinos tease you in two different voices" over four of the cast |
| hearts < `FOND_MIN` stays bashful on catches 1–3 | **PASS** | e2e "warmth earns the tease"; unit `caughtRegister(1..9, false) === 'bashful'` |
| after `resetTic`, a new stretch starts at the 1st-catch fond opener | **PASS** | e2e "each register leaves at most one memory, and a new stretch starts warm again" drives production's own `resetTic` via `__resetTic` |
| each register files at most one memory per stretch (no duplicate on catch 4) | **PASS** | same e2e counts each memory string; all three are exactly 1 after four catches |
| greet path unchanged; a cancelled greet leaks no register | **PASS** | the count advances **inside** the `if (caught)` expression, after the cancel path has already nulled `caughtTic` (read at `WorldScene.ts` `replyFor`); `cycle-088-caught-mid-tic` green unedited |
| unit tests cover the register table across all five axes | **PASS** | `tests/unit/cycle-136-caught-again.test.ts` — 11 tests |
| e2e drives the real `__pickTone` path, zero console errors | **PASS** | `tests/e2e/cycle-136-caught-again.spec.ts` — 4 tests, `expect(errors).toEqual([])` |

### Reachability (CHARTER v7)
*In a fresh save, watched for ten minutes, what does the player see that they could not see before?*
Walk up to any dino that has been alone a little while and press Z twice. The **second** answer is
different from the first — and different again on the third — where for the last forty-seven cycles it was
the same sentence every time. On a dino you have not befriended it is *still* the same sentence every time,
and that contrast is itself new information the player can read. No seeding, no thresholds, no day boundary.

### Bugs found
None beyond the acceptance set. Note for the record: the escalation is deliberately transient — a save
reloaded mid-stretch starts the register over. That is specified in the design ("Out of scope"/Constraints),
not an oversight.

### Recommendation: **APPROVE**

---

## Structure track — BACKLOG-488

### Acceptance criteria

| criterion | status | evidence |
|---|---|---|
| fresh save shows exactly one derelict landmark in the Grove; `__standing('grove') === 0` | **PASS** | `cycle-136-mending` "a fresh park ships a ruin" |
| a restored save seeds nothing — no second founding cairn | **PASS** | same spec, "a restored save seeds nothing" — save → reload → still exactly 1 landmark, mended |
| the founding ruin costs the Grove no upkeep (`__runUpkeep(1)` → `[]`) | **PASS** | same spec; unit `upkeepDue(0) === 0`; `cycle-128-upkeep` "a fresh park owes nothing" still asserts `[]` on the live pass |
| a resident reaches the ruin, `patchedLine` fires, `derelict: false`, pile down by `REPAIR_COST` | **PASS** | "somebody walks over and puts it back up" — asserts all four, including `total(stockpile) === before - 1` |
| the fixer's recall ring names the ground and the structure | **PASS** | same test, `toContain('back up with your own hands')`; unit pins the ground name and glyph in `mendMemory` |
| `__mend()` reports the live errand and is null before/after — one at a time | **PASS** | same test asserts non-null mid-errand and null after resolve; `checkMend` returns early while `this.mend` is set |
| a ground that cannot pay dispatches nobody | **PASS** | "a ground that cannot pay sends nobody" |
| a ground with no residents dispatches nobody | **PASS** | `pickNearest` over an empty resident list returns null → early return (`WorldScene.checkMend`); unit `cycle-136-founding` pins that the founding ruin's ground *does* have residents, so the negative branch is the exception not the default |
| a live `__runUpkeep(1)` on a stocked ground with a ruin does **not** patch it | **PASS** | "the live day tick no longer patches by hand"; `cycle-128-upkeep` now asserts `[]` on the live pass with `stone: 8` banked |
| `__runUpkeep(7)` still patches arithmetically; the 128 lapse assertions hold | **PASS** | "an absence still settles arithmetically"; `cycle-128-upkeep` all 3 tests green (lapse count, granary split, cap lift, one-landmark floor all unchanged) |
| the errand does not fire in a zone the player is not in | **PASS** | "the errand does not fire in a ground the player has left" |
| unit tests cover the pure module; e2e watches the repair, zero console errors | **PASS** | `cycle-136-mending.test.ts` (12) + `cycle-136-founding.test.ts` (7); e2e 7 tests with `expect(errors).toEqual([])` |

### Reachability (CHARTER v7)
*In a fresh save, watched for ten minutes, what does the player see that they could not see before?*
Boot a new game, walk one edge west into the Grove — about fifteen seconds — and there is a **fallen cairn**
sitting on the west side, drawn faded. Within about twenty seconds a resident (Bramble, being nearest)
stops what it was doing, walks across the Grove to it, and **puts it back up**: the sprite comes back to
full, a 🛠️ floats over the dino, it says something, and the ticker carries both "The Grove patched up its
🗿" and "Bramble walked over and put The Grove's 🗿 back up". The Grove's pile goes from two stone to one.

This is the first time in the park's life that a *building* is mended by a *body*, and — equally the point —
the first time a fresh save has anything at all to show for the upkeep economy. Before this cycle, every
number this system touches was unreachable on a new game **by calibration**, and the calibration was written
down in `upkeep.ts` as a feature.

### Bugs found
None outstanding. Two caught and fixed in-fire, both recorded in the codeplan's Deviations:
1. The `__clearFounding` hook could lose a race with `loadFromDb()`'s promise and let the ruin reappear
   behind a spec that had cleared it — the same ordering class as cycle 133's freshness gate. Fixed with a
   `foundingCleared` flag, so the clear wins whichever resolves first.
2. The fixer's walk originally lived in the world-step movement branch, which meant the `__stepMend` hook
   advanced nothing and a spec would have had to wait on frame timing. The walk moved into `stepMend()`;
   exactly one place moves the fixer, and production and the spec drive the same call.

### Note for the Validator
Thirteen e2e specs unrelated to upkeep went red on the founding change and were repaired with an explicit
`emptyGrounds()` fixture rather than by weakening any assertion. This is the second consecutive cycle in
which a founding-state change has revealed a *large* population of specs silently depending on the founding
state — worth a line in the verdict, and possibly worth a Structure-Track item.

### Recommendation: **APPROVE**
