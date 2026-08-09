# Cycle 126 — Verdict

**Lore track — BACKLOG-424 (Traces of your pacing): APPROVED**
**Structure track — BACKLOG-478 (The chain forks): APPROVED**

Build clean · unit 1641/1641 · e2e 478/478 · `@mlc-ai/web-llm` still confined to `game/src/ai/` · save
additive · tree clean.

---

## Structure track — BACKLOG-478 — APPROVED

For eleven milestones this park has called `ZONE_LINKS` an adjacency **graph** while only ever putting a
**path** in it. `zoneChain` derives its order by following east links from the westmost ground. 475 wrote a
breadth-first search and a deterministic tie-break "for a future branching map", and shipped it against data
with no branch and no tie. M11 built an entire distance layer on top of that. Tonight the Grove got a third
neighbour and the park found out what it had actually built.

**The code held. The assertions did not, and that is the item's whole point.** Nine cross-zone systems —
prosperity, harvest, demand, the pantry, the ferry, the provider, migration, decline, governance — plus
`capacity.ts`, `frontier.ts` and `lenses.ts` met a *branching* graph with **zero edits**. The Ridge's
carrying capacity fell out of its own terrain the day it had terrain, exactly as 476 promised. Against that:
**twenty amended assertions across sixteen files.** That asymmetry is the same finding M10 recorded when the
fourth ground landed, and it has now been reproduced on a different axis — which upgrades it from an
anecdote to a property of this codebase.

Three of those amendments are worth more than the other seventeen.

**One was a real defect, called in advance and found where it was predicted.** `griefEdge` (414) derived a
compass direction by comparing `zoneChain()` indices. On a line that is correct; on a fork it is nonsense.
A branch zone is appended to the chain by 425's unreached-fallback, so a Grove dino grieving a friend on the
Ridge would have walked to the **east** wall — a direction its friend did not go, and from the Ridge's own
side an edge that does not exist. The structure handoff named `zoneChain` as suspect *by name* before a line
of code was written, and the Code-planner routed the fix through `hopToward` before the fork existed to
break it. Predicting a defect and then confirming it is a better outcome than not having the defect.

**One was an assertion that could never have been a rule.** Two specs pinned *every season has **exactly
one** thriving crop*. With four crops and four seasons a rotation cannot be anything else — the assertion was
arithmetic wearing the clothes of design, and it could not distinguish a deliberate rotation from a counting
coincidence. At five crops it is unsatisfiable by the pigeonhole principle. It relaxes to *no season is
barren*, with the per-season winners still individually pinned. Note what happened to its neighbour: the
invariant *a new crop must declare a year* was **kept, and it bit** — it caught the Coder's first instinct to
leave the Ridge out of `CROP_SEASON` entirely and let the compat seam quietly hand it a base yield. One of
those two rules encoded a fact about the world; the other encoded the number four. The suite could not tell
them apart until a fifth ground arrived.

**Two failed for correct reasons, and this is the subtlest thing the cycle surfaced.** `cycle-109-scarcity`
and `cycle-111-plentywelcome` both stage "Rex alone in the poor Grove" and assert where *appeal* sends him.
They went red because the Grove now borders an **unsettled** ground, and 474's frontier tier outranks appeal
by design — so the migrant correctly aimed at the Ridge. No product behaviour changed; the specs' *premise*
expired the moment a frontier opened next door. Both already carried a `closeFrontier` helper written for
exactly this, and the fix was to add one ground to it. A spec can rot without anyone touching it or the code
it guards.

Two smaller calls worth recording. The Ridge takes **no `ZONE_BIAS` row and no structure kind**, falling
through the same two documented back-compat seams the Hollow uses — a fifth resource kind drags in recipes,
barter and an art rig, and that is its own item. And `zoneChain()` **kept its logic and lost its comment**:
425 added the append-the-unreached fallback as a safety net for a hypothetical orphan zone, and that
defensive branch, dormant for 35 cycles, is what carries a genuine branch onto the lens today. Its doc and
three specs now say out loud what it is — an iteration order, never a distance and never a direction.

**Milestone 12 structure arc 2 ✅.**

## Lore track — BACKLOG-424 — APPROVED

405 gave every dino a private ritual keyed to its most-pronounced trait, and 408/413/414 gave the keeper
three ways to catch one. In all of it, exactly one observer has ever known a dino paces: the player. 407 was
seeded to fix that by having a dino *watch* another mid-ritual, and it is unbuildable by construction —
405's `undisturbed` gate requires no company within `TIC_COMPANY_RANGE`, so a witness ends the thing it
would witness. The re-shape respects the gate instead of arguing with it: **nobody watches; the ground
remembers.** A dino that falls into its ritual scuffs the spot, and one that wanders across the mark while
it is fresh files a faint, *unnamed* trace.

The anonymity is the design and not a shortcut. "Someone was pacing here" is precisely as much as a patch of
trodden grass can honestly say, and it is what makes the beat buildable where 407 was not. What the park
gains is a first: **a place holding a memory of a dino**, where for 126 cycles memory has only ever run the
other way — a dino holding a memory of a place. The keepsake glance (347), the ground you miss (362), the
pioneer's footfall (343) are all a mind remembering a ground. This is a ground remembering a mind, and the
mind that reads it never learns whose.

The module is small and correct: one live mark per pacer (a re-invented ritual moves, it does not litter),
a freshness window measured in the same world-steps 405's solitude threshold counts in, zone-scoped, freshest
wins deterministically, and a dino never reads its own scuff. Transient by design like every other piece of
tic state, so no save touched. The once-per-trace guard keys on the *event* (`by:at`), not the tile — which
is why standing on a scuffed patch is one discovery rather than a tic of the finder's own. Given cycle 125's
lesson that a "no more than once" assertion cannot tell correct from never-happened, the e2e asserts exactly
one, then re-scans and asserts still exactly one.

Three limitations recorded rather than dressed up. The organic path — dino paces, leaves, another wanders
past inside 40 steps — is unit-proven and hook-proven but never *observed* end to end; that is 408's seam and
the same reason (a stray wanderer perturbs a real solitude count), but it is a gap. The memory is one fixed
line, so a curious dino reads the ground exactly like an incurious one — the obvious follow-up and a genuine
Living-minds gap in a milestone whose stated theme is a cast that doesn't blur. And the notice scan is the
first new per-step cast-wide scan since the food-web pairing; trivial at five dinos, worth remembering.

**Milestone 12 lore arc 2 ✅.**

---

## Follow-ups seeded for the Lore-smith / Structure-smith

- **Temperament in the trace read** (424 follow-up) — the finder's line should shade by who is reading it.
  The lore queue is far past its cap, so this is a note, not a new item, until the queue drains.
- **A branching lens** — the zone-map lens still draws the park as a list with the branch appended. That is
  honest and legible at five grounds; at two branches it will not be. Worth a Structure-track item the next
  time the queue dips below X=4.
- **BACKLOG-430** passed again in the full run, its second consecutive green. Still open. Whoever takes it
  should re-run the cycle-93 stash reproduction rather than trust the record.

## Milestone 12 status

Arc 2 of 3 closed on the lore track, arc 2 of 4 on the structure track. Remaining: **402** (the manner at the
hatch), **479** (more than one voice on the call), **480** (a landmark that has to be kept up).
