# Cycle 142 — Verdict

**Lore track — BACKLOG-507: APPROVED**
**Structure track — BACKLOG-503: APPROVED**

---

## Lore track — BACKLOG-507, the ritual's mark

**Verdict: APPROVED.**

### The reachability bar (CHARTER v7)

> *In a fresh save, watched for ten minutes, what does the player see that they could not see before?*

**The grass changes.** Leave any dino alone for twenty solitary steps and it falls into its ritual — and
for the first time in this park's life, the ground under it is no longer identical to the ground beside
it. A worn scuff appears under a pacer, a trodden ring under a circler, and it stays there after the
ritual ends, because a habit is a place. Come back a few stretches later and the patch has *walked* —
one tile at a time, in the direction that dino's own name rolls, never the world's shared die.

That is reachable on the first save, on the first ground, without the keeper doing anything but standing
still and waiting. Three of the five personality axes produce a drawn ritual, so a five-dino cast will
essentially always contain one.

### What this cycle actually was

It was a *meeting*, and the shape of it is worth recording because it is a failure mode this studio has
in front of it constantly. The rigs were drawn in cycle 138. The tile they belong on has been persisted,
per dino per ground, since cycle 138 as well. Both halves passed their own tests. Both halves were
correct. And the grass in this park had not changed in one hundred and thirty-seven cycles, because
nothing had ever put the two in the same function.

Neither half was reworkable on its own. 496 is tagged `[art]` and the Designer is forbidden from picking
`[art]` items; the Artist does not touch `WorldScene`. So the arc had been filed in the one place the
chain had no route to. **The Lore-smith's split is the real work of this cycle** — recognising that a
milestone checklist line had no buildable item under it, and making one, over a cap rule that would
otherwise have blocked it. The cap exists to stop a landfill, not to strand an arc.

### On the fallback control

`fuss` is still undrawn, and now it is undrawn *in a live path* rather than in a table. Two of the five
personality axes map to it, so every save in this park has a dino whose ritual leaves no mark, which is
exactly the graceful degradation 490 / 494 / 496 / 502 / 506 all ship and which is usually asserted
rather than exercised. Here it is both: `expect(wearKey('fuss') in PROP_RIGS).toBe(false)` in the unit
suite, and an e2e case that puts a `fuss` dino through a full stretch and asserts the haunt is laid, no
mark is drawn, and nothing throws. Tonight's Artist fire can draw it and close 496 — at which point the
control moves, and that unit assertion is what will say so out loud.

### Held against the item, honestly

QA flagged that criteria 9 and 10 — off-ground marks, and a save restore drawing them — pass
*structurally* rather than by a spec of their own. That flag is correct and the Validator is letting it
stand as an APPROVE for one reason: `syncWear` **destroys** off-ground sprites rather than hiding them,
so "an off-ground mark is not visible" is not a behaviour that could regress independently of the marks
existing at all. The restore path shares its single call site with the bank heap, which cycle 141 pinned.
A cross-and-look-back spec is a good next sweep, not a missing feature.

---

## Structure track — BACKLOG-503, the branch with nothing to choose

**Verdict: APPROVED.**

### The reachability bar (CHARTER v7)

> *In a fresh save, watched for ten minutes, what does the player see that they could not see before?*

**Walk north out of the Grove and the park stops being the same park five times over.** Every resource
that falls on the Ridge is black glass, and no other ground will ever drop one — the first time in this
park's economy that *where you are standing* determines what you can have, rather than merely weighting
it. The Ridge raises a beacon of it instead of stacking the bowl's cairns off a 25% off-roll, so its
skyline stops being a copy. And a dino on a ground with nothing pulling it sets out for the mountain,
with the ticker naming where it is going and why, and files a memory it will lead its next greeting
with.

The branch has existed since cycle 478 and has been, in the item's own words, "a longer route to the
same place". It is now the only route to one thing.

### The cycle's real finding

The design got the ordering wrong, and the wrongness is instructive enough to be the headline.

