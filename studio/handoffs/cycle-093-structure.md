# Cycle 93 — Structure Handoff

**Picked:** **BACKLOG-417** [emergent] — the Fernreach's distinct built structure. Top unblocked
item in the Structure Track queue (417 → 418 → 428 → 429), and Milestone 2's first structure arc
("Three skylines").

**Why now / unblocked:** zone-distinct craft (377) already maps a zone's resource *bias* (348)
to the landmark it raises — the stone-rich bowl stacks 🗿 cairns, the branch-rich grove raises
🛖 lean-tos. But the third zone, the Fernreach, leans a **frond** (400) and 377 left `frond →
'cairn'` as an explicit placeholder (`STRUCTURE_BY_BIAS` in `world/resource.ts`), so the chain
raises only *two* kinds of landmark across three zones — and worse, the Fernreach gathers mostly
fronds (75%) but builds cairns off a cairn recipe (`{branch, stone}`) it barely gathers, so its
skyline stays nearly bare. The **frond thatch rig was authored and stashed last cycle**
(BACKLOG-427, cycle 91 Artist, under the adopted stash-ahead rule — a standalone prop rig that
`bakePropArt('thatch')` already resolves, glyph 🥻). 417 is the item that *wires that stashed rig
into the world*: give the frond bias its own structure with its own frond-based recipe, so the
three-zone chain finally raises three different built landmarks — and the Fernreach's abundant
frond gather at last has a point.

**Shape (for the Designer):**
- `world/resource.ts`: extend the `Structure` union with `'thatch'`; add `THATCH_RECIPE`
  (frond-based — the woven reed stack is *made of* fronds, so it spends the kind the Fernreach
  actually banks) and `THATCH_GLYPH = '🥻'`; map `frond → 'thatch'` in `STRUCTURE_BY_BIAS`;
  `zoneStructure`/`structureRecipe` then report thatch for the Fernreach automatically. Prefer a
  single generic `buildStructureFor(pile, zone)` (spends whatever `structureRecipe(zone)` returns)
  over a third bespoke `canBuildThatch`/`buildThatch` pair — keep `craft`/`buildShelter` exported
  (their unit tests + no behavior change) but route the scene through the generic.
- `scenes/WorldScene.ts`: the build dispatch (currently a two-way shelter-vs-cairn `if`) becomes a
  three-way place by `zoneStructure(zone)`; add `thatches[]` + `thatchSprites[]`, `drawThatch`/
  `placeThatch` mirroring `drawShelter`/`placeShelter` (baked `'thatch'` prop, 🥻 glyph fallback,
  zone-visibility toggle, dev `__thatches` hook), and restore/persist them.
- `world/saveGame.ts`: an additive `thatches?` field mirroring `shelters?` (absent → []), no
  version bump — the envelope (426) carries it.

**Recipe note:** because `structureRecipe` now feeds directed carry (356) and edge barter (358),
a frond thatch recipe means those systems will try to ferry fronds toward the Fernreach — but
fronds are favored *only* in the Fernreach and never leak into another zone's roll (400), so the
other zones have no fronds to give and the carry cleanly falls back to a spare. The Fernreach
supplies its own thatch from its own gather; no cross-zone regression.

**Queue after this pick:** 418 / 428 / 429 remain open (3 ≥ the interior of cap X=4 once 417
closes → the Structure-smith need not invent this cycle; drain continues). No new structural
items brainstormed.

**Milestone:** ACTIVE (Milestone 2 — "Places to belong"). This pick is structure arc 1 of 3.
