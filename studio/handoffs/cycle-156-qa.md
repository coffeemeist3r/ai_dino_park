# Cycle 156 — QA

**Gates:** `npm run build` clean · `npx vitest run` **2650 passed / 3 skipped, 251 files** ·
`npx --yes kill-port 5173` then `npx playwright test` **706/706 passed** (6.3m).

Unit count moved 2602 → 2650 (+48). E2E count moved 696 → 706 (+10: five sitting specs, four sulk specs,
and one added to `cycle-155-glance.spec.ts`).

---

## Lore track — BACKLOG-123: 11 / 11 criteria PASS

| # | Criterion | Verdict | Evidence |
|---|---|---|---|
| 1 | `sulk.ts` pure, Node-testable, covers 0/39/40/41/negative | **PASS** | `game/src/world/sulk.ts` imports nothing at runtime; `sulk.test.ts` parameterises -1, 0, 1, 39, 40, 41 |
| 2 | `SULK_FADES_AFTER_STEPS` is 40 and defined once | **PASS** | `grep -rn "SULK_FADES_AFTER_STEPS =" game/src` → one hit, `sulk.ts:28` |
| 3 | 40 steps clears `__pendingRepair()` with no keeper input | **PASS** | e2e *a sulk nobody attends to ends on its own after forty steps* |
| 4 | Unattended clear files `shookItOffMemory` from an exported builder | **PASS** | same spec asserts the memory; `WorldScene.checkSulk` calls the import, no literal at the call site |
| 5 | Unattended clear floats a line and the glyph stops being 😒 | **PASS** | e2e *the shakeoff plays the same recovery flourish*; `pendingRepair` is `null`, so `moodFidget` receives no `'sulk'` |
| 6 | A greet inside the window still takes the 125 repair path, files no shakeoff | **PASS** | e2e *a make-up greet inside the window still takes the repair ending*; all three pre-existing `cycle-032-repair` specs still green |
| 7 | Feeding a sulking dino clears it with `repairMemory`, not `shookItOffMemory` | **PASS** | code path at the eat site; the memory it files is `repairMemory(d.name)` |
| 8 | A never-slighted dino files no shakeoff memory | **PASS** | e2e *a dino that was never slighted never files a shakeoff memory* — asserts the set of dinos with the string equals exactly `[sulker]` |
| 9 | e2e reaches a sulk and drives steps, no `waitForTimeout` for the window | **PASS** | `driveSteps` calls `__stepWorld` in a loop; the file contains no `waitForTimeout` at all |
| 10 | Save additive / old save loads | **PASS** | this track adds no save field; `pendingRepairAt` is in-memory only, like `pendingRepair` |
| 11 | Build + vitest + playwright green | **PASS** | see Gates |

### Criterion 7 is the weakest evidence in this track, and QA is saying so

Feeding-as-kindness is covered by the **unit-level reading of the code path and nothing else**. There is
no e2e that drops food in front of a sulking dino and watches the funk end, because staging *jealousy*
and staging *a specific dino reaching the hatch first* in the same spec is a two-condition setup the
existing helpers do not compose. Every other criterion in this track has a spec that would fail if the
behavior regressed; this one has a reviewer.

That is a real gap and it is recorded rather than rounded up. It does not fail the criterion — the branch
is three lines, it sits at the resolved-eat point where `warming` already does the identical thing one
line above, and its guard is the same `this.pendingRepair === d.name` the two greet paths use. But if this
beat breaks later, no test will say so, and the next cycle that touches `checkFeeding` should know that.

### Criterion 5, honestly

The spec asserts `pendingRepair` went null and the bubble appeared, and infers the glyph from that,
because `moodFidget`'s `'sulk'` argument is derived from `pendingRepair` at render time
(`WorldScene.ts:5700`) and cannot disagree with it. That inference is sound but it is an inference; the
mark itself is not read. Noted, not disputed.

---

## Structure track — BACKLOG-542: 11 / 11 criteria PASS

