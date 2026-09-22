# Cycle 165 — QA

**Gate:** `npm run build` clean. `npx vitest run` — **2950 passed, 3 skipped, 277 files, 0 failed**.
`npx --yes kill-port 5173` then `npx playwright test` — **804 passed, 0 failed**, 7.3 minutes, two workers.
Boundary check: `grep -rn "@mlc-ai/web-llm" game/src --include=*.ts | grep -v "^game/src/ai/"` → empty.

**No flake to report tonight.** Two full e2e runs were needed and the first one was red, but it was red on
a **real regression** (below), not on the BACKLOG-553 boot stall. The second full run, after the fix, was
clean at 804/804 on the first attempt. That is worth saying plainly because the last three chronicles have
each reported the stall biting; tonight it did not.

---

## Lore track — BACKLOG-156: 13/13 PASS

| # | Criterion | Result | Evidence |
|---|---|---|---|
| L1 | Deterministic per keeper | PASS | unit: all four ids, two calls, byte-identical |
| L2 | Four distinct selves | PASS | unit: `new Set(texts).size === KEEPERS.length` |
| L3 | Hand-written backstory kept verbatim | PASS | unit: `toContain(k.backstory)` for each; e2e asserts 'Quiet Accord' survives to the screen |
| L4 | `source: 'procedural'`, within `PERSONA_MAX` | PASS | unit, all four |
| L5 | Seeded off the id, not the name | PASS | unit: renamed keeper, same id → identical; changed id, same name → different |
| L6 | Draft folding reuses the shared fn | PASS | unit: valid → `'llm'`; null and `'ok.'` → floor unchanged; an authored self is settled |
| L7 | `keeperIntroLines` shape | PASS | unit: three lines, self last |
| L8 | Fresh save, `K` then `1` shows Aki's self | PASS | e2e, keyboard-driven, self > 40 chars |
| L9 | Observer 2 shows a different self | PASS | e2e: Vix's line present, Aki's absent |
| L10 | Cached, and equal to what was shown | PASS | e2e: null before the pick, non-empty after, contained in the dialog |
| L11 | A switch authors the incoming observer | PASS | e2e: Aki then Kes; Kes's own 'descendant' line, not Aki's |
| L12 | Save round-trip, additive | PASS | unit: a persona the production author produced, round-tripped; old-shaped save still loads |
| L13 | WebLLM boundary intact | PASS | grep, above |

**Two things QA wants on the record rather than in a footnote.**

First, **L8–L11 are driven through the keyboard**, not through `__pickKeeper`. The claim this item makes
is about what a player sees after pressing two keys on a fresh save, and a hook that calls
`pickKeeperIndex` directly would have proved the cache and not the reachability. The hook path is already
covered by cycle-037's spec.

Second, **L10's `source` is asserted to be `'procedural'`, deliberately.** Headless CI has no WebGPU, so
the authored path cannot run there and an assertion that hoped for `'llm'` would be a test that only ever
passes on a machine nobody runs the suite on. What is pinned is the graceful-degradation contract the
CHARTER actually requires.

**Uncovered, disclosed:** the WebLLM `authorKeeper` path itself is unexercised end-to-end — no headless
runner can execute it. `buildKeeperPersonaMessages` is pure and exported but has no unit test of its own;
the risk is a badly-worded prompt, not a crash, and the fold-and-validate path it feeds *is* covered.
Same standing as `buildPersonaMessages` has had since BACKLOG-103.

---

## Structure track — BACKLOG-533: 12/12 PASS

| # | Criterion | Result | Evidence |
|---|---|---|---|
| S1 | Lint exists and passes | PASS | 5 tests in `cycle-165-founding-declaration.test.ts` |
| S2 | Baseline length asserted as a literal | PASS | `BASELINE_COUNT = 251`, plus a no-duplicates assertion |
| S3 | A new undeclared spec fails the rule | PASS | predicate over synthetic sources (`boot(page)` → false) |
| S4 | A fixed baseline entry fails the rule | PASS | separate assertion, with the message telling the author to lower the count |
| S5 | Failure message names file + fixtures | PASS | both messages list the offenders and the four legal names |
| S6 | `SULK_ART_KEY` exported and placed | PASS | `world/expiry.ts`; `worldPlacedProps()` |
| S7 | `unplacedRigs()` empty, register green | PASS | `cycle-145-reachability.test.ts` green in the full run |
| S8 | Built via `makeHourMark` | PASS | e2e `__markKind(name, 'sulk')` returns a text-or-image mark |
| S9 | Worn for the funk's length, by the sore dino only | PASS | e2e: loser wears it, winner does not |
| S10 | Clears on expiry and on the keeper's attention | PASS | e2e: 21 steps clears it; a greet clears it early |
| S11 | Not stacked under the cold | PASS | e2e: cycle-047's production cold morning + a forced contest on the same dino → `cold`, not `sulk` |
| S12 | Suite green, build clean | PASS | the gate, above |

**S11 is the one QA nearly accepted on a weaker instrument.** The first draft reached for a `__chill`
hook to put a dino into the cold funk. No such hook exists, and writing one would have fabricated the
state rather than producing it — the cycle-128 discipline. It is staged instead through cycle-047's own
`stageColdMorning` (a bonded pair, a winter night, the window's closing edge) with a forced contest laid
on top, so the dino is in both states by the routes the game actually puts it in them.

**On the ratchet's honesty.** The lint cannot fail today — that is what a baseline of 251 means — so QA
checked the thing that *can* rot: both cycle-165 specs are outside the baseline and both declare. The
cycle that wrote the rule did not exempt itself from it, which is the smallest possible proof that the
non-baseline branch is live and not decorative.

---

## The regression, and QA's view of the fix

`cycle-038-scan.spec.ts` failed the first full run. QA reproduced it isolated, then stashed the tree and
watched it pass on clean HEAD. **Not a flake — a regression, caused by this cycle's lore track.**

The keeper confirmation dialog went from two lines to three, the third being a 240-character paragraph,
which is long enough for `DialogBox` to paginate. Three sites in that spec pressed a single hard-coded
`E` to dismiss it; after this change that keypress advances the page instead of closing the box. Only one
of the three asserted anything afterwards, so only one went red — **the other two were already doing the
wrong thing and getting away with it**, which is the more useful half of the finding.

Fixed in the spec rather than in the feature, and QA agrees with that call: the behaviour change is
intended (there is more to read, so it takes more than one keypress to leave), and a spec that hard-codes
the page count of a paragraph nobody has written yet is asserting about the frame width. The helper asks
`__dialogPage()` how many pages there are.

**Recommendation: APPROVE both tracks.**
