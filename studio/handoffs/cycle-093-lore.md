# Cycle 93 — Lore Handoff

**Theme:** Home ground. Milestone 1 ("Minds of their own") shipped last cycle — every dino
now has a persona, a day with a shape, and a save that can grow. Milestone 2 opens the natural
next question: those minds live *somewhere*. The three-zone chain (bowl / grove / Fernreach)
is legible as a map (425) but every zone still feels like the same grass under a different
tint, and a dino wanders between them on a blind coin-flip (274/333). Milestone 2 —
**"Places to belong"** — makes the chain three distinct homes and lets a dino start to *belong*
to one.

**Milestone drafted:** Milestone 2 is now ACTIVE (opened cycle 93) in `studio/MILESTONE.md`.
Three lore arcs (belonging/distinctness — the Lore-smith's lane) and three structure arcs
(distinct-place economy — the Structure-smith's lane), a 3+3 shape mirroring Milestone 1.

**Suggested next-up (lore):** **BACKLOG-341** — the home-zone lean, this milestone's first
lore arc. Reshaped from its grove-specific text ("prefers the grove") to the general spine:
a dino that has *resided in its current zone long enough* forms an attachment to it — it
**settles**, and a settled dino resists the ambient migration roll (274/333) that would
otherwise drift it away on a coin-flip. Where a dino belongs stops being a per-roll accident
and starts to *mean* something. The payoff is player-visible: the collection book reads
"at home in The Fernreach" once a dino has settled, so home becomes a legible standing like
role and quirk already are. Deterministic core (tenure counted in real-time migration rolls,
a threshold, a damped resist), persisted additively (a new `tenure` save field, undefined-when-
absent so old saves settle from scratch), the pure logic in a new `world/belonging.ts` and the
scene glue thin. It's the mechanic the other two lore arcs need: the departed-friend tic (414)
and homesickness (340) both presuppose a dino that *has* a home to ache for.

**Added to BACKLOG:** none — v6 drain-before-invent cap in force (247+ open lore items ≥ the
X=12 floor). 341/414/340 are all already queued; the milestone threads existing items.

**Milestone:** ACTIVE (Milestone 2 — "Places to belong", 0/6 → this pick is lore arc 1).
Paired with the structure track (417, the Fernreach's own thatch landmark), cycle 93 opens
both halves of the milestone in the same fire — the chain gains its third distinct *skyline*
and its dinos gain a reason to *stay*.

**Idea Box:** empty (Open section clear).
