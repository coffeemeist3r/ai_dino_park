# Cycle 120 — Structure Handoff

**Intent:** 472 laid the fourth ground and proved nine cross-zone systems meet it untouched — but it landed
as a place with terrain, a crop, a pool, a name, and nobody in it, reachable only in the sense that the
migration code *could* route there and never will: the Hollow's appeal is the lowest in the park by
construction (0 residents × 2, 0 structures × 3, 0 harvest, 0 pile), and `richestNeighbor` picks the
*highest*. The chain can grow, and the growth is inert. Tonight makes an empty ground a place the herd
actually reaches, and makes the arrival legible: a ground the player watches get its first resident.

**Milestone duty:** Milestone 10 ACTIVE — structure arc 1 (472) shipped cycle 119. Tonight is structure
arc 2 of 2, the arc that closes the milestone's spine.

**Added to Structure Track:** none — drained from queue (**4 open** ≥ X=4: 466 · 473 · 474 · 475).

**Chosen this cycle: BACKLOG-474 — The unsettled ground.** On-milestone, and the only queued item that
turns 472 from a config row into something observable. 466 (the dry season) and 473 (the ground's second
decision) are both off-milestone; 475 (distance on the chain) is on-chain but wants the fourth ground to be
*inhabited* before hop-distance changes any read worth watching.

**Scope note for the Designer — where the real work is, and where it isn't.** Most of 474's stated surface
turns out to already be sane, and the codeplan should confirm rather than rebuild it:

- **Pop-0 reads are already correct by construction.** `zoneProsperity` sums four non-negative signals → 0;
  `zonePopulations` seeds every `ZONES` id at 0; `zoneMapModel` defaults every absent per-zone read; the
  pantry is an empty `FoodPile`; `providerFor` returns null and `spendPriorityFor` stays null (the two
  governance hooks are already documented inert at null). Nothing crashes at zero. It just reads as a
  *poor* ground rather than an *empty* one, which is the actual bug.
- **The decline floor is already right.** `isDeclining` is false at heads 0 (peak 0), so an unsettled ground
  never wears the ⬇, and once it has its founder, `ZONE_FLOOR = 1` keeps that founder from wandering back
  out — the founding sticks without a line of new code. `checkLastOne` (464) also stays quiet there, because
  a ground at peak 1 / heads 1 is not declining. Verify all three; don't re-engineer them.

So the deliverable is three things:

1. **A frontier pull.** Migration must be able to *aim* at an empty ground. Appeal is monotonic in plenty
   and an unsettled ground is the least appealing place in the park, so this cannot be a weight tweak — it
   needs its own tier in the destination pick, ahead of `richestNeighbor`, gated on the ground being
   genuinely unsettled (no residents *and* never founded, so a ground that hollows out later is not
   perpetually re-colonised as "frontier").
2. **A founding you can watch.** The first arrival is already recorded — 343's `foundZone` fires at both
   arrival seams and returns whether this footfall founded the ground. Ride that return value; do not add a
   second arrival seam. What's new is the beat: a settling event, a memory the founder keeps, and the fact
   that this dino now lives somewhere nobody has ever lived.
3. **An unsettled read on the lens.** An empty ground currently shows `○ quiet · 0` — indistinguishable
   from a poor inhabited one. It should say it's unsettled, and stop saying it once someone lives there.

**Collision check with the lore track (364, the one who knew first):** clean. 364 lives at the dino↔dino
meeting seam and reads the visited-grounds record; 474 lives in the migration destination pick, the arrival
seam's existing `foundZone` return, and the lens model. Both land in `WorldScene.ts` at different methods.
The happy accident this cycle is the same shape as last cycle's: once a ground can be settled, the founder
walking back out with word of a place literally nobody else has seen is 364 firing on 474's output with no
code shared between them.
