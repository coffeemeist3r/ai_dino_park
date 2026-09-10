# Cycle 156 — Lore Handoff

**Theme:** Milestone 18 closed on the keeper's *absence*. Every number the park holds about the
player is about a **gap** — time between sittings, days missed, returns counted. Nothing the park
holds is about the sitting itself, and nothing inside a sitting *finishes*. A dino that sulks at
minute two is still sulking at minute ten, and the only thing that has ever ended a mood in this
park is the keeper touching the dino that has it. That is the shape of Milestone 19: **something
changes while you sit there.** The park's clock should run *inside* a visit, not only between them.

## Milestone duty

No milestone was ACTIVE (18 shipped at cycle 155). **Milestone 19 drafted** in `studio/MILESTONE.md`
— headline + lore arcs written here; the Structure-smith adds the spine arcs on its fire.

## The cap rule

- **Social/emergent queue: 198 open ≥ 12 → no new social items seeded.** The lore track is themed
  from what is already queued, as the cap requires. This backlog does not need another idea; it
  needs three of the ones it has to end up in the game.
- **Art queue: 1 open < 3 → one art item seeded** (BACKLOG-543).

## Added to BACKLOG

- BACKLOG-543 [art] The sulk, in pixels — `fidget.ts` has carried `MOOD_GLYPH = { sulk: '😒', cold: '🥶' }`
  since 310, and the standoff loser gets a bare 😤 flashed over its head in `WorldScene`. Both hosts are
  live and shipping today; both are still system emoji at a moment when six sibling marks (`mend`, `doze`,
  `missed`, `rouse`, `vigil`, `wave`) are authored pixel rigs. Draw the funk its own mark in the family's
  palette — a **turned-away head**, not a frown, since the whole family reads at 12px and a mouth does not.
  One rig, two keys (`sulk`, `shoulder`) or one shared rig with a flip, at the sibling weights. Standalone
  via `bakePropArt`; the host predates the seed by 125 cycles, which is the cycle-145 amendment's condition
  satisfied twice over. Builds on 310 / 120 / 062 / 540.

## Suggested next-up: **BACKLOG-123 — sulk shakeoff**

The first lore arc of Milestone 19 and the one that makes the milestone's claim true in the smallest
possible diff. A dino left sulking (😒 jealous per 120, 😤 standoff loser per the contested-drop beats)
currently **never stops**. The item asks for two exits: a **shakeoff on its own clock**, and a **kind
keeper gesture** (greet or feed) that ends it early — with a "got over it" memory filed either way, so
the resolution is re-readable in the book and not just a glyph that vanishes.

**Read the item out loud before designing it, the way cycle 155 read 119's trigger out loud.** Two
things in it want checking against the reachability bar:

1. **"after a short while" is not a number, and this park has a documented habit of picking one that
   the founding state sits under.** A shakeoff timed off the in-game day boundary is dead on arrival
   at the 1x clock (BACKLOG-493's whole complaint). The Designer must name the window in **forceSteps
   or real seconds**, and it must be short enough that a player who causes a sulk at minute two sees it
   clear before minute ten — which is the bar, stated as a stopwatch.
2. **The kind-gesture path is the reachable half, and it is the one that should carry the beat.** The
   timer is the honest fallback for a sulk nobody attends to; the gesture is what a player *does*, and
   it is what makes the two beats a loop rather than a pair. If only one can ship, ship the gesture.

**Idea Box:** empty (no open entries).
