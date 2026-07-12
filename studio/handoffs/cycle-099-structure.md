# Cycle 099 — Structure-smith handoff

## Structure-track pick — BACKLOG-433 "Per-zone harvest tally reads on its own"

The last **structure** arc of Milestone 3. Closing it alongside the lore pick (367) ships the milestone.

**True remaining scope (important — most of the data already exists).** BACKLOG-428 (cycle 96) already
split the harvest count per zone: `harvestedByZone` is tracked at each harvest, persisted additively, and
folded into each zone's **prosperity tier** via `zoneSignals().harvested`. So the *index* half of 433 is
done. What is **not** done — and what 433 asks for — is that "each zone's farming output **reads on its
own**": right now a zone's harvest is only ever visible *blended into* the prosperity badge (pile +
structures + heads + harvest → one ○/◐/● tier). You cannot look at the map and see a zone's farming
signal by itself.

So 433 = **surface the per-zone harvest count directly on the map lens** (BACKLOG-425), beside the tier:
a `🌾N` read per zone box. The global `this.harvested` becomes purely legacy (the `__harvested` hook +
save field stay for back-compat); the player-facing number is per zone. Small, additive, no new plumbing.

- `lenses.ts`: `ZoneMapEntry` gains `harvested: number`; `zoneMapModel` takes an optional
  `harvests: Record<string, number>` (default `{}`, so older 3/4-arg callers/tests stay valid).
- `WorldScene.drawZoneMap`: pass `this.harvestedByZone`, render `🌾N` on the badge line.

**Acceptance:** harvest a zone's ripe plot → that zone's map box shows `🌾1`, its neighbours `🌾0`;
harvesting a *different* zone bumps only that box; the read survives save→reload; a fresh save reads
`🌾0` everywhere. No prosperity-tier regression (the tier still folds harvest in as before).

## Queue hygiene (drain-before-invent, cap X=4)

Structure Track fell to **3 open** (433 / 435 / 436), and 435 folds into the lore arc this cycle — so
after this cycle only 436 would remain (1 open, below cap). Refilling with two forward beats the food web
and per-zone economy now open (Milestone 4 will re-anchor them next cycle):

- **BACKLOG-437 [core] Meat drops from a carnivore's own take** — the food web (367) is a chase with no
  payoff: a hunt that "comes up empty" never yields meat. Give a *successful* stalk (a design knob:
  occasional, deathless — the prey escapes but drops a scrap, or the carnivore forages carrion) a small
  meat FOODS drop the carnivore eats, so hunger (371) actually resolves through hunting, not only the
  hatch. The meat half of the diet economy (435). Builds on 367 / 435 / 059.
- **BACKLOG-438 [emergent] A zone wants what it can't grow** — each zone farms one crop (418/432) and now
  its harvest reads on its own (433); make that a *want*: a zone light on a food kind its own plot can't
  grow biases its carry-request toward a neighbour that can (the flow rule 429, keyed to farming output).
  The demand half of "enough to go around." Builds on 433 / 429 / 435.

## Cross-track check

433 touches `lenses.ts` + `drawZoneMap` (map lens); 367 touches `foodweb.ts`/`diet.ts`/`foods.ts` +
`forceStep` (movement). **File-disjoint** — no collision. Handing both to the Designer.