| # | Criterion | Verdict | Evidence |
|---|---|---|---|
| 1 | `session.ts` pure, no `Date.now()` inside | **PASS** | file has no imports at all; every timestamp is a parameter |
| 2 | `SESSION_MIN_MS` imported, exactly one definition in the tree | **PASS** | `grep -rn "SESSION_MIN_MS =" game/src` → one hit, `departure.ts:60`; `session.test.ts` imports it and pins 20_000 |
| 3 | `pushSession` caps at 3, newest first | **PASS** | unit *keeps the last three sittings, newest first* → `[7, 5, 3]` |
| 4 | `closeSession` idempotent | **PASS** | unit asserts `toBe` (same reference), not `toEqual`; and e2e asserts the blur→visibilitychange pair files one record |
| 5 | A sitting under the floor is not pushed | **PASS** | e2e *a sitting too short to count is not written down* (3s → `[]`) |
| 6 | `sittingLine` at 0s/40s/100s/12m/hour-plus | **PASS** | unit table covers 0, 999, 40k, 60k, 100k, 720k, 3.6M, 3.84M, plus 725k and a negative |
| 7 | Plaque shows `Sitting · …` on a fresh save and the value increases | **PASS** | e2e *the brass says how long this sitting has run* and *the sitting grows while you stand there* (40s → 1m 40s) |
| 8 | No `sitting` → byte-identical to the pre-156 plaque | **PASS** | unit *is byte-identical to the pre-156 plaque when no sitting is passed*; the whole existing `plaque.test.ts` is unedited except by addition |
| 9 | After departure+return the closed session is in the save and the line reset | **PASS** | e2e *leaving files the sitting, and coming back starts a new one* + *the filed sittings reach the save* |
| 10 | Additive save, old save loads | **PASS** | `saveGame.ts` parse block is `if (o.sessions !== undefined)`, absent → `undefined` → `?? []` at load; no version bump |
| 11 | Build + vitest + playwright green | **PASS** | see Gates |

---

## The finding of the night: the change that passed everything

The code plan predicted that resetting `sessionStartedAt` would change BACKLOG-119's behavior and warned,
in advance and in writing, that a reddened glance spec must be treated as a true change and not a flake.

**Nothing reddened.** All six `cycle-155-glance` specs passed untouched, on the first run, and would have
gone on passing forever.

They passed because **not one of them has a second sitting.** Every one boots, ages the session once,
blurs once, asserts, and ends. The path the change actually altered — return, then leave again — was
never walked by the suite, so a real, deliberate, user-visible semantics change sailed through 706 green
tests without leaving a mark on any of them.

QA's position: **a green suite is not evidence that a predicted change did not happen.** It is evidence
that nothing which ran disagreed. The Coder added the seventh spec rather than accepting the green, and
that spec fails against the pre-156 code and passes against this one, which is the only thing that makes
the claim checkable. Had the plan not written the prediction down beforehand, this would have shipped as
an invisible behavior change with a full green board behind it — which is uncomfortably close to the
shape of the complaint CHARTER v7 was written over: every criterion passed, every suite was green, and
the thing that was actually true went unexamined.

The number worth keeping: **one predicted change, zero specs that noticed, one spec added.**

## Known flake, recorded not rounded

First parallel run of the two new spec files dropped `cycle-156-sitting`'s first two tests at `boot`
(`__ready` 30s timeout). Isolated re-run: 5/5 in 4.7s. Two subsequent full-suite runs: 706/706 both times.
This is the cold Vite/Phaser start of BACKLOG-538 — the item sitting in the Structure Track *about* this.
Not a regression; the third consecutive cycle to log an instance of it.

## Verdict recommendation

**Both tracks: APPROVED.** Every criterion passes with evidence. The two gaps above (no e2e for
feeding-as-kindness; the glyph inferred rather than read) are recorded weaknesses in the evidence, not
failures of the behavior, and neither touches the reachability answer for either track.
