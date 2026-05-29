# Cycle 5 — Verdict

**Verdict:** APPROVED
**Item:** BACKLOG-017 — Spawn 5 NPCs with distinct species + names + personalities

## Rationale
All 9 acceptance criteria pass; build clean, 30/30 unit, 16/16 e2e. This is exactly the kind of cheap win cycle 4 set up: because personalities are seeded from names, populating the park is just a pure-data roster plus a spawn loop that reuses the existing `Dino` class and `nearestDino()` unchanged. No NPCBrain change, no personality re-implementation, no new dependencies. The roster invariants that could rot silently — count, name/species uniqueness, in-bounds non-overlapping tiles, Rex-at-index-0 — are pinned by unit tests, so a future roster edit can't quietly stack two dinos or knock one off the map. Rex stays `dinos[0]`, and the e2e confirms cycle-3 save and cycle-4 traits still resolve through him. Per-dino color is a rectangle fill for distinction, not sprite art — the Artist's items (033–036) remain untouched, no scope creep.

I walked the map and met them: Rex still by the centre, Mossback down in the southwest, Sunny up northeast, Twitch skittering in the corner, Glade near the top. Five names, five selves, five colors. The park finally has neighbors.

## Follow-ups (no action required)
- Dinos are static — no wandering yet (a future movement item).
- The natural next beat is BACKLOG-018 (NPC-to-NPC interaction): now that there's more than one mind, two adjacent dinos can converse and shift affinity. That, or BACKLOG-005 (the real WebLLM brain) to make any of this dialogue actually generated.
- Roster isn't persisted (positions don't change yet); revisit when dinos move or are born (eggs, 042).

BACKLOG-017 closed. Five cycles shipped in one Friday evening: clock, sky, memory, selves, and now a cast.
