# Cycle 143 — Structure Handoff

**Picked:** **BACKLOG-505 — the frontier 500 closed.** Milestone 16's structure arc with a player in it.

**Structural intent.** CHARTER v7's third change says every ground the player can walk to has life on it at
boot, and BACKLOG-500 obeyed it — which took BACKLOG-474's entire frontier out of reach on a fresh save.
`__unsettled()` returns `[]` where it used to return `['hollow', 'ridge']`; the unsettled lens glyph is
never lit; the frontier migration tier has no target to aim a wanderer at. Three shipped, tested,
load-bearing things went dark the day the constitution was obeyed, and that is the shape of defect v7's own
corollary was written against, arrived at from the other side.

505 names two honest candidates. The item takes the **first**: a **sixth ground**, unsettled because nobody
has settled it *yet* — which is what 474 always meant by the word. The second candidate (re-point the tier
at a ground that has *lost* its last resident) is declined here for a reason worth writing down: on a fresh
save no ground has lost anybody, so a park that only recognises a frontier after a departure has a frontier
that is once again unreachable at boot. It satisfies the item's letter and fails the bar the item was filed
under. And the residency invariant is not touched — that is the constitution, and 505 says so explicitly.

**Why a sixth ground is a row and not a rewrite.** 449 tabled terrain into `ZONE_TERRAIN` and promised "a
fourth zone is a row"; 472 cashed that cheque and 478 cashed it again on a *branch*. Everything a ground
needs is a `ZONES` row, a `ZONE_LINKS` pair, a `tileAt` rule, a tint, a plot tile, and — deliberately —
**no** `ZONE_BIAS` entry and **no** structure kind, the two documented back-compat seams the Hollow and the
Ridge both fell through on purpose. The frontier machinery is already built and already tested; this ground
is the input it has never had.

**The ground.** The Hollow is the cold, damp end of the line, so the line ends past it in the dry: **The
Saltpan**, east out of the Hollow, four hops from spawn and the far end of the chain — a frontier ought to
be the place you have to go to. Laid out unlike the other five (the bowl's NW waterhole, the grove's NE
pond and mid trail, the Fernreach's west creek, the Hollow's centre-south pool, the Ridge's vertical
switchback): the Saltpan **inverts** them — bare crust nearly everywhere, one brine seep, and grass only as
a thin fringe where the fen drains in. It ships a new `salt` tile kind, which bakes as grass under the tint
until a rig exists — the same seam that has kept the floor whole through four terrain additions, and the
host for the Lore-smith's BACKLOG-511.

**Reachability (the v7 bar, answered before the build).** In a fresh save the zone-map lens shows a sixth
ground and it is the first one in the park's history to carry the unsettled glyph at boot; the frontier
migration tier has a target from the first tick, so a wanderer sets out for a ground nobody has ever stood
on and the ticker says so; and when it arrives, `settleMemory` / `settleLine` — written cycle 474, never
once fired on a shipping save — fire for the first time. The player can also simply walk east until the
grass runs out. That is four things visible in ten minutes, none of which were visible last night.

**Added to Structure Track:** none — drained from queue (open count = 4, at the cap of X=4, so no
brainstorming for the fourth cycle running). Remaining after this: 495, 501, 509.

**File-collision check against the lore track:** BACKLOG-510 works in `world/feeding.ts`, a new
`world/hatch.ts` and the `dropFood`/boot region of `WorldScene`; 505 works in `world/zones.ts`,
`world/plot.ts`, `world/founding.ts` and the terrain/lens region of `WorldScene`. They share the scene, as
both tracks always do, but no function.
