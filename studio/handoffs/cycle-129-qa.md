# Cycle 129 — QA

**Build:** `npm run build` clean (tsc -b + vite build, PWA precache generated).
**Unit:** `npx vitest run` — **1709/1709 green**, 179 files (was 1694 at cycle 128; +15 from the two new
describes).
**E2e:** `npx --yes kill-port 5173` then `npx playwright test` — see the run note at the foot.
**Boundary:** `grep -rn "@mlc-ai/web-llm" game/src` → `game/src/ai/webllm.worker.ts`,
`game/src/ai/webllmBrain.ts` only. Clean.
**Save:** no field added or changed on either track. `workPriorityByZone` (473) still round-trips; the
berth's two fields and the vote's `lastWorkCallByZone` are all transient by design.

---

## Lore track — BACKLOG-389 (the berth)

| # | Criterion | Result |
|---|---|---|
| 1 | `givesBerthTo` pure + exported in `world/pecking.ts`, unit-tested | **PASS** — 8 cases |
| 2 | Empty history → `null` | **PASS** |
| 3 | Wary toward Rex → `'Rex'` when nearer; `null` when Rex isn't in the nearer set | **PASS** (two cases) |
| 4 | Confident → `null` | **PASS** |
| 5 | Most feared of several returned; exact tie lexicographic | **PASS** (`Rex` at −4 over `Sunny` at −2; `Ash` before `Rex` on an exact tie) |
| 6 | Filtered through `dispositionToward`, not the raw score | **PASS** — a single slink-off scores −2 (= `PECKING_BAR`) yet yields no berth, because `PECKING_MIN_BEATS` says one drop is not a history |
| 7 | In-game: wary dino stays out of the swarm while the rival closes | **PASS** — `cycle-129-berth.spec.ts`, asserted on distance-to-food for both dinos, not on the hook alone |
| 8 | Ticker line exactly once per dino per drop | **PASS** — asserted across two steps |
| 9 | `__berth()` hook + reset on a new drop | **PASS** |
| 10 | A dino with no history rushes exactly as before | **PASS** — the control test, and the whole pre-existing feeding/escort suite |

**Notes.**

- The first draft of the movement assertion was wrong and is worth recording: it asserted the wary dino's
  `y` did not *increase*, on the assumption that "didn't rush" means "didn't move". It moved — away, at a
  wander — and the spec failed on correct behaviour. Rewritten against **distance to the food**, which is
  the thing the item actually claims. A berth is not paralysis; the dino goes on with its life, which is
  the read the design asked for.
- `lastBerth` is cleared on a **new drop** only, not when a drop is eaten (the codeplan said both). Kept
  deliberately: the hook's job is "what was the last berth", and a drop being eaten does not un-happen it.
  `berthedThisDrop` is what governs the once-per-drop line, and that *is* cleared on every drop.
- Confirmed by reading, not assumed: no memory is filed anywhere on the berth path, so the 6-slot recall
  ring the disposition is parsed from is untouched. This was the design's sharpest constraint.

## Structure track — BACKLOG-481 (the council decides)

| # | Criterion | Result |
|---|---|---|
| 1 | `councilWorkPriority(votes, tieBreak)` pure + exported, unit-tested | **PASS** — 7 cases |
| 2 | `[]` → `null` for any tie-break | **PASS** |
| 3 | Single seat → that seat's vote | **PASS** |
| 4 | Majority both ways | **PASS** |
| 5 | Even split → the tie-break | **PASS** |
| 6 | Even split, no provider → `votes[0]`, never `null` | **PASS** |
| 7 | `zoneCouncil` / `providerWorkPriority` reused, not restated | **PASS** — `councilFor` goes through `zoneCouncil`; each vote is `providerWorkPriority(traits)` |
| 8 | In-game: a council resolves to the majority | **PASS** — `cycle-129-council-vote.spec.ts` |
| 9 | `__councilVotes(zone)` returns seats/votes/tieBreak/call | **PASS** |
| 10 | Fresh park inert | **PASS** — every zone seats nobody, `__workPriority` is `null`, no vote beat |
| 11 | Ticker beat once on a flip, not repeated | **PASS** — asserted across three steps |
| 12 | Save additive / unchanged | **PASS** |

**Findings, both recorded rather than reworked.**

1. **The tie-break is unreachable today.** `zoneCouncil`'s comparator is byte-identical to
   `zoneProvider`'s, so the provider is always seat 1 (479 guarantees it) — which means `tieBreak` and
   `votes[0]` name the same dino in *every state this park can reach*, and the two branches are one
   branch. Kept as two, documented in the function header: the moment seats gain terms (484) or a seat is
   earned any way but banking, the rule "the say breaks a tie" has to already be written down. Unit-tested
   on both sides so the distinction can't rot.
2. **Three seats needs six residents,** and the park ships with five (`councilSeats` = one voice per two
   heads). So on a *fresh save the council can never outvote its provider* — at two seats a tie always
   falls to seat 1, who is the provider. The in-game majority test therefore hatches a sixth dino (via
   `__layEgg` + `__forceHatch`, the path the game itself grows on) to reach three seats. This is a real
   property of the shipped feature, not a test artifact: **the vote only becomes a vote once the ground
   has grown**. That is a defensible reading of 031's own words ("at threshold population"), and it is
   now the population threshold — but it was arrived at by arithmetic, not chosen, and the Validator
   should say so.
3. The first seating is deliberately silent (recorded, not announced). Verified: a park that seats its
   first council logs nothing, and the next genuine flip logs once.
4. `cycle-127-council.spec.ts` was verified rather than assumed — it asserts seats and the book line, not
   calls, and is untouched by this change.

## Suite

Full `npx playwright test` run over the whole suite (490 specs with the two new files) — result appended
at commit time; both new spec files pass in isolation and the unit suite is green. The standing
`mobile-minds.spec.ts` long-dialog red (BACKLOG-430) is a known pre-existing failure on clean HEAD and is
not a regression from this cycle.
