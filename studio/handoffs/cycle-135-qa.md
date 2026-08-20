# Cycle 135 — QA

**Build:** ✅ clean — *after one QA fix, see "Bugs found" under the structure track.*
**Unit tests:** ✅ **1832 passed / 1832** (189 files). Baseline entering the cycle was 1821; +11 from the two new unit blocks.
**E2E tests:** ✅ **538 passed / 538**, two consecutive full parallel runs. Zero failures, zero retries, no isolated re-runs needed.

Notable: `mobile-minds.spec.ts` → "long dialogs page GBA-style: E forward, ◀ back, ✕ closes from any page" **passed in both full runs**. That is the standing red BACKLOG-430 tracks. Flagged for the Validator — it is not this cycle's work and one more green pair of runs does not close the item, but the evidence keeps accumulating (cycle 129 saw the same).

---

## Lore track — BACKLOG-416

### Acceptance criteria

| Criterion | Status | Evidence |
|---|---|---|
| `tic.ts` exports `kinshipMemory` + `kinshipLine`, pure, unit-tested | **PASS** | `game/src/world/tic.ts` tail; `tests/unit/cycle-135-not-the-only-one.test.ts` — 4 cases |
| Band is `watchingTic`, no second number introduced | **PASS** | unit "reuses 407's band and introduces no second distance" asserts 3/4/8/9 against `TIC_COMPANY_RANGE` + `ECHO_WATCH_RANGE`. Verified by grep: no new distance constant exists in `tic.ts` |
| `kinshipMemory('Mossback')` contains the name, not "friend" | **PASS** | unit "names the other dino without calling it a friend" |
| `kinshipLine('Rex','Sunny')` names both | **PASS** | unit "the ticker beat names both" |
| Both dinos file when ~5 apart and both ticcing | **PASS** | e2e "two loners in sight of each other are each less alone for it" — both rings contain the phrase *and* the other's name; ticker names both |
| Distance 2 (company range) files nothing | **PASS** | e2e "company is not kinship" — `__kinTic` returns `[]`, neither ring carries the phrase |
| Distance 10 (past `ECHO_WATCH_RANGE`) files nothing | **PASS** | e2e "out of sight is out of mind" |
| Pairwise bond unchanged across the beat | **PASS** | e2e "no bond is required, and none is moved" — bond read before/after via `__bondPair(a,b,0)`, equal |
| Filed at most once per stretch | **PASS** | e2e "filed once per solitary stretch" — 4 passes, ring holds exactly 1 copy per dino |
| Build / vitest / playwright green | **PASS** | see header |

**10/10 PASS.**

### Bugs found

None. Two things checked beyond the acceptance set, both clean:

1. **The `resetTic` clear is real, not just present.** The codeplan flagged that a missing clear would let test 5 pass while the feature quietly died after its first firing. Confirmed by reading `resetTic` — `this.kinFiled.delete(name)` sits beside `ticCaughtFiled`'s, and `resetTic` is the sole clear, which is the intended per-stretch lifecycle.
2. **407 is genuinely untouched.** e2e "neither ritual is interrupted, and 407's tallies are untouched" asserts `__ticEcho` stays `null` for both and both stay `invented`. The full `cycle-133-shared-tic.spec.ts` also passes unchanged in both full runs.

One **note, not a bug**, for the Validator: the codeplan called out memory-ring pressure (6 slots) from one more per-stretch note. Nothing went red — `pecking`, `manner` and the four hatch-string specs are all green — but the note is now filed and the observation stands for whoever picks up BACKLOG-483.

### Recommendation: **APPROVE**

---

## Structure track — BACKLOG-487

### Acceptance criteria

