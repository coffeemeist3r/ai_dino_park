# Cycle 117 — Verdict

## Lore track — BACKLOG-470 (Word of how the ground decides) — **APPROVED**

The arc the milestone's title was actually promising. 469 gave governance a *voice*, but a private one: a
hungry mouth, speaking to the keeper, about its own hunger. That's a grievance. 470 is the beat that turns a
grievance into a *reputation* — the policy said by dinos who aren't hungry, to dinos who may not even live
on that ground. "The Grove feeds its own first" is a sentence about a place, not about a feeling, and it is
the first one this park has ever been able to pass around.

The build is the right kind of boring. `policyword.ts` is a deliberate sibling of `providerword.ts` — same
`{ store, rumor }` return, same `RUMOR_MARK` (so the 1-hop property comes free from the spine's existing
first-hand check rather than a new rule), same both-gates-in-the-module discipline so no caller can skip
them. The cascade rung slots between the provider word and the plenty word with the precedence reasoned in
a comment (a name beats a stance; both beat news of another ground) and the ticker else-if ladder kept in
lockstep, which that block's own comment demands. `null` policy → silent, which is 463's compatibility seam
honoured rather than re-invented: a ground that has decided nothing says nothing, instead of passing on a
default.

The judgement call worth marking is the one the Lore-smith made and the Coder pinned with a test: **no**
setter-exclusion rung. 453 silences a provider talking up its own pantry because a reputation is what
others say about you. A policy isn't a compliment — it's a public fact about a ground, and the dino who set
it is as entitled to state it as anyone. Getting that distinction right matters more than the line of code
it saves, and the test that pins it is the reason the next cycle to open this file won't copy 453's rule
across by reflex. 5/5 acceptance, +10 unit, +1 e2e. Clean ship.

## Structure track — BACKLOG-468 (The provider's read on the lens) — **APPROVED**

The cheapest arc of the milestone and the one that finally makes the other four legible at rest. The
handover beat (467) tells you the say changed *at the moment it changes* and then scrolls away; 469 and 470
tell you what a ground decided only if you happen to greet the right dino or catch the right meet. Until
tonight there was no way to simply *look*. Now the zone map — the lens built to answer exactly this class of
question about a ground — closes its tier line with 🍽️ or 🏦, and the whole chain's governance reads side
by side in one glance.

The implementation is exactly as small as it should be: a glyph function beside the type it reads (the
`declineGlyph` / `GRANARY_GLYPH` placement rule), a ninth **optional** column on `zoneMapModel` (the
back-compat discipline every prior column used, with the guard test filed next to its neighbours), a
`zoneSpends()` that is a three-line twin of `decliningZones()`, and an append to the *existing* tier line so
`boxH` never moves and a policy-less park draws a byte-identical box. No new state, no new derivation, no
save change — the lens reads the same `spendPriorityFor` the two 463 hooks read, so what the player sees is
provably what the sim is running on (the e2e asserts exactly that equality rather than a hardcoded value).
5/5 acceptance, +5 unit +1 back-compat guard, +1 e2e. Clean ship.

## QA's honest note, accepted

QA declined to claim pixel coverage of the drawn Phaser label and said so rather than papering over it: the
`mapLabels` `Text` objects expose no hook, so criterion 4 rests on diff-reading a one-line template append
over an asserted model — the same route 454's 🏛️ and 460's ⬇ took when they added their markers. A browser
screenshot was attempted and abandoned because the preview pane wasn't compositing frames. Adding a
`__mapLabels()` hook solely to pin a template append is more surface than the risk warrants; the Validator
agrees with both the call and, more importantly, with reporting it. Not a REWORK condition.

## Quality bar
Build clean · `npx vitest run` **1404/1404** (+15) · `npx playwright test` **399/399** (+2, full parallel
run, no flake this pass — second cycle running fully green) · `@mlc-ai/web-llm` only under `game/src/ai/` ·
**no save-envelope change on either track**, the first cycle of Milestone 9 where that was true and the
design made it an assertion rather than an afterthought.

## Milestone 9
Both arcs checked in `studio/MILESTONE.md` (lore 470 ✅, structure 468 ✅). **The structure track of
Milestone 9 is closed** — 468 was its second and last. One arc remains in the whole milestone: lore
**BACKLOG-471** (the grumble reaches the keeper). Milestone stays ACTIVE; next cycle can ship it and declare
M9 SHIPPED.

## State
`currentItem` BACKLOG-470 + `structureItem` BACKLOG-468 both resolved APPROVED → cycle closes clean; next
run bumps to 118. No REWORK, no ABANDON.
