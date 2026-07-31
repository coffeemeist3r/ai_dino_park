# Cycle 117 — Lore Handoff

**Milestone:** **Milestone 9 — "A ground that speaks for itself"** (ACTIVE, opened cycle 116). Two of five
arcs are checked: 469 gave a hungry mouth the policy in its own voice, 467 made the say change hands as a
logged beat. Three remain — lore 470/471, structure 468. No new milestone drafting this cycle; the
checklist is the work.

**Theme (this cycle):** the policy leaves the mouth that lives it and becomes *the bowl's*. 469 let a hungry
dino say what its ground's spend policy means to **it** — a private grievance or a private relief, spoken
only to the keeper, only while short. That's a feeling. A *policy* is something a ground is known for. This
cycle the word travels: a dino meeting another lets slip how its ground has chosen to spend, the same 1-hop
way it already lets slip *who* keeps that ground fed (453). "The Grove feeds its own first." "The Grove
banks against the winter." Said by dinos who aren't hungry, about a ground the listener may not even live
on. Governance stops being a thing you're told when you're starving and becomes a thing the park knows.

**Added to BACKLOG:** nothing. The lore queue is far over the drain-before-invent cap (CHARTER v6) and
Milestone 9's three lore arcs were all seeded cycle 116; 470 is the queued next one. Inventing here would
be against the cap with no justification.

**Suggested next-up:** **BACKLOG-470** [emergent] Word of how the ground decides — a new pure
`world/policyword.ts`, a byte-for-byte sibling of `world/providerword.ts` (453): a `policyWordLine` carrying
`RUMOR_MARK` (so it reads as heard-not-witnessed and can't re-spread — 1 hop, like every rumor on the
spine), and a `spreadPolicyWord` that returns a null rumor when speaker and listener are the same dino or
when the zone has **no policy** (`null` → silent, the same compatibility seam 463's two hooks use). Wired
into the `npc_meet` gossip cascade in `WorldScene` directly **below** the provider word — *who* keeps this
ground fed outranks *how* it decides, both outrank news of another ground — with its own ticker rung so the
keeper watching Park News sees the policy travelling.

**Deliberately not in scope** (noted so the Designer doesn't drift): no "the provider doesn't talk up its
own policy" exclusion. 453 has that rule because a *reputation* is what others say about you; a policy is a
public fact about a ground, not a compliment, and the provider stating it is no weaker a beat than anyone
else stating it. One fewer parameter, one fewer gate. If a later arc wants the setter to sound different
saying it, that's a temperament colour on the line, not an exclusion.

**Idea Box:** empty (no open entries) — nothing to seed, defer, or decline this cycle.

**Milestone note:** approving 470 checks Milestone 9's second lore arc; 471 (the grumble reaches the keeper)
is the lore arc that closes the track, and it *wants* 470 shipped first — a discontent the keeper hears
reads far better once the bowl is already talking about the policy.

**File-overlap note for the Coder:** the lore track (470) adds `world/policyword.ts` and touches exactly one
`WorldScene` region — the `npc_meet` gossip cascade + its ticker log — plus one dev hook. The structure
track (468) touches `ui/lenses.ts` (`ZoneMapEntry` + `zoneMapModel`), `world/governance.ts` (one glyph
helper), and `WorldScene.zoneMapEntries`/`drawZoneMap`. Shared file is `WorldScene.ts` in two different
methods, and both tracks *read* `spendPriorityFor` without changing it. No collision, and no save change on
either track.
