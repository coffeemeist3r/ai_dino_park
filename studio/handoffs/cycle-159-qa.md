# Cycle 159 — QA

**Gate runs, on the committed tree:**

| | result |
|---|---|
| `npm run build` | clean (type-check passes, PWA generated) |
| `npx vitest run` | **2729 passed**, 3 skipped, 257 files |
| `npx --yes kill-port 5173` + `npx playwright test` | **743 passed**, 0 failed |
| `grep -rn "web-llm" game/src --include=*.ts \| grep -v "^game/src/ai/"` | no hits — boundary held |
| working tree | clean at commit |

No flake this run. The parallel-load boot flake (BACKLOG-538) did not appear in the full e2e pass; noted,
not claimed as fixed — a single clean run is not evidence against a four-cycle intermittent.

The suite grew by **29 unit** (two new files) and **15 e2e** (two new files) and lost none.

---

## Lore track — BACKLOG-070

| # | Criterion | Result |
|---|---|---|
| 1 | `refusesFood(agreeableness, isFavorite, hunger)` pure + exported in `world/feeding.ts`, true only when all three hold | **PASS** — `cycle-159-refusal.test.ts` |
| 2 | A favorite is never refused — founding roster × 7 foods × 4 seasons × 4 hunger levels | **PASS** |
| 3 | `hunger >= PICKY_HUNGER` never refuses, at any agreeableness | **PASS** — swept a=0..1 step 0.05 |
| 4 | `gobblesFood(h,a)` ⇒ `!refusesFood(a,false,h)` for all h, a | **PASS** — swept both axes |
| 5 | e2e: prickly + unhungry dino reaches the food and does not eat it; `__food()` still returns the piece | **PASS** |
| 6 | e2e: a second, warm dino then eats that same piece and its friendship rose | **PASS** |
| 7 | e2e: no refusal loop — exactly one ticker line for that dino for that piece across ten world steps | **PASS** |
| 8 | e2e: the refuser's memory names the food it turned down | **PASS** |
| 9 | `__refused()` returns `{name, foodId}` or null | **PASS** |
| 10 | A `reachability.ts` register entry for 070, keyed on the founding roster | **PASS** — `cycle-145-reachability.test.ts` walks it green |

Two criteria beyond the list, both worth keeping: a hungry prickly dino eats what it is given (the
hunger override, e2e), and a new drop is a fresh decision — the same refuser is asked again and refuses
again, which is what proves the transient set is cleared rather than leaking across pieces.

**Out-of-scope items confirmed absent:** no palate drift, no book entry, no witness reaction, no spoken
refusal line, gifts untouched.

### One scope note, disclosed

The Coder moved the refusal branch from where the design put it (ahead of `yieldFoodTo`) to after the
yield and the mercy. QA agrees with the move and records *why it matters to the criteria*: the design's
ordering was not a style preference, it was a latent defect — `WELL_FED` is 0.3 and `PICKY_HUNGER` is
0.5, so **every generous-yield candidate is inside the refusal window**, and the branch as specified
would have silently disabled BACKLOG-375/385/386 for any prickly dino. Three existing specs caught it.
No acceptance criterion above asserts the ordering, so none was weakened by the move; criterion 5 and 6
are the ones that would have caught a wrong order in the other direction, and both pass.

### One existing spec was edited

`tests/e2e/cycle-083-generous.spec.ts`, the "no qualifying friend → the winner eats (passthrough)" case.
It staged `names[0]` — Rex, agreeableness 0.019 — as a well-fed winner and asserted it eats. That is the
exact case BACKLOG-070 now changes, so the winner is forced warm and the comment names the branch.
QA checked the edit for the failure mode that matters: **no assertion was removed or loosened.** The
three expectations (`need < 0.1`, `yieldBeat` null, food gone) are unchanged; one line of staging was
added. The sibling test in the same file, which is about the yield itself, needed no edit at all once
the ordering was right.

---

## Structure track — BACKLOG-546

| # | Criterion | Result |
|---|---|---|
| 1 | `satchel.ts` exports the six pure functions over `FoodPile` from `foodstore.ts` | **PASS** — 17 unit tests |
| 2 | `spendFromSatchel` never mutates, never goes negative | **PASS** |
| 3 | `rollFromSatchel` never returns a zero-stock id over 200 seeded rolls | **PASS** |
| 4 | `refillSatchel` tops staples, leaves farmed crops alone | **PASS** — and does not claw back a stock above founding |
| 5 | `H` with meat loaded decrements meat by one | **PASS** — e2e |
| 6 | e2e: fresh save `__satchel()` deep-equals `FOUNDING_SATCHEL` | **PASS** |
| 7 | e2e: meat at 0 + meat loaded → no food, ticker names meat as out | **PASS** — and nothing else was spent for it |
| 8 | e2e: the plaque carries a `Satchel · ` line on a fresh save | **PASS** |
| 9 | e2e: the feed HUD line carries the count | **PASS** — `feedLine(label, count)` unit-covered; the two-arg form is exercised through the scene |
| 10 | e2e: `FEED_AUTO` with only greens in stock rolls greens every time | **PASS** — six consecutive drops |
| 11 | `__dropFood(col, foodId)` and the harvest do not spend the satchel | **PASS** — explicit drop leaves the pile deep-equal |
| 12 | A pre-cycle save (no `satchel`) restores the founding stock; a post-cycle save round-trips | **PASS** — round-trip e2e; the absent-field path is the `if (save.satchel)` guard and is covered by every other spec in the suite, all of which boot on saves without the field |
| 13 | A `reachability.ts` register entry for 546 keyed on the founding stock being uneven and thin somewhere | **PASS** |

**Out-of-scope items confirmed absent:** no hunger pressure or starvation, no buying or trading, no
draw from the zone food pile, no touch selector.

### Two notes the Validator should weigh

**1. The day-boundary refill is not reachable in a sitting, and the design said so up front.** QA
confirms the implementation matches the disclosure: `checkSatchel` is an `onHour` listener with a
`lastSatchelDay` guard, armed in both boot and `syncSeason`, and at the shipping 1× clock its first
fire is 24 real hours away. It is the same shape and the same unreachability as upkeep (480), spoilage
(455) and the council term (484), all of which are on BACKLOG-493's ledger. **The reachable half — the
founding stock, the per-drop spend, the HUD countdown, the plaque line and the empty-handed drop — is
fully reachable and QA verified each of those five by hand as well as by spec.**

**2. The `__dropFood()` no-argument path now spends the satchel, and 25 spec files use it.** This is by
design (the hook drives the production keeper path rather than a parallel one, the cycle-128 discipline)
and QA flags it as a live constraint on future specs rather than a defect: the full suite is green
today because no spec drops more than a handful of times, but a future spec that drops a dozen times
through the auto slot will now run the satchel dry and get nulls. The out is already in the tree —
`__setSatchel` — and it is named here so the next author finds it.

---

## Verdict input

Both tracks meet every acceptance criterion. **20 of 20 pass**, with one disclosed design change (the
branch ordering, caught by the suite and corrected), one disclosed spec edit (staging named, no
assertion weakened), and one disclosed unreachable-by-design sub-system (the day refill) that the design
declared in advance rather than claiming as shipped.
