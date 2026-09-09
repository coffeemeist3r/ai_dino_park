# Cycle 155 — QA

**Verdict input: 18/18 acceptance criteria pass. Build clean, 2602 unit green across 248 files,
696/696 e2e — a full-green run with no flake and no isolated re-run.**

---

## Gates

| gate | result |
|---|---|
| `npm run build` (tsc -b && vite build) | clean |
| `npx vitest run` | **2602 passed**, 3 skipped, 248 files |
| `npx --yes kill-port 5173` then `npx playwright test` | **696 passed / 696** |
| `@mlc-ai/web-llm` imported outside `game/src/ai/` | no hits |
| save shape additive | **unchanged** — this cycle alters *when* `savedAt` is written, not the schema |
| tree clean, `main` green | yes |

The full-green e2e run is worth stating precisely, because BACKLOG-538 dropped one spec at `boot`
on each of the last three cycles' morning fires. Tonight's run dropped none. That is a fourth data
point for 538 and it points the same way the cycle-154 Artist's full-green run did: intermittent,
and this is what intermittent looks like from the other side.

---

## Structure track — BACKLOG-541 (8/8)

- [x] `departureStage` returns `here` / `leaving` / `gone` for the four focus×hidden combinations, with `hidden` winning both of its cases — `departure.test.ts`, three cases.
- [x] `shouldStamp` is true out of `here` and false for `leaving→gone`, `leaving→here`, `gone→here`, `here→here` — `departure.test.ts`, three cases.
- [x] A `blur` moves `__departure().stage` to `leaving` and increments `stamps` by exactly 1 — e2e.
- [x] A following visibility change leaves `stamps` unchanged. One alt-tab, two events, one departure.
- [x] `focus` returns the stage to `here`; a second `blur` reaches `stamps` 2.
- [x] After a blur, the persisted `savedAt` is strictly greater than the value it held before — asserted against a save read before the blur, so it is a claim about the *moment*, not about a save existing.
- [x] `departure.ts` imports nothing at all — no Phaser, no `../ai/`, no clock.
- [x] BACKLOG-493's hidden-tab clock retune still runs; the departure listener was added beside the visibility handler, not in place of it.

## Lore track — BACKLOG-119 (10/10)

- [x] `partingGlance` returns null below `SESSION_MIN_MS`, on an empty `present`, and on a park with no friendship (both `{}` and an explicit `0`).
- [x] Picks the highest-friendship name among `present` only; a closer dino outside `present` is not picked.
- [x] The tie-break is asserted **against `topBy` itself**, not against a copied expectation — so a re-implementation would fail the spec rather than merely duplicate code.
- [x] The line carries the name and the glyph and is under 60 characters; the three heart tiers produce three distinct lines.
- [x] The glyph is none of the four already in the mark family — asserted by codepoint.
- [x] E2E: one `blur` after the session floor puts **exactly the best-liked dino** in `__marks().glance`.
- [x] E2E: it clears within `GLANCE_MS` + a beat, and the spec first asserts it was *up* so the clearing claim is not vacuous.
- [x] E2E: a `blur` before the session floor produces nothing — **the silence, asserted**.
- [x] E2E: a visibility change with no prior blur throws nothing and shows nothing. The item's original trigger, drawing to nobody, correctly draws nothing.
- [x] E2E: a sleeping dino never glances — and the spec makes *every sleeper* the best-liked dino first, so the exclusion is tested adversarially rather than by luck.
- [x] `worldPlacedProps()` includes `GLANCE_ART_KEY`; the reachability register is green.

---

## Three things QA puts on the record rather than in a checkbox

**1. The e2e suite caught a real defect on its first run, and the defect was in the code plan.**
The plan reasoned that `document.hasFocus()` inside the handler beats a tracked flag. It does not:
`hasFocus()` still reports true inside a `blur` handler, so the stage computed `here`, `shouldStamp`
declined, and **the keeper could never leave**. Both tracks were entirely non-functional and the build
was clean and 2602 unit tests were green. Only the e2e caught it. That is the strongest argument this
studio has produced in some time for the e2e layer existing at all, and it is worth writing down in a
cycle whose structure queue currently holds an item about e2e trustworthiness (BACKLOG-538).

**2. The two `controls-help` specs that went red were not collateral to be waved off — they were
evidence.** They touch none of this cycle's files, and they went green with the same one-line fix,
untouched. Had the Coder repaired only its own three specs by relaxing them, those two would have
stayed red and the cycle would have gone looking for a second, imaginary bug. QA notes this because the
tempting move — "my three specs are mine, those two must be flake" — was available and wrong, and the
three-consecutive-cycles-of-538 context made it *especially* tempting.

**3. 119's bar answer is strong; 541's is honest but slower to observe.** The glance is a frame-one
read after twenty seconds and one greeting — genuinely inside the ten-minute window. 541's is a
*changed number* rather than a new pixel: the digest line a player sees on their next return differs,
and observing it requires actually leaving and returning. QA judges this passes because it is not a
threshold tuned to sit dormant — the corollary v7 names — but a correction to a reading that was
already firing and firing wrong. Recorded so the Validator agrees or disagrees deliberately.

## Not a defect, recorded anyway

`partingGlance` says nothing in a park whose cast the player has never spoken to. On a genuinely fresh
save with zero friendship, the first departure is silent. That is the module's documented answer and
there is an e2e spec asserting it — but it does mean the *very first* goodbye costs one greeting. One
greeting is ten seconds of play and the session floor is twenty, so a player who has done nothing at
all in their first twenty seconds also has nothing to say goodbye to. The alternative — waving at a
stranger — was the worse beat.