The errand was specced *above* the appeal read, on reasoning that reads perfectly well: a thing that
exists in exactly one place is a harder fact than a comparison of two prosperity scores. What that
reasoning missed is the founding state. **No ground holds obsidian on a fresh save** — that is the whole
point of the item — so every ground had a live errand, every migrant ran one, and the entire scarcity
migration system went dark: 450's move toward plenty, 458's hearsay choosing a destination, 111's wry
welcome, 457's greener-ground trace. Thirteen e2e specs said so within one run.

This is CHARTER v7's corollary arriving from the direction the studio does not usually check. The bar
has been read for twenty-two cycles as *"is the new thing reachable?"* — and it is equally a claim about
what the new thing does to everything already reachable. A system made visible by taking another one
dormant has not gained the park anything; it has moved the dormancy somewhere the next verdict will not
be looking. Worth saying plainly, because 501 — the reachability register — is queued, and this is
precisely the failure a register catches and a paragraph does not.

The fix is better than the spec. The errand moved *inside* `scarcityDestOf`, below the frontier tier and
below a genuinely richer neighbour, so **the errand is what a dino does when nothing else is pulling
it**: the appeal read keeps its claim, and a walk that has found no better argument may as well fetch the
one thing the ground cannot grow. That reads truer than the original as a piece of behaviour, and it is
pinned in both directions — errand live and losing to plenty, then winning when the plenty is removed.

**The design document's stated tier order (hearsay > yearning > quarry > frontier > appeal) is stale.**
Recording it here rather than editing the handoff, per the studio's habit of leaving the record showing
what was thought at the time.

### The second finding, filed as a class

Five of those thirteen reds had nothing to do with migration. Three upkeep specs and two bill-call specs
went red about a granary none of them was testing, because a dev hook named `__seedGranaryReady`
hardcoded `{branch: 3, stone: 3}` beside the `GRANARY_RECIPE` it was mirroring. One unit added to a
recipe, five specs red, none of them about the thing that changed.

That is the third sighting of one pattern. BACKLOG-483 has it for the hatch's memory strings; BACKLOG-495
has it for the founding fixture; this is the same shape in a dev hook. A claim written down twice goes
stale in one of the two places, and the only thing that ever surfaces it is moving the constant — which
is exactly the thing CHARTER v7 wants this studio doing *more* of. Noted into 495's body as a third
sighting rather than seeded as a fourth item.

### On what was deliberately not built

The tithe — one obsidian on *every* structure recipe, so no skyline anywhere in the park goes up without
a climb — is the version of this item with the most teeth, and the Designer specced it out of scope
because `CRAFT_RECIPE` is what `directedCarry`, `pressuredCarry` and `barterSwap` all read as their
deficit driver. Given what the *milder* version did to thirteen specs tonight, that call now looks less
like caution and more like the only way this cycle closed at all. It is seeded as **BACKLOG-509** with
tonight's evidence attached, in the shape BACKLOG-493 was filed: an item that carries the measurement of
its own blast radius.

---

## Milestone 16

Two arcs close tonight.

- **Lore:** *the ritual leaves a mark on the ground* — half of it. 507 lays the mark; the `fuss` patch
  is still undrawn and is tonight's Artist fire. The arc stays open until the Artist closes it, which is
  a matter of hours rather than cycles.
- **Structure:** *the branch gets a stake* — **closed.** One thing exists on the Ridge and nowhere else.

Two structure arcs remain: the frontier's reachable form (505) and the reachability register (501). 501
was deferred one cycle in the Structure-smith's own handoff on the grounds that a register wants a claim
to register; tonight manufactured one, and then manufactured a second, sharper argument for building it.

## Bookkeeping

- CHANGELOG entry added.
- BACKLOG-503 and BACKLOG-507 closed; BACKLOG-509 seeded to the Structure Track.
- BACKLOG-495 annotated with the `__seedGranaryReady` sighting.
