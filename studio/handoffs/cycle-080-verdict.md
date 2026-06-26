# Cycle 80 — Verdict

**Both tracks APPROVED.** The bowl got needs, and the dino on the outside got a face. The operator dropped
a big raw nudge — hunting, hunger, thirst, *death?* — and the studio answered it along the operator's own
seam: the structural drive ships deathless, the food-web beat is queued, and **mortality is handed back to
the operator as a constitution call**. Alongside it, the long-dormant dino↔dino bond graph finally said
something about the dino with no friends.

## Structure track — BACKLOG-371 (Need-drive spine): **APPROVED**

For twenty cycles a dino never wanted anything on its own clock — food mattered only when the keeper dropped
it. Now each dino carries a hunger and a thirst that build over realtime at a trait-shaped rate (the eager
burn through both a little faster), cross a threshold, and wear it: a 🍖 over the hungry, a 💧 over the
parched. And the needs *resolve through what already exists* — I watched the cast graze a hatch drop and the
🍖 wink out, and dropped Rex beside the grove pond and watched the 💧 clear as it drank — no new pull, no new
water troughs, just the systems the bowl already had given a reason to matter. The whole thing is a pure
`needs.ts` (build + `pressingNeed` + `satisfy`) plus a one-line `checkNeeds()` at the forceStep tail and a
`satisfy(…, 'hunger')` at the eat site; the `needs` save field is additive (old saves load every dino sated,
no `SAVE_VERSION` bump). The discipline I most wanted to see held: it is **deathless by construction** — the
module never removes a dino, and the e2e pins a need at the max over 5000 steps with the population unmoved.
That is exactly the right call: it gives the operator a living need-drive to feel out before ruling on whether
the bowl should ever take a life, and it keeps the cozy-companion vibe intact while the harder question waits
upstairs. The one honest seam — a bowl dino can only drink once it migrates to the grove pond — is intentional
and flagged: thirst builds at half hunger's rate so 💧 stays rare, and the wander-pull that would send a
thirsty dino to water is the deliberately-deferred 372. Not a half-feature; a spine with its next vertebra
named. 827 unit green; the deserialize round-trip, back-compat, and malformed-rejection are all pinned.

## Lore track — BACKLOG-135 (The loner): **APPROVED**

The bond graph (013) has run huddles, comfort, and gossip for forty cycles, but it had never once spoken about
a dino with *no* close ties — every distinctness beat was about pairs and clusters, never the one on the
outside. Now it is: a dino whose every pairwise bond sits below the floor is a loner, it withdraws toward the
bowl wall and wears a 🥀, and a keeper greet lands extra-hard on the one who needs it most — the differential
e2e proves the bump is exactly `LONER_BONUS` over an identical non-loner greet, with a 💐 perk-up beat the
moment you notice it. The Coder caught the trap I'd have failed it on: a fresh bowl is *all* unbonded, so a
naïve deterministic edge-drift would have pinned the whole cast to the walls, killed every meeting, and frozen
the social loop into permanent loneliness — a self-defeating beat. Making the drift **probabilistic**
(`MOPE_CHANCE`) while keeping the 🥀 tell continuous is the correct fix: a loner still mills enough to meet
someone and grow out of it, so loneliness is a state a dino can *leave*, not a sentence — which is the whole
point, and exactly what the queued 369 (the 🥀 lifts when the first real bond forms) pays off. Two existing
greet-delta specs (035-tones, 032-repair) were correctly updated in-fire to isolate their own deltas from the
new loner bonus — the sanctioned move when a real behavior change supersedes an old assertion, not a fudge.
`world/loner.ts` is pure; no save change (loner status is read live off the already-saved bonds).

## Build health
- `npm run build` clean (tsc + vite).
- **827 unit green** (+14: 6 loner, 5 needs, 3 saveGame-needs round-trip/back-compat/reject).
- **e2e 252/253** — the lone failure is `cycle-077-carry`, the catalogued rotating parallel-load flake:
  green isolated twice (`--workers=1` and a 2-spec run), in an *untouched* zone-carry/migration path nowhere
  near this diff. The flake rotates between full runs (cycle-077/038/069 have each taken the slot historically).
- web-llm boundary grep clean; `loner.ts`/`needs.ts` import no Phaser/AI (pure); the `needs` save field is
  additive with no `SAVE_VERSION` bump; the two tracks edit disjoint `forceStep` regions and no shared function.

## Operator note
**Death was declined at the routine level and routed to you** (see IDEABOX): it touches breeding/eggs, the
plaque lineage, save permanence, and the cozy-companion vibe — a CHARTER amendment, not a routine flip (the
GBA-pixel cycle-37 precedent). The need-drive now ships deathless so you can decide with it in hand. To make a
dino mortal: amend CHARTER.md and the next cycle obeys.

Cycle closes; Lore-smith bumps to 81 next run.
