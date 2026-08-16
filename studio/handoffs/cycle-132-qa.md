# Cycle 132 — QA

## Gates

| Gate | Result |
|---|---|
| `npm run build` | clean |
| `npx vitest run` | **1777/1777** across 184 files (was 1753/184 → +24, 0 amended) |
| `npx playwright test` (after `kill-port 5173`) | **512/512, first full run, zero retries** (was 504) |
| `@mlc-ai/web-llm` outside `game/src/ai/` | 0 hits |
| Save format | additive only — two new optional fields, both guarded, absent → pre-484 behaviour |
| Tree | clean at each stage commit |

**Notable: no existing assertion was amended in either track.** Both features are cadence changes with an
explicit unchanged fallthrough, and 512 existing specs agreeing is the strongest evidence that the
fallthrough is real. Contrast M12's finding — 478 needed twenty amended assertions across sixteen files
because the *assertions* were narrower than the system. Here nothing needed touching, which is what a
feature that is genuinely inert until its own trigger looks like.

---

## Lore track — BACKLOG-412 (11 criteria)

| # | Criterion | Verdict | Evidence |
|---|---|---|---|
| 1 | Stung constant exists, `0 < STUNG < HOMESICK` | PASS | `TIC_AFTER_STEPS_STUNG = 6`; unit "is the shortest of the three, and positive" |
| 2 | Freshness predicate with an explicit expiry; expired → false | PASS | `stingIsFresh` / `STING_FADES_AFTER_STEPS = 24`; unit "the sting window" (4) |
| 3 | Distinct memory builder naming the ritual | PASS | `soothingTicMemory`; unit asserts it differs from `ticMemory` for the same label |
| 4 | Slink-off branch stings the denied gobbler | PASS | e2e "slinks off…": `__sting()[loser] === 0` *after* the 394 memory is confirmed present |
| 5 | Cede branch stings the ceding winner | PASS | e2e "the winner that cedes is stung too": winner 0, gobbler `null` |
| 6 | Unstung threshold unchanged | PASS | e2e control: bonded, non-strange, unstung dino has **not** ticced at 15 steps |
| 7 | Composes by `Math.min`, no override | PASS | unit "wins the compose for every intent" over all four intent kinds |
| 8 | Memory filed once per sting, on the forming step | PASS | `soothedFiled` guard; e2e asserts the soothing note present and `'alone a long while'` absent |
| 9 | Dev hook for sting state | PASS | `__sting()` reads all, `__sting(name)` drives one |
| 10 | e2e drives a **production** contest to a loser and watches the shortened onset | PASS | `__forceContest` runs `resolveContest` itself; not invented at 5 steps, invented at 6, `solo < 12` |
| 11 | Unit coverage of 1–3, 6–8; save untouched | PASS | 10 unit assertions; no save field added by this track |

**Observed, not required:** the sting is *not* persisted (by design — the codeplan's stated precedent), so a
reload clears every sting. That is a deliberate choice and the design says so; flagging it here only because
the mercy/pecking beats it sits beside *are* persisted through the memory ring, and a future item that wants
"still sore when you come back" would need a different home.

**One rewrite during the fire, logged in the codeplan:** the lore e2e's first draft failed
nondeterministically because its unbonded subject was a loner (135) and the mope roll outranks the tic. QA
confirms the fix is not a weakened assertion: the bonded subject makes both the *homesick* shortener and the
mope roll inapplicable, so the spec now isolates the sting more tightly than the draft did, not less.

---

## Structure track — BACKLOG-484 (12 criteria)

| # | Criterion | Verdict | Evidence |
|---|---|---|---|
| 1 | Pure module owns type, re-derivation, diff, wording | PASS | `world/term.ts`, no Phaser import, 14 unit tests |
| 2 | Turnover only on a membership change; re-order is not one | PASS | unit "reports nothing when the membership is unchanged — but still holds the fresh order" |
| 3 | First seating distinguishable, logs nothing | PASS | unit `kind: 'first'`; e2e "the seats hold…" asserts no turnover line after the first term |
| 4 | Consumers read held seats, else live | PASS | e2e "a park that has held no term reads live" — `__councils` and `__councilVotes` both |
| 5 | Runs on the day boundary, only past the last term day | PASS | `checkTerm` guard + its own `clock.onHour` listener |
| 6 | A restore/away-jump fires no term | PASS | armed at `create` and in `syncSeason`; e2e reload spec: banking + step moves no seat |
| 7 | Exactly one line per turnover, none when unchanged | PASS | e2e "the term moves them, once" — split-count is 1, and stays 1 after a no-change term |
| 8 | Round-trips through save/load; old save reads live | PASS | e2e reload spec; `councilSeats` absent → `null`, not `{}` |
| 9 | Held order preserved, so 481's tie-break is stable | PASS | unit (fresh order stored on every reseat) + e2e (`__councilVotes(zone).seats` holds order mid-term) |
| 10 | Dev hooks for the seating + a forced term | PASS | `__seating`, `__forceTerm` |
| 11 | e2e: seats hold mid-term, move on the term, one beat | PASS | `cycle-132-term.spec.ts` (4 specs) |
| 12 | Unit coverage 1–3, 5, 9; suite green; save additive | PASS | 14 unit; 512/512; two optional guarded fields |

**The criterion that earned its place is #4.** The codeplan flagged `null`-vs-`[]` as the one defect that
would pass every pre-existing spec, because a fresh park correctly seats nobody either way. The first term
spec is the only thing in the suite that would catch it, and it does: it asserts a fresh park not merely
seats nobody but *seats live on banking*, with no term held.

---

## Suite health — evidence for BACKLOG-486

**512/512, first full run, zero retries.** With cycle 131's 504/504 that is **two consecutive clean full
runs**, on a suite that grew by 8 specs in the interval. Set against cycle 130's two runs that each lost a
different spec, the honest reading is that the parallel-load failure is intermittent at this load rather
than resolved — two clean rolls do not disprove a die. 486 remains queued and unstarted; this cycle's data
point is logged for whoever picks it up, and the third consecutive clean run its acceptance asks for is now
one run away.

## Verdict recommendation

Both tracks: **APPROVED**. 23/23 acceptance criteria pass.
