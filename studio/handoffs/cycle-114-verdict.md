# Cycle 114 — Verdict

## Lore track — BACKLOG-178: Migrating warmth

**Verdict:** APPROVED
**Item:** BACKLOG-178

**Rationale:** The year now grips the bowl's *daytime* social density, the clean twin of the seasonal den
(171) and the social mirror of 461's `seasonGrip`. A pure `seasonSocialBias` (winter 1.4, summer 0.7,
spring/fall 1.0) feeds `seasonalSocializeChance`, clamped to the same `[0.05, 0.95]` band the intent roll
already uses, so winter tightens the drift-to-the-cluster odds and summer loosens them without ever pegging
or freezing the roll. Spring is exactly 1.0, so the default season is byte-identical to every prior build —
the huddle/season specs are all green. Logic stays in `seasons.ts` (pure, unit-pinned); WorldScene's change
is one call-site substitution plus a dev hook. No new save state (derived from the clock), NPCBrain untouched,
no scope creep. All 6 acceptance criteria PASS.

## Structure track — BACKLOG-462: Spoilage while you're away

**Verdict:** APPROVED
**Item:** BACKLOG-462

**Rationale:** This closes the honest gap 455 left: its live `onHour` spoilage never fired on a restore/away
`clock.set`, so a hoard walked away from survived a long absence untouched. `spoilFoodOverDays` applies the
elapsed in-game days of the same capped, self-limiting `spoilFood` decay in one deterministic call (an
early-out at the floor bounds the loop and guarantees even a 7-day cap can't over-spoil). `applyAwaySpoilage`
folds it into both the real restore path (after `syncSeason`, so it reads the restored day's granary- and
season-aware cap/margin — 461's grip carries into the catch-up) and the `__catchUp` dev hook, re-arming
`lastSpoilDay` so the first live hour doesn't double-decay. Every lost unit reads in the homecoming digest via
the reused `spoiledLine` — no silent change. The live path and its once-per-day guard are untouched; additive
save (spoilage reads the already-persisted piles). All 7 acceptance criteria PASS.

## Suite

Build clean · unit **1353/1353** · e2e **391/392**. The lone red — `cycle-076-news-pull` — is the catalogued
BACKLOG-456 parallel-load flake (homesick `pickMigrant` picks with `Math.random()`), **off this cycle's diff**
and **green isolated on re-run**. Not a regression.

## Milestone

Milestone 8 "The seasons bite": lore arc **Migrating warmth (178) ✅**, structure arc **Spoilage while you're
away (462) ✅**. Remaining: lore arc **Spring thaw relief (215)**. Four of five arcs closed — the milestone
stays **ACTIVE**; 215 is the close-out next cycle.
