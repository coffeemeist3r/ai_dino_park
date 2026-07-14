# Cycle 101 — Verdict

**BACKLOG-442 — the hunter's reputation — APPROVED.**
**BACKLOG-438 — a zone wants what it can't grow — APPROVED.**

Both meet the bar: build clean, `tsc --noEmit` clean, vitest 1141/1141 (127 files), e2e siblings green warm
(the lens specs' cold-boot timeout is the documented flake — 6/6 on the warm re-run), WebLLM `ai/`-only, no
save-schema change.

## BACKLOG-442 — the hunter's reputation (lore) ✅

Cycle 100 let a just-chased herbivore *say* it was rattled (440). This cycle the fear stops being a line and
becomes a **standing**: a herbivore chased by the same carnivore twice grows wary of *that dino specifically*
and startles from it even when it isn't being hunted — the hunter sated, on cooldown, or just wandering past.
The whole thing is read out of the memory the hunt already files: `chaseCount` tallies a prey's
`slipped <hunter>'s hunt` memories per hunter, `fearsHunter` trips at `WARY_CHASES=2`, and a one-loop wariness
pass in the world tick sets the prey fleeing the nearest feared hunter within range — riding the exact 367
flee branch, so the bolt and the 💨 read identically whether the fear is an active stalk or an old grudge. Two
(not three) is the honest threshold: `recall` only holds six memories, so three same-hunter chases rarely
coexist; two is a reachable "*that* one again." Deathless and save-free by construction — the pass touches only
the flee map, and the grudge ages out of the recall window on its own. Fear is now personal, and it's a read on
the food-web history, not a reflex. **Milestone 4 lore arc 2 of 3 ✅.**

## BACKLOG-438 — a zone wants what it can't grow (structure) ✅

Milestone 3 gave "enough to go around" its supply side — a glutted zone sheds toward a lighter neighbour
(429). 438 opens the **demand** side, keyed to farming. Each zone grows exactly one crop (bowl berries, grove
greens, Fernreach roots — 418/432), so each is structurally light on the other two. `zoneWant` makes that a
legible request: among a zone's linked neighbours growing a crop it can't, the one with the greatest harvest
output wins — a want that follows the productive farmer, `null` until a neighbour actually banks a surplus, the
first neighbour in link order breaking a tie. It surfaces as a fourth line on the zone-map box —
`wants 🥬◂The Grove` — beside the head count, prosperity badge, and the zone's own 🌾 tally. The grove, bordered
by two farmers, points at whichever of the bowl and the Fernreach is out-growing the other, so the demand
graph shifts with who's actually farming.

**Honest scope.** This is the demand *read*, not a food mover — there is no banked food to ferry yet (harvest
still drops straight into the feeding loop). That's the same seam 429 sat behind before per-zone piles existed:
surface the pressure, wire the flow next. The mover is already queued (444, a carrier feeds the hungry) and it
needs a food store, so this cycle's Structure-smith seeded that missing spine — **446, a zone banks its
harvest**. A read that a follow-up actuates, not a half-shipped feature: the want is fully computed, fully
tested, and fully visible today. **Milestone 4 structure arc 2 of 3 ✅.**

## Milestone 4 "The hunt has weight" — 4 of 6 arcs

Minds (M1) → a home ground (M2) → a ground that feeds them (M3) → a ground where the eating has stakes (M4).
One arc left per track: **the hunt reads in the book** — a carnivore's catches and a herbivore's escapes made
legible (443) — and **need pulls the body** — a pressing-need dino biasing its wander toward food/water (436).

## Housekeeping

442/438 → `[x]`, moved to `BACKLOG-archive.md`. Milestone arcs ticked. CHANGELOG appended. Structure Track
open = 436/444/445/446. phase → artist-pending.
