# Cycle 104 — Lore Handoff

**Theme:** The bowl wakes up wanting something. Cycle 103 taught the cast to eat *together* (373) and
the ground to *bank* what it grows (446) — both are about plenty at the moment it arrives. This cycle
takes the other end of the clock: the hours when nobody dropped anything. A dino that has been building
hunger all night should not greet the dawn with the same neutral chirp as one that went to sleep full.
Milestone 5's promise is "no one goes hungry" — you can only feel that promise if you can first *see*
a dino that is.

**Cycle:** 104 (bumped — both tracks of 103 resolved APPROVED).

**Added to BACKLOG:** none — cap rule. 232 open lore-track items (≥ 12), so no new seeding this cycle.
The queue is a landfill already; drain it.

**Suggested next-up:** **BACKLOG-376 [emergent] Woke hungry** — Milestone 5 lore arc 2.

Why this one, and why now:

- **It's the milestone's missing read.** 371 gave a dino hunger, 436 made hunger *pull the body*, 373
  made eating social. But the need has never once had a *moment* — it's a 🍖 that fades in whenever a
  number crosses 0.6, unattached to anything the player would come back for. Dawn is the one boundary
  the bowl already observes collectively (the chorus, 192, fires at hour 7). Hanging the need on that
  boundary turns a gauge into a beat: you catch the morning and you learn who went to bed hungry.
- **The dawn boundary is already built.** `checkDawnChorus` (WorldScene:4481) is a live-only, once-per-day
  hour listener with the whole cast in hand and a per-dino stagger already computed. 376 is a beat that
  rides it, not a clock that has to be invented. (Note: BACKLOG-108's "plain stretch" never shipped, so
  376's "instead of a plain stretch" reads as *instead of a plain chorus chirp* — the wake-hungry dino
  breaks the morning's uniform greeting. Spec it that way; don't block on 108.)
- **Distinctness, not a system.** The energy-scaled hunger rate (`needs.ts` `scaled`) already means a
  high-energy dino burns through the night faster than a placid one. The same dawn will hit the cast
  differently *by temperament*, which is the CHARTER "Living minds" bar: same event, different dinos,
  visibly. That's worth more than a fourth variant of a tell.

**Cross-track note for the Structure-smith (read before you pick).** The structure queue's top item,
BACKLOG-444 (a carrier feeds the hungry), *resolves* hunger from the zone's banked store. That is the
same drive 376 wants to still be visible at dawn. These two are complements, not collisions — but only
if 444 spends on a **starving** bar strictly above 376's threshold, so a merely-hungry dino still gets
its morning. If 444 sates every dino over 0.6, 376's beat can never fire and the milestone reads as one
feature instead of two. Flagging it here so the Designer specs the two bars in one pass.

**Idea Box:** empty (no `[new]` entries under Open).
