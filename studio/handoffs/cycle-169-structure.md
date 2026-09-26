# Cycle 169 — Structure Handoff

**Pick: BACKLOG-206 — Sound has a place.**

**Not a solo cycle.** (CHARTER v8 would allow one at cycle 161+; this item is nowhere near
needing it — it is the cheapest thing in the queue now that the bus exists.)

## Why this and not the top of the Structure Track

The Structure Track holds four pointers — 552, 557, 562, 563 — which is **at** the cap of
X=4, so this fire **drains without brainstorming**, for the first time in four cycles.
None of the four is picked, and the reason is the one the cycle-168 housekeeping note
wrote down in advance:

> *206 is not in that list and should probably jump it. It is Milestone 22's remaining
> structure arc, it was blocked on the bus until tonight, and it is now the cheapest item
> in the park.*

That is still true and it is now also the **only** open structure arc in an ACTIVE
milestone, which CHARTER v6 says a cycle serves first. All four queued pointers keep their
order behind it; 562 is the natural next pick, because Milestone 22's last lore arc (200 +
198) is entirely about *when* a call happens and cannot be built without it.

## The item

Every call in this park plays at exactly one loudness for its kind, decided by `gainFor`
in `mix.ts` — the seam last cycle built and then deliberately did not use for distance,
naming 206 as the arc that would. So the bowl has no acoustic space at all: a dino crying
out from the far corner of the ground and a dino chirping at your elbow arrive at the same
level, and where the keeper chooses to stand has never once changed what the keeper hears.

The shape is the one 559's own header specified: `gainFor` widens from `(kind)` to
`(kind, opts)`, a new pure `audio/space.ts` owns the falloff curve and knows nothing about
Phaser or WebAudio, and the scene passes the distance from the keeper's avatar to whatever
is making the sound. Everything that does not know a distance keeps the level it has, so no
voice anybody knows moves unless they walk away from it.

**Floor, not silence.** The falloff bottoms out well above zero. A cry that fades to
nothing is a beat the player cannot know they missed, and this cycle's lore track
(BACKLOG-204) exists precisely to make far-away trouble *findable* — the two must not fight
each other. Faint and still there is the whole design.

## Reachability (CHARTER v7)

Fresh save, ten minutes, no prerequisites: walk to the far side of the ground and press the
greet key at a dino near you, then walk away and greet another across the tank. The second
answer is audibly quieter than the first. Nothing has to be unlocked, no threshold has to be
crossed, and it is true on the founding park on frame one — the map is 20×15 tiles and the
cast ships spread across it, so the distances that matter already exist.

## Structure Track after this fire

Unchanged at four: 552, 557, **562**, 563 — with 562 flagged as next.
