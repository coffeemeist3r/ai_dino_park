# Cycle 111 — Structure Handoff

**Intent:** Close M7's spine. The milestone's economy has a source (the granary lifts a zone's cap, 454)
but no *sink* — banked food is immortal, so a glutted pantry pins at cap forever and quietly deadlocks the
ferry (447 only flows toward a *lighter* neighbour: two full zones never trade). **BACKLOG-455 (A pantry
that spoils)** gives the hoard a cost: food sitting at/near its zone's cap bleeds one unit per in-game day
down to a safe floor, gentle and deterministic, never enough to starve a circulating zone. It's the top
unblocked Structure arc of M7 and the natural companion to the granary that just shipped — cap up (454),
now cap *bites* (455).

**Added to Structure Track:** the queue held 3 open (< X=4), so brainstormed 2 to refill —
- **BACKLOG-462 [core] Spoilage while you're away** — folds 455's decay into the 106 away catch-up (the
  live-only spine's honest completion; a hoard left through an absence should bleed too).
- **BACKLOG-463 [emergent] The provider's say** — the first *governance* beat: a provider-set per-zone
  spend priority the pantry-spend + auto-build read, advancing the charter's resources→…→governance arc
  past *building*.

Queue now 5 open (455[~], 460, 461, 462, 463).

**Chosen this cycle:** **BACKLOG-455** — food-pile decay at/near cap, on an in-game-day hook, capped and
self-limiting. Files barely overlap the lore track (459 touches `crossDino` arrival; 455 touches a new
`spoilage.ts` + a per-day hook + the foodstore) — clean two-track fire.