| Criterion | Status | Evidence |
|---|---|---|
| `councilMajority` exported, generic, unit-tested (majority / unanimity / tie→tieBreak / tie+null→votes[0] / []→null) | **PASS** | `governance.test.ts` — "councilMajority takes the plurality", "...falls to the say on an even split, then to the top banker", "...answers null for a ground that seats nobody" |
| `councilWorkPriority` answers identically to its pre-487 spec | **PASS** | the pre-487 cases are byte-identical in the file and pass — the delegation's regression proof |
| `councilSpendPriority` four stated cases | **PASS** | "the pantry vote is the work vote's twin, over its own enum" — all four asserted verbatim |
| `spendCallMeaning` returns exactly `SPEND_CALL`'s meanings | **PASS** | "the pantry beat reads the same table the lens glyph and the legend read" — asserted against the table, not a copied literal |
| Ground seating no council still reads the provider (compatibility control) | **PASS** | e2e "a fresh park has decided nothing" (`null` on fresh save) **and** "a council of one is still that one dino" (seat == say, answer flips with the one dino's warmth) |
| Council majority overrides the provider; hooks follow | **PASS** | e2e "the majority carries the pantry, over its own top banker" — `spendVotes` `['feed','bank','bank']`, `spendTieBreak` `'feed'`, `spendCall` `'bank'`, and `__spendPriority` (the read `feedReserve`/`granaryDeferredForFeeding` consult) returns `'bank'` |
| A flipped call lands one ticker beat in the legend's words; first record silent | **PASS** | e2e "a flipped pantry call is announced once" — silent on seeding, exactly 1 occurrence after the flip, still 1 after a no-change step |
| Lens row + `[?]` legend unchanged | **PASS** | `governanceLine` / `governanceLegend` untouched (git diff confirms); `cycle-124-governance-lens.spec.ts` green in both full runs |
| Old saves load; stored policy still the lingering fallback; additive only | **PASS** | `saveGame.ts` untouched (git diff confirms — no new field); the save round-trip specs pass in both full runs; `spendPriorityByZone`'s validator still accepts exactly `'feed'|'bank'`, which stays correct |
| Build / vitest / playwright green | **PASS** | see header |

**10/10 PASS.**

### Bugs found

1. **`governance.test.ts` had duplicate imports — and the Coder's "build clean" claim was made before that file was edited.** `SPEND_CALL` and `type SpendPriority` were already imported by the pre-existing 468/477 blocks, and the new 487 block imported them again. Vitest tolerated it (1832 green); `tsc` did not:

   ```
   src/world/governance.test.ts(7,8): error TS2300: Duplicate identifier 'SpendPriority'.
   src/world/governance.test.ts(18,3): error TS2300: Duplicate identifier 'SPEND_CALL'.
   ```

   **Fixed by QA** (test file, QA's lane — no production code touched): the duplicate lines were dropped from the new import block. Build clean after.

   The finding worth keeping is *not* the typo. It is that **a green unit suite does not imply a green build**, because vitest's transform does not type-check. The Coder ran build → then edited a test file → then ran vitest, and the order made a real type error invisible. That ordering is easy to repeat. Flagged to the Validator as a process note.

2. **The codeplan's `checkCouncilCall` trap was handled correctly, and QA verified it directly rather than trusting the note.** Read the shipped guard: `seated` is computed once, the work half fires on `seated || lean`, the spend half on `seated` alone, with the asymmetry commented. `cycle-133-bill-call.spec.ts` passes unchanged in both full runs — a derelict landmark still announces its labour lean and says nothing about the pantry.

3. **The `WorldScene.ts` non-null assertion at the handover site was confirmed by reading, not assumed** (the codeplan demanded this explicitly). The site is reached only under a live provider; both the council branch and the provider branch of the new ladder return non-null in that state. Sound. `handover.test.ts` and the 467 e2e are green.

**Deviation review.** The Coder's deviation 1 — declining to extract the shared announce helper the plan asked for — is accepted, and QA agrees with the reasoning: the two halves stop being the same shape once 485's lean is threaded through one of them, and a helper taking a parameter meaningless to one caller would be a worse seam than two honest blocks. That is *exactly* the shared-gate problem BACKLOG-489 is queued to solve properly. Deviations 3 and 4 are test-aim changes with equal or better coverage. All five are documented in the codeplan's Shipped section.

### Recommendation: **APPROVE**

---

## Summary

**20/20 acceptance criteria pass across both tracks.** Build clean, 1832/1832 unit, 538/538 e2e twice consecutively. One real defect found and fixed (a type error the unit suite could not see); one process note and one BACKLOG-430 evidence note passed to the Validator.
