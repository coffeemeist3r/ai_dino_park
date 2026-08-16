# Cycle 132 — Lore-smith

**Milestone 13 shipped last cycle, so this fire opens Milestone 14.** Headline + feel arcs below;
the Structure-smith writes the spine arcs in its own handoff.

## Idea Box

`## Open` is empty. No nudge to seed, reshape, or decline this cycle.

## Milestone 14 (lore half)

**Headline: the private ritual stops being private, and the ground's government gets a term.**

The lore half of Milestone 13 spent three cycles on the hatch — the berth, the mercy, the mealtime
mood in the voice — and the last of those (404) proved something worth acting on: the hatch history
reaches the player best through a *register that isn't a glyph*. The solitary tic (405) is the other
register this park owns and has barely used. It shipped at cycle 87 as pure idleness: a dino left
alone long enough invents a little ritual keyed to its dominant trait. Since then 408/413 let the
keeper catch a dino at it and 414 let grief aim it at an edge — but nothing in the park has ever made
a dino fall into its ritual *because something happened to it*, and no other dino has ever noticed one.

Three arcs, in the order that makes each one possible:

1. **A ritual you fall into after a bad moment** (412) — the hatch's stings reach the tic. This cycle.
2. **A ritual that spreads** (407) — a friend who watches enough of them picks up a faint echo.
3. **A ritual with a name in the book** (409) — the distinctness the player collects at a glance.

By the end the tic is a full loop: the world drives a dino into it, another dino catches it from it,
and the book records who does what.

## The pick — BACKLOG-412 [emergent] Self-soothing tic

> A dino that's just had a bad moment at the hatch (slunk off 394, or lost a scrap) falls into its
> signature tic *sooner* than usual, so the private ritual reads as visible self-comfort after a
> sting, not only idle-time distinctness. Builds on 405 / 394 / 387.

On the milestone checklist (arc 1), and drawn from the open backlog rather than invented — the
drain-before-invent cap holds; nothing new was appended this cycle.

**Why this one, and why now.** The park has four beats at a contested drop and every one of them ends
in a memory string and a face. What none of them has is *aftermath you can watch*. A dino that slinks
off from a scrap it lost walks away and is, from the next step onward, indistinguishable from a dino
that has had a perfectly good evening. 412 gives the sting somewhere to go: the loser peels off and
takes up its own private ritual sooner than a contented dino would — the pacer paces, the fusser
fusses, and the player who saw the standoff thirty seconds ago can read the meaning of it in the body
without a word of dialogue.

It also lands on a seam the code already built twice. `tic.ts` carries `TIC_AFTER_STEPS_HOMESICK`
(410) and the 393 solitary-day threshold, and the caller takes the **min** of them precisely so
shorteners compose instead of fighting. A third shortener is a third argument to a `Math.min`, not a
new mechanism — this item is what that seam was for.

**The bias to hold.** The sting must come from the *event*, not from a memory-string re-read. Three
modules already parse those four hatch strings back out and BACKLOG-483 has been flagged by five
consecutive cycles for exactly that reason; a fourth parser would make the debt worse in the same
cycle we complain about it. The two sites where a dino comes away empty are both inside
`resolveContest`, ten lines apart, and both already have the loser in hand.

**What it must not become.** Not a mood system, not a new glyph (the artist's cycle-131 note stands:
this park's features collide in the glyph space), not a bond change, and not a wander-pull. The tic
already has a place to go and a motion to make. 412 only changes *when* it starts, and files one
memory that says why.

## Handoff

- `state.currentItem` = **BACKLOG-412**
- Milestone 14 opened in `studio/MILESTONE.md` with its lore arcs; the Structure-smith adds the spine.
