# Cycle 137 — Structure Handoff

**Intent:** Take the milestone's headline structure arc — *a vote that answers to a history* — and,
per CHARTER v7, ship the founding-state change that makes it reachable in the same fire. BACKLOG-492
is the sharpest item on the track: since 481 and 487 a ground's **both** calls are decided by its
council, and every seat votes a hard threshold on a **single name-seeded axis**, so a council is
unanimous by construction and nothing that happens in the park can ever turn one. A ground can starve,
lose its granary and reseat three times, and its politics are the arithmetic of birth-numbers.

**The v7 problem, stated up front so the Designer cannot skip it.** 492's own text promises that "an
unlived (fresh-save) council is bit-identical to today's". That was written before v7 and it is now a
REWORK sentence twice over. Worse: on a fresh save **no ground seats a council at all** —
`zoneCouncil` needs `foodBanked ≥ COUNCIL_MIN_BANKS` and the founding cast has banked nothing, so the
entire governance system the park has spent seven cycles on is unreachable from boot. That is exactly
`TILES_PER_HEAD` again, and the charter's corollary names it a defect: *the founding state must
exercise the systems the park has built.* So this item ships in two halves that must land together —
the shading, and **a founding park whose Grove actually seats somebody.**

The Grove is the right ground for it: two residents (Bramble, Pip) → `councilSeats(2,·) = 1`, a
one-seat council with no tie to break, and Pip's agreeableness is **0.522** — twenty-two thousandths
above the pantry call's threshold. A seat that close to the line is a seat whose ballot a lived
nudge can actually turn, in both directions, inside a ten-minute session.

**Added to Structure Track:** BACKLOG-497 — the queue stood at **3 open** (489, 492, 495), under X=4,
so one new item was brainstormed before picking.

- BACKLOG-497 [infra] The council nobody can convene — `zoneCouncil`'s eligibility, `councilSeats`'
  one-per-two-heads divisor and `COUNCIL_MIN_BANKS` were each calibrated against a five-dino bowl and
  are now read by two votes, a term, a turnover beat and two lens glyphs, with no single place that
  states what population the governance system is *designed* to be observable at. Fold the three
  constants and their founding-reachability claim into one documented seam with a test that asserts
  the shipping park seats a council at boot — the `founding.ts` precedent, applied to politics.

**Chosen this cycle:** **BACKLOG-492** — a vote that answers to a history, plus the founding banked
tallies that let the Grove hold one.

**Collision check:** the Lore-smith's pick (422) lives in `world/tic.ts` + the greet path in
`WorldScene`; this lives in `world/governance.ts` + the two `*PriorityFor` readers + `world/founding.ts`.
No shared file but `WorldScene`, which every cycle shares. Clean.
