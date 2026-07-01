# Cycle 87 — Design

## Lore track — BACKLOG-405 Solitary tic

**Item:** BACKLOG-405 [emergent] Solitary tic.

**Why this cycle:** Four straight cycles put the whole personality budget into the feeding standoff (375
yield / 387 gobble / 390 stand / 394 slink) — every recent beat was one dino reacting to another over a
scrap. This turns inward: distinctness that comes from a dino being *alone*, not from an interaction. A dino
left with nothing pressing and no company invents a small private ritual keyed to its most-pronounced trait,
so even the bowl's dead air reads as five distinct individuals. Model-free, name-seeded, deterministic —
squarely CHARTER "Living minds" (a dino unmistakably itself), and the spine 407–411 all hang off.

**What ships:** A dino that goes a long real stretch *undisturbed* — no pressing hunger/thirst, no food to
chase, no other dino within a few tiles in its own zone — falls into its **signature tic**: it paces a fixed
little path, fusses over one spot, or turns a slow circle, chosen deterministically from its personality
(the ritual of its dominant trait). The first time it does, it floats the tic's glyph, logs a one-line
event, and files a one-time memory ("alone a long while, you paced a fixed little path — a little ritual of
your own") that the existing greeting/reflection path can later surface. If company arrives or a need
presses, the ritual breaks (and can re-form later). Watch a lone Fernreach resident, or a dino that drifted
off from the pack: after ~20 solitary steps it settles into its own recognizable little motion.

**Acceptance criteria:**
- [ ] `signatureTic(personality)` is deterministic and returns one of the three tic kinds (`pace`/`fuss`/`circle`); two dinos with different dominant traits can get different tics.
- [ ] A dino kept undisturbed (alone in a zone, no pressing need, no food) for `TIC_AFTER_STEPS` force-steps has `__tic(name).invented === true`; before the threshold it is `false`.
- [ ] On inventing the tic the dino files exactly one tic memory (visible in `__memory()`), and re-entering the tic does not append a second copy.
- [ ] A dino with company within range (another dino ≤ `TIC_COMPANY_RANGE` tiles in the same zone) never invents a tic, no matter how many steps pass; its `__tic(name).solo` counter resets.
- [ ] A dino with a pressing need (hunger/thirst over threshold) never invents a tic while the need presses.
- [ ] `ticStep` keeps a `pace`/`circle` dino within one tile of its anchor and holds a `fuss` dino on its anchor tile; output stays in-bounds.

**Out of scope:** Sharing/echoing a tic between friends (407), the keeper catching a dino mid-tic (408), the
collection-book readout (409), faster onset in a stranger zone (410), the "glad of the company" note (411).
No bond change. No new persisted save field (the tic is re-derived from traits + live solitude, and the tic
*memory* rides the existing additive memory ring).

**Constraints:** Pure logic in a new `world/tic.ts` (no Phaser, no WebLLM). WorldScene glue lives only in
`forceStep`'s per-dino decision branch (beside wander/mope) plus a tiny `performTic` helper and one dev hook.
Must not disturb the feeding/mope/huddle/gather branches — the tic is strictly the *last* idle option, below
socializing, and fires only when none of them do. Activity label stays `wandering` (like the loner mope), so
no `activity.ts` change.

## Structure track — BACKLOG-358 Edge-meet barter

**Item:** BACKLOG-358 [emergent] Edge-meet barter.

**Why this cycle:** The inter-zone economy is one-way. Carry (329 → directed 356 → zone-aimed 377) only moves
a resource in the direction a dino physically walks, and only on a crossing. Barter is the converse: two
dinos from *different* zones that meet at their shared edge trade, each handing over the kind the other's
zone is short of — the first two-way exchange. It's a pure second caller of load-bearing seams (`directedCarry`,
`takeResource`/`bankResource`, the 383 adjacency table), so it deepens the diverging-piles story (348/377)
without a new spine.

**What ships:** When a dino near a linking edge of its zone and a dino near the matching edge of the
neighbour zone are both present (a "meet at the shared edge"), they barter: each zone's pile gives the other
the resource kind that zone most needs for its next structure (`directedCarry` in both directions, falling
back to a spare), applied on the lossless `takeResource`→`bankResource` path. A 🔄 mark floats over each
dino that's on-screen, an event logs the trade, and both dinos file a memory of it. Fires on its own via a
cooldown-gated ambient scan each step; also exposed as a deterministic dev hook for tests. Conserved
(never creates or destroys a resource) and capped (never banks past `STOCKPILE_CAP`).

**Acceptance criteria:**
- [ ] `barterSwap(pileA, pileB, recipeA, recipeB)` returns `{ aGives, bGives }` where `aGives` is what B needs (`directedCarry(pileA, pileB, recipeB)`) and `bGives` is what A needs — each a kind the giver actually has, or null.
- [ ] Applying a barter is conserved: total of each kind across the two piles is unchanged (one pile −1, the other +1, per direction that moves).
- [ ] Applying a barter never banks a kind past `STOCKPILE_CAP` (a full destination for a kind → that direction doesn't move).
- [ ] `nearLinkEdge(zoneId, tile, cols)` returns the neighbour zone id when the tile is within the band of an edge that links out of `zoneId`, else null; a zone with two links (the grove) can report either neighbour by which edge the tile sits at.
- [ ] Two dinos placed in linked zones each at their shared edge, with tradeable piles, barter within one force-step (`__edgeBarter` or the ambient scan): both zone piles change and an event is logged.
- [ ] A barter between piles with nothing tradeable (both empty, or each full of only what the other can't use) is a no-op — no phantom log, no pile change.

**Out of scope:** Any bond/affinity change (barter is economic; the social ripple is the Lore-smith's). A
new persisted field (the per-zone piles already persist). Barter *initiating* a crossing, or three-way trades.

**Constraints:** Pure logic in `resource.ts` (`barterSwap` + `BarterSwap` type) and `zones.ts`
(`nearLinkEdge`). WorldScene glue is a `maybeBarter` (cooldown-gated ambient scan) + `doBarter` (applies the
swap) pair in the `forceStep` **tail**, beside `checkFeeding`/`maybeSpawnResource` — a different method's
worth of the file than the 405 decision-branch edit, so the two tracks don't overlap. Reuse `directedCarry`,
`takeResource`, `bankResource`, `structureRecipe`, `zoneNeighbors`, `cooldownReady` — do not reinvent.
