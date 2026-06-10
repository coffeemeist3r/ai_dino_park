# Cycle 41 — Verdict

**Verdict:** APPROVED
**Item:** BACKLOG-170 [emergent] Seasonal palates — the same dino begs differently in winter and summer

## Rationale
Cycle 40 hung a calendar on the bowl; cycle 41 makes the year *do* something. A small per-season
craving bonus (spring greens / summer berries / fall fish / winter meat, +0.4) rides on top of the
cycle-061 favorite-food math, so the season can flip a dino's favorite — but only where it's
genuinely on the fence. The 0.4 was sized against the actual name-seeds, and the result is the best
kind of emergence: the cast splits on its own into who follows the year and who doesn't. Rex,
Mossback, and Sunny each sway — and each to a different food — while Twitch (the herbivore, a 1.57
fit gap) and Glade (the carnivore) never budge. The same choice the player already makes daily —
what to drop through the hatch — now reads the calendar back to them, with **zero new save state**.

The design's discipline is what makes it safe. `season` is optional on `favoriteFood`,
`foodReaction`, and `scanLines`; omitting it is byte-identical to cycle-061, which is why every
prior food/scan test stayed green untouched. The bonus *only ever promotes the craved food* (a
property the unit suite pins), so it can never silently reorder the rest of the table. And the
in-world surfaces — the feeding rush, the eat reaction, the `__favoriteFood` hook, and LUMEN-3's
Field Scan — all read the **same** live clock season, which is precisely why the cycle-027 favorites
e2e still passes: the food dropped and the food eaten are judged in the same season by construction.

All 8 acceptance criteria pass. 298 unit / 105 e2e green; the lone red in the full e2e run was the
documented cold-boot parallel-load flake (`cycle-002-daynight`, green isolated in 939ms), not a
regression — nothing in the 6-file diff touches the day/night path.

Boundaries clean: pure logic stayed in `world/foods.ts`, WorldScene only passes the season in, no
save-format change, no new keys, no new deps, NPCBrain never in play, the day/night and season-tint
rendering untouched. Tight scope — 6 files, +225/−17.

## Follow-ups (already seeded, not blocking)
- BACKLOG-176 — seasonal *gift* cravings (the mirror of this for the gift loop).
- BACKLOG-174/175/177/178 — year wheel on the plaque, turning-year gossip, equinox restlessness, migrating warmth.
- BACKLOG-173 — season in the dialogue voice; 026/028 — festivals + weather now have their calendar.
