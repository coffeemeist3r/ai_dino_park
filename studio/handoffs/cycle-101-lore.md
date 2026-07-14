# Cycle 101 — Lore handoff

Cycle bumped 100→101 (both cycle-100 tracks APPROVED). Idea Box empty (nothing open).

Milestone 4 "The hunt has weight" is ACTIVE with 2 of 6 arcs shipped (437 hunt-feeds, 440 rattled). Lore
runway left: **442 the hunter's reputation** and **443 predator/prey in the book**. Pick the behavior beat
first — 443 is a book read that leans on 442's fear existing to be worth reading.

## Lore pick — BACKLOG-442: The hunter's reputation

**The beat.** Cycle 100 (440) let a just-chased herbivore *say* it was rattled and name its chaser. 442
takes that same food-web memory and turns it into **behavior**: a herbivore chased by the *same* carnivore
several times grows wary of *that dino specifically* — it startles and keeps its distance when that hunter
comes near, **even when it isn't being actively stalked** (the hunter sated, on cooldown, just wandering
past). Fear stops being a per-hunt reflex and becomes a standing, personal read on the food-web history.

**Shape (Designer to spec, Living-minds bias — behavior over a panel).** The 367 hunt already files the prey
a `you slipped <hunter>'s hunt` memory each chase. Read the *count* of those per hunter out of the same
6-slot `recall` window: once a hunter has chased this dino `WARY_CHASES` times, the dino fears it. In the
world tick, a wary herbivore that isn't already fleeing an active stalker but has its feared hunter within
range startles and bolts — reusing the existing 367 flee machinery, so the motion/`fleeing` glyph are free.
Pure `chaseCount`/`fearsHunter` in `world/foodweb.ts` (deterministic, unit-pinned); WorldScene adds one
wariness pass beside the stalk-pairing it already builds. Deathless, no roster mutation, **no save change**
(the memory is the trace and ages out of the window on its own — same discipline as 440).

**Why this and not 443.** The book read (443) is the legibility payoff; it wants a *standing* to read.
442 creates that standing (a personal fear derived from the food-web history), so it precedes 443 cleanly —
next cycle's lore pick.

442 → [~]. Structure-smith picks next (Structure Track top = 438). phase → structure-pending.
