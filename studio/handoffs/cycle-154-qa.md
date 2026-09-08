# Cycle 154 — QA

## Gates

| Gate | Result |
|---|---|
| `npm run build` | **clean** |
| `npx vitest run` | **2573 passed, 3 skipped, 245 files** |
| `npx playwright test` | **684 passed, 1 failed** — see the flake note |
| `@mlc-ai/web-llm` outside `game/src/ai/` | **none** (grep, zero hits) |
| save changes additive | **yes** — `streak?` optional, absent → `NO_STREAK`, no version bump needed |
| working tree | clean at commit |

**The one e2e failure is the known BACKLOG-538 flake, and it matches the filed signature exactly.**
`cycle-123-wandering.spec.ts:62` failed at `boot`, waiting on the canvas — not on an assertion. Re-run
isolated: **6/6 green in 5.3s.** That is the third consecutive cycle with a single spec down at `boot`
and a different victim each time (cycle 153 filed two runs, two different specs). 538 is queued with
"produce a reproduction" as its first deliverable and this run is a fourth data point for it, not a
regression in either track.

---

## Lore track — BACKLOG-122

| # | Criterion | Result |
|---|---|---|
| 1 | same reference when the day is unchanged | **pass** — `toBe`, identity not equality |
| 2 | increments across a calendar-day boundary, timezone-independently | **pass** — every day string built through `keeperDay` from a local `new Date(y, m, d)` |
| 3 | resets to 1 across a gap | **pass** |
| 4 | `best` never falls, survives a reset | **pass** |
| 5 | correct across a DST boundary, warn-and-skip where the zone has none | **pass** — the test *finds* the transitions in the runner's zone rather than naming a date, so it exercises rather than skips wherever CI has one |
| 6 | `plaqueLines` byte-identical without `streak` | **pass** — and asserted against the literal two-line output, not against itself |
| 7 | fresh save reads `Keeper · first day` | **pass** (e2e) |
| 8 | next real day reads `2 days running`, through production | **pass** (e2e) — `__keeperNow` moves, `__recordVisit` re-runs the production read; the spec never tells the park what its streak is |
| 9 | malformed `streak` refused, absent restores | **pass** — validation mirrors `awayLog`'s |
| 10 | **the bar** | **pass** — see below |

**The bar.** *Fresh save, ten minutes, press P: the plaque's last line reads `Keeper · first day`.* It
is a new line on a surface that has existed since cycle 058 and it is the first thing this park has
ever counted that happens in the player's life rather than in the bowl's. QA's own note on the
strength of this: **day one is a weak reading of the item and a true one.** The line the player sees
tonight says `first day`, and the streak's *interesting* states cost a real day each. The reason that
is acceptable under CHARTER v7 rather than a dodge is that the corollary is about constants tuned to
sit under a threshold, and there is no threshold here — day one is simply what a first day is. The
park is not calibrated dormant; it is telling the truth on the first frame and will tell a different
one tomorrow. Recorded so the Validator can disagree with it deliberately.

### Something QA wants on the record about criterion 8

The first draft of that spec would have set the streak with `__streak` and asserted about the value it
had just written — a spec shaped like a test that cannot fail for the right reason. The Coder added
`__recordVisit` instead so the increment happens in `recordVisit`, the same function a real reload
calls. `__streak`'s write path survives and is used once, in the reset spec, for a state that would
otherwise cost a fortnight. That is the right split and it is worth naming because the wrong one was
one line cheaper.

---

## Structure track — BACKLOG-536 (+ BACKLOG-530 riding)

| # | Criterion | Result |
|---|---|---|
| 1 | `dailyRolls()` derived from the three constants | **pass** — the test recomputes from the imports; no literal |
| 2 | `inflowCeiling()` derived from the yield constants | **pass** |
| 3 | `outflow` equals `upkeepDue(standing)` for 0..8, by calling it | **pass** |
| 4 | every founding ground solvent, ratio stated | **pass** — headroom asserted `> 10`; measured **28.2 : 1** |
| 5 | the predicate can actually fail | **pass** — `solvent(58)` is false; `affordableSkyline()` is 57, solvent at it and insolvent one past |
| 6 | new register entry holds in both frames, `darkEntries()` empty | **pass** |
| 7 | `plaqueLines` byte-identical without `upkeep` | **pass** |
| 8 | `upkeepLine(0)` is `''` | **pass**, and e2e-confirmed on the bowl |
| 9 | `__marks()` reports a resting dino as `sleep`, through production objects | **pass** — and asserted **both ways** on the keeper's ground: everybody resting wears it, nobody else does |
| 10 | the three precedence claims hold as specs | **pass** |
| 11 | `refreshMendMarks` marks the fixer and only the fixer | **pass** |
| 12 | **the bar** | **pass** |

**The bar.** *Fresh save, cross to the Grove, press P.* Before the mend the Grove keeps one landmark,
under `upkeepDue`'s floor, and the plaque says nothing — which the spec asserts, because that silence
is the pre-528 world. Somebody walks over, the cairn goes back up, and the plaque grows a line:
`Upkeep · 🛠️ 1/day`. That bill has been drawn every in-game day since cycle 152 and until tonight the
player was only ever handed the result.

### The number the item was actually for

QA is recording this in the handoff because it is the deliverable and it will be wanted by the next
cycle that touches a constant near it:

- **480** sim pumps per in-game day (24-minute day at `ACTIVE_SCALE`, 3s pump).
- **17** pumps to regrow one gather's worth of yield.
- **~28.2** units per in-game day — the ceiling.
- **1** unit per in-game day — the Grove's post-mend bill.
- **57** landmarks — the largest skyline this park's gather rate could pay for.

So `upkeep.ts`'s "converges" is true, and true with a factor of twenty-eight to spare. The finding
that is *not* in the item's text and is the more useful half: **the yield regrowth binds and the spawn
chance does not.** A future cycle that wants a ground to gather faster and reaches for
`RESOURCE_SPAWN_CHANCE` will move a number that is not the constraint. That sentence is in the
module's header, which is where it will actually be read.

### A behavior change to an existing mark, stated as the code plan required

`refreshMissedMarks`' `higher` gained a fourth term. **A dino on a mend errand no longer shows a
missed-you thought.** It is the family's own rule applied (doing beats thinking) and it is a real
change to something BACKLOG-116 shipped at cycle 150, so it is named here rather than left to be
discovered. No existing spec covered the overlap — which is precisely the gap BACKLOG-530 was filed
over, found by the item that closes it.

### QA's own reading of the two deviations it liked

**`plaqueStats()`.** This is the finding of the night on the structure side and it was not in anyone's
plan. `__plaque` was a hand-copied duplicate of `refreshPlaque`'s six fields, so the hook every plaque
spec in this suite reads would have gone on reporting the pre-154 brass while the plaque showed two
more lines — silently, with the whole suite green. It is BACKLOG-495's exact defect, living inside the
test seam. Both now read one object.

**`__marks()` reporting `offscreen`.** The first run of its own spec failed on Rex, who was resting
and wearing nothing, because he was on another ground and every mark in this family is `inView`-gated.
Returning `[]` for him made *not shown* and *not here* the same answer — the ambiguity 530 exists over,
reproduced inside 530's own hook on its first day. Now distinguished.

---

## Recommendation

**APPROVE both tracks.** One flake, filed and matching its signature. No blockers.
