# Cycle 102 — Design (two tracks)

Both tracks are Milestone 4's final arcs. Shipping both closes "The hunt has weight."

---

## Lore track — BACKLOG-443: Predator/prey in the book

### Item
BACKLOG-443 [pokemon] — the collection book reads each dino's food-web standing.

### Why this cycle
The hunt has run for cycles now — a carnivore stalks (367), catches feed it (437), prey flee and grow
personally wary (440/442) — but none of it is *legible*. A player opening the book sees hearts, bonds,
role, quirk, plans, home… and nothing about who's an eater and who's the eaten. 443 surfaces the food web
as standing, the pokemon-flavor read that turns a cycle of chases into a line you can point at. It's the
last lore arc of Milestone 4.

### What ships
The collection book (V lens → 📖) gains one **food-web line per dino** that has a food-web history:
- A **carnivore** shows its catch tally: `🦖 brought down N meal(s)`.
- A **herbivore** shows its escape tally: `💨 slipped N hunt(s)`.
- A dino with **no** food-web history (a herbivore never hunted, a carnivore that never landed a catch)
  shows **no** line — the book stays clean, matching how `knows N rumors` hides at 0.

The tallies are read out of the memory the hunt already files: a carnivore files `you brought down a meal`
on a successful stalk (437); a prey files `you slipped <hunter>'s hunt` on every chase (367). The line
counts those in the dino's live recall window (capped at 6 slots, shared with all memory — so the number
reads *recent* food-web activity, exactly as 442's wariness reads recent chases).

### Acceptance criteria
- [ ] A carnivore (e.g. Twitch) with one or more `you brought down a meal` memories shows `🦖 brought down N meal(s)` in its book block, N matching the count.
- [ ] A herbivore with one or more `you slipped <hunter>'s hunt` memories shows `💨 slipped N hunt(s)` in its book block, N matching the count (across all hunters).
- [ ] Singular/plural is correct: `1 meal` / `2 meals`, `1 hunt` / `2 hunts`.
- [ ] A dino with no food-web memory shows **no** food-web line in its book block.
- [ ] A carnivore's line reads catches (never escapes) and a herbivore's reads escapes (never catches) — keyed on `dietOf(species, name)`.
- [ ] Build clean, unit + e2e green; no regression to the other book lines (role/hearts/bond/quirk/today/plans/home/parents/rumors all still render).

### Out of scope
- No new memory-filing (the hunt already files both memory strings — this is a pure *read*).
- No persistence change (tallies derive from existing recall; no new save field).
- No lifetime/all-time counter surviving the 6-slot recall cap — recent standing only (a bigger persisted food-web ledger, if ever wanted, is a separate item).

### Constraints
- Pure read: `world/foodweb.ts` (tally + standing helpers) + `ui/lenses.ts` (BookRow field + render) + the `bookRows()` builder in `WorldScene.ts`. No behavior change.
- `foodweb.ts` may import `Diet` from `world/diet.ts` (both pure, same dir). No Phaser, no WebLLM in either.
- **No file overlap with the structure track** — 443 touches the book; 436 touches the wander ladder + needs.

---

## Structure track — BACKLOG-436: Need pulls the body

### Item
BACKLOG-436 [core] — a pressing need biases a dino's wander toward relief.

### Why this cycle
371 gave every dino hunger and thirst that build over realtime and resolve at the hatch / grove pond, and
surfaced them as a 🍖/💧 tell — but deliberately stopped there: the mark shows, the dino does nothing about
it. 436 is the deferred behavior half (the operator's hunger/thirst nudge, deathless split): the need
finally *moves the body*. It's Milestone 4's last structure arc — a ground where the eating has stakes needs
the hungry to actually seek food, not just wear a badge.

### What ships
A dino whose hunger or thirst is **pressing** (over `NEED_THRESHOLD`, the same bar that shows the mark)
leans its ordinary wander toward relief:
- **Hunger** → steps toward the **hatch feeding zone** (centre column, the feeding row where dropped food lands), so the hungry cluster where the keeper's food arrives.
- **Thirst** → steps toward the **grove pond** — but only when the dino is *in the grove* (the only place thirst is slaked, per 371). A thirsty dino in the bowl or Fernreach has no reachable water and just wanders (the local-water waterhole is the separate 445).
- The pull is a **lean, not a compulsion**: it's gated (`needSeeks`, ~0.6) so not every step seeks, and it sits **below every existing behavior** in the wander ladder — huddling, gathering, moping, the solitary tic, and socializing all still win. Keeper drops still win (a landed-food rush is handled earlier in the step). Deathless: needs only build and resolve; nothing here removes a dino.

Observable: drop a dino far from the feeding row, let its hunger cross the threshold, and over the next
steps it drifts *toward* the hatch under its 🍖 mark instead of milling randomly — the mark now has a
direction.

### Acceptance criteria
- [ ] A dino with pressing hunger has a need-seek target at the hatch feeding zone (`{ centre col, feeding row }`), regardless of zone.
- [ ] A dino with pressing thirst **in the grove** has a need-seek target at the grove pond water block.
- [ ] A dino with pressing thirst **not** in the grove has **no** seek target (null) — it wanders (thirst is grove-only until 445).
- [ ] A dino with no pressing need has no seek target.
- [ ] When seeking, the dino's step reduces its distance to the target (a `stepToward`, clamped in-bounds).
- [ ] The seek never overrides huddling / gathering / moping / ticcing / socializing (verify a huddling or gathering dino with pressing hunger still does that, not the seek).
- [ ] The seek is gated (`needSeeks`) so it's a lean, not a hard lock every step — `NEED_PULL_CHANCE` in (0,1).
- [ ] Deathless + additive: no dino removed, no new required save field, old saves load.
- [ ] Build clean, unit + e2e green.

### Out of scope
- No thirst relief outside the grove (no bowl/Fernreach waterhole — that's 445).
- No banked-food consumption / carrier feeding a starving dino (that's 444) — hunger still only resolves at a keeper/plot drop.
- No death, no need-spiral, no starvation penalty (deathless per CHARTER; mortality stays an operator call).
- No change to the build rates or the 🍖/💧 mark itself (371 owns those).

### Constraints
- Pure logic in `world/needs.ts` (`needSeeks` gate + `NEED_PULL_CHANCE`; the target selection can stay in WorldScene since it reads COLS/ROWS/zone). Pond-block centre helper in `world/zones.ts` beside `groveTileAt`.
- Wander integration in `WorldScene.ts` `forceStep`: a new `seeking` branch inserted **just above the plain-wander `else`**, below `socializing`. Reuse `stepToward` (movement.ts), `pressingNeed` (needs.ts), `zoneOf`/`GROVE_ID` (zones.ts).
- A pressing need already makes a dino "disturbed" (`undisturbed(pressingNeed…)` is false), so the solitary tic already yields to it — no conflict to add.
- **No file overlap with the lore track.**
