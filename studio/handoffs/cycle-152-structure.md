# Cycle 152 — Structure Handoff

**Intent:** The register learns to look at the second frame. BACKLOG-501 turned CHARTER v7's bar into a
list that breaks, and it has caught real defects twice — but every one of its twelve entries is a claim
about a park that has just been *created*. The park's second-commonest state is one that has been open
for twenty minutes, and the register is blind to it by construction, which means a tuning pass can make
the shipping park interesting for ninety seconds and empty for the rest of a session and still pass the
bar clean. This is Milestone 18's remaining structure arc, and it is cheaper tonight than it was
yesterday, because 495 left behind a fixture that verifies rather than assumes.

**Not a solo cycle.** `cycle - lastSoloCycle = 152 - 151 = 1`, so a declaration would be illegal under
CHARTER v8 condition 2 even if the item warranted one, and it does not: 528 has been passed over once,
not twice, and it splits at a playable seam without help.

**Cap rule:** Structure Track held **3 open < X=4**, so the smith brainstormed once before picking.

**Added to Structure Track:**
- BACKLOG-535 [core] The stake's undecided driver — the reason BACKLOG-518 has been held out of the
  Artist's hands for seven fires is structural, not artistic: *"is this ground still being looked
  after"* is not a number this park has. Decide it in the structure lane, expose it pure, wire the host.
- BACKLOG-536 [emergent] The economy has an outflow and no pinned inflow — `upkeep.ts` promises a
  ground "converges on a skyline it can afford", and after tonight that promise is load-bearing for the
  first time, because the founding park can finally be billed. Nobody has ever measured the refill rate
  against the drain rate.

Both are seeded by what this cycle's own pick uncovers, which is the queue working the way it should.

**Chosen this cycle:** **BACKLOG-528** — the register can only see the first frame. It is the
milestone's unchecked structure arc, it is top of the queue among unblocked items (530 sits above it and
is a mark-hook item that collides directly with the lore track's `refreshMissedMarks` neighbourhood —
skipped this cycle for exactly the collision reason routine 1.5 names), and it does not touch the bond
graph or the away digest the lore track will be in.

## What the shape is, and where the reachability bar lands

`ReachabilityEntry` gains an **optional** second predicate that asks the same question of a park that has
been stepped rather than founded. `holds()` is untouched and the existing twelve are untouched, because
the frame-one claims are correct and load-bearing — this is an added axis, not a rewrite.

The bar does not let this ship as a register upgrade and stop there, and it should not. 495's precedent
is the whole method: build the seam, then **move a founding constant through it** and repair what falls
out. So the Coder writes the stepped claims and then answers, in-world, whatever they say. The
Structure-smith's own read of what they will say, offered as a prediction the chain is free to disprove:

`upkeep.ts` states, in its own header and as a virtue, that *"a ground with a single landmark owes
nothing, so a fresh park is inert"*. The founding world places **one** landmark — the Grove's fallen
cairn — and it is derelict, so it owes nothing either. `upkeepDue(0) = upkeepDue(1) = 0`. The entire
upkeep economy of BACKLOG-480, and the disrepair state four Artist fires have now drawn ruins for, is
dormant on every fresh save in this park's history, calibrated to be so, and documented as a feature.

That is the CHARTER v7 corollary verbatim — the `TILES_PER_HEAD` sentence with a different constant in
it — and the whole reason 528 was filed is that no frame-one predicate can express it. If the prediction
holds, the reachable half is not the register: it is the founding park shipping a skyline that actually
owes something, so a player who watches the Grove for one in-game day sees the heap spent and, the day
after, a landmark go over. Ship both halves in the same cycle, per v7.
