# Cycle 112 — Structure handoff

## Structure pick — BACKLOG-460 [core] The draining zone

**Milestone-advancing (the closer).** Milestone 7 "The economy has weight" has one open arc; this
is it. The verdict of cycle 111 named it explicitly: *"Next cycle's Structure-smith should pick 460
to close it out."* Shipping 460 declares Milestone 7 SHIPPED.

**The gap it closes.** 450 moves mouths toward plenty and empties the poorest zone first — but the
migration bias re-reads prosperity *fresh every roll*, so a hollowing zone never gains momentum and
an exodus never reads *as* one. A zone that has lost half its residents pulls on the remaining ones
exactly as hard as a stable zone would. Plenty pushes; want does not yet *compound*.

**What 460 adds (three pieces, all deathless):**
1. **A declining read.** Track each zone's population high-water mark (a live per-zone peak, bumped
   on the migrate cadence). A zone whose current head count has fallen below its own peak reads
   **declining** — a ⬇ on the map lens beside the prosperity tier. The exodus becomes legible.
2. **Harder lean to leave.** A *settled* resident of a declining zone resists the ambient wander
   less than a stable zone's resident (a lower migrate-damp), so a thinning zone holds its people
   more weakly and the exodus gains momentum instead of re-levelling each roll.
3. **A floor that never lets it vanish.** The ambient wander never drains a zone below its last
   resident (`ZONE_FLOOR = 1`), and the harder-lean bias only applies while `heads > ZONE_FLOOR`
   — so a zone can thin all the way to one and hold there, but never empties to a ghost town.
   Deathless by construction (CHARTER: mortality stays an operator call).

**Cap rule check:** the structure queue holds 4 open items (460/461/462/463) — at cap X=4, so the
Structure-smith **does not invent** this cycle (drain before invent). 460 is picked off the top.

**Reuse (no new bias math):** `world/prosperity.ts` (`zoneProsperity`/tier), `world/scarcity.ts`
(the appeal fold), `world/belonging.ts` (`resistsMigration`/`isSettled`/`SETTLED_MIGRATE_DAMP`),
`world/zones.ts` (`zonePopulations`/`zoneChain`), and the `ui/lenses.ts` `zoneMapModel` seam that
457/446/454 all extended. The new `world/decline.ts` is a pure fold + read, unit-tested; WorldScene
tracks peaks on the existing `maybeMigrate` cadence and threads the declining read into the resist
gate and the lens model.

**Pairs with lore 464** (Last one standing) — 464 reuses this arc's `isDeclining` + peak read to
sound the wistful beat over the single resident the floor keeps behind. Build **structure (460)
first** so 464 lands on the finished `decline.ts`.

`state.structureItem = BACKLOG-460`.
