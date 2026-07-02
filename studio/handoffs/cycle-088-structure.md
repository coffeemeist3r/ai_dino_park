# Cycle 88 — Structure Handoff

**Intent:** Finish the three-zone economy's *identity*. The last three cycles built the
Fernreach out — the zone spine (378), then its terrain (399), then its ground art (fern
406). What's still missing is its *economy*: resource bias (348) is a two-row table
(bowl→stone, grove→branch), so the Fernreach inherits the uniform 50/50 fallback and gathers
the same things its neighbours do. BACKLOG-400 leans it toward a third kind, so the chain
gathers *three* different things and the directed-carry / barter machinery (356/358) finally
has a third distinct pile to balance. This is the natural drain of the arc already in flight,
and it reads as a real beat: "the Fernreach grows its own thing."

**Cap rule:** 3 open (384/398/400) < X=4 → brainstorm to refill. **Added to Structure Track:**
BACKLOG-417 (Fernreach-distinct structure — the frond bias raises its own landmark, extending
377 past the cairn/lean-to pair) and BACKLOG-418 (per-zone crop identity — each zone's plot
grows a crop suited to it, so farming diverges the way gathering does). After picking 400 the
queue holds 4 open (384/398/417/418) = X.

**Chosen this cycle:** **BACKLOG-400** — the Fernreach leans a new third resource kind (a
frond, 🌾), extending `ZONE_BIAS` past two. The change is almost entirely pure `resource.ts`
(a new `ResourceKind`, a glyph, the bias row, generalizing `pickKind`'s off-kind pick past
its two-way branch, and completing the `STRUCTURE_BY_BIAS` record). Everything that iterates
the kind registry — `stockpileLine`, `pickCarry`, `directedCarry`, `barterSwap` — picks the
new kind up additively and correctly. Stockpiles are `Partial<Record<ResourceKind, number>>`,
so the save is additive with no version bump (old piles simply have no frond key).

**Runners-up, why not:** 384 (resource regrowth) is a strong renewable-constraint foundation
but opens a new mechanic dimension mid-arc; better after the three economies are actually
distinct. 398 (edge indicator) is pure legibility with no downstream unblock (the operator
nudge can wait its turn). Both stay queued.

**Collision check:** file-disjoint from the lore pick (408 caught mid-tic). Lore touches
`tic.ts` + the greet path (`pickTone`) in WorldScene; structure touches `resource.ts` + the
resource-spawn call (`maybeSpawnResource`, which already passes the zone since 348) in a
different WorldScene method. No shared function.
