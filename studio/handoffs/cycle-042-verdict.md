# Cycle 42 — Verdict

**Verdict:** APPROVED
**Item:** BACKLOG-171 [emergent] Winter huddle pull — the year reaches the den

## Rationale

Cycles 40 and 41 gave the bowl a calendar and let it tip a verdict; this cycle the season finally
changes something you can *watch*. The den-seek gate now reads a per-season rule: winter opens the
huddle window at dusk (19:00) and holds it past dawn while lowering the bond bar to 4, so the den
visibly packs and even near-strangers come in from the cold; high summer doesn't open the window
until 23:00, so a summer night at 21:30 — bedtime in every prior build — stays scattered. Fall
splits the difference (bar 6, old window). The emergent payoff is exactly what the lore asked for:
*who sleeps alone in winter* is now a sharp, free read on the bond graph, and the same bowl at the
same hour tells a different story in a different month.

The discipline matches the two cycles before it. Season is optional on both new helpers, with the
omitted path delegating to the same `dayPhase` call the old gate used — and spring's table row is
deliberately the legacy values, so a fresh clock (day 1 = spring) is byte-identical to cycle 18 by
construction; the untouched cycle-018 huddle spec passing in the full run is the proof. The
breeding gate (`isClearNight`) and the sky event stay on the plain night phase, so winter dusk
opens no new egg window and no movement-priority clash exists. Zero save change for the third
cycle running, no new deps, NPCBrain never in play.

9/9 acceptance criteria. 309 unit / 111 e2e green — the lone full-run red was the catalogued
cold-boot parallel flake (`cycle-003-save`, green isolated in seconds), and nothing in a diff this
small (+46-line pure module, ~17 net lines of scene glue) touches the boot path. Tight, correct,
and the bowl is more alive for it.

## Follow-ups (already seeded, not blocking)

- BACKLOG-179 (cold-night shiver), 180 (odd bedfellows), 181 (sleep murmurs), 182 (night ledger) — the cycle-42 lore items that extend this.
- BACKLOG-178 (migrating warmth) — the daytime mirror of this nighttime pull.
- BACKLOG-115 — the away fast-forward is still season-blind; winter absences should pack more shared nights once it reads this table.
