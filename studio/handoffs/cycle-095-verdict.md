# Cycle 95 — Verdict

## Lore track

**Verdict:** APPROVED
**Item:** BACKLOG-340 — Homesick for a friend

**Rationale:** All six criteria pass; build clean, 1042/1042 unit, 313/313 e2e (full parallel, zero flakes).
The grief tic (414) gave a lonely dino a *direction to face*; 340 gives it *legs*. A dino residing a zone
away from its closest friend (013, above the same 8-pt floor) now gets homesick: after two migration rolls
of absence it sets off back across the chain toward that friend, one zone per hop, filing a memory that
names them ("you miss Twitch — the zone feels lonely without them…") and floating a 🧭 beat. Crucially the
homesick pull **overrides the 341 settle-resist** — a *settled* dino still leaves for company, so the
milestone's own thesis ("company, not scenery, decides where a dino settles") is enforced in the migration
math, not just narrated. The read is a pure `homesickDest` that reuses `closestFriend` + `griefEdge`, so 340
and 414 can never disagree on which friend or which way; a fourth zone needs no new code. No WebLLM, no
NPCBrain breach, no save change (tenure/bonds/zones already persist). Milestone 2's **final** lore arc (3/3).
Ships.

## Structure track

**Verdict:** APPROVED
**Item:** BACKLOG-418 — Per-zone crop identity

**Rationale:** All six criteria pass. The plot grew the same 🍓 in every zone even though gathering already
diverges per zone (348) and the chain raises three different skylines (417); now farming diverges too. The
crop is a per-zone value (`CROP_BY_ZONE`/`cropOf`/`stageGlyph`): the bowl keeps its **berries** — byte-identical,
same food dropped, same 🍓 marker, same baked berry-bush prop — and the shaded **grove** grows **leafy greens**
with a distinct 🥬 ripe marker (chosen so the plot never reads as its own 🌿 sprout or the greens food's 🌿),
releasing greens into the feeding loop when harvested. The seed/sprout stages keep the shared soil-mound rig;
only the grove's ripe marker falls back to its glyph until an [art] fire draws a greens bush. Additive — grove
plot already persisted, no version bump. QA correctly updated one pre-existing spec (cycle-079) that pinned
the *old* grove=berries value: that's the feature's intended change landing, not a regression, and no other
spec pinned it. **Honest scope note:** the item's "…the Fernreach their own" is not fully met — the Fernreach
has no plot today, and FOODS has only two plant crops (berries/greens), so a distinct third crop needs a
farmable food first; forcing a nonsensical "fish plot" would read worse. The two-zone divergence already
delivers "the farming half diverges the way gathering does," which is what the arc asked; the Fernreach's own
plot is seeded properly as BACKLOG-432 (a third crop first). Milestone 2 structure arc 2 of 3. Ships.

## Milestone bookkeeping

Milestone 2 "Places to belong": **lore arc 3 (340) `[x]` — the lore side is now complete (341 ✓, 414 ✓,
340 ✓)**; structure arc (418 per-zone crops) `[x]`. Remaining: structure arc **428** (zone prosperity index).
Five of six arcs shipped — the milestone stays **ACTIVE** until 428 closes it (the smiths pick it next).

## Housekeeping

- Closed 340 + 418 moved from BACKLOG.md to BACKLOG-archive.md (working backlog kept lean).
- Structure Track refilled to 4 open by the Structure-smith (428/429/432/433).
