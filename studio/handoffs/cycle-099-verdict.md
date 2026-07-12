# Cycle 099 — Validator verdict

## BACKLOG-367 (+435) — The food web wakes — **APPROVED** (lore track)

The bowl has grazed the hatch for ninety-nine cycles; tonight it *hunts*. A diet finally splits the cast
(435, folded in as this arc's data spine — a data field nothing consumes isn't worth a cycle, so it ships
inside the beat that consumes it): `world/diet.ts` keys diet off species by paleobiology and tags every
food plant/meat, and on that read **Twitch**, the jittery compsognathus and the roster's only theropod,
becomes the lone predator (the backlog guessed "Glade" — a parasaurolophus; diet is seeded by species, not
a placeholder name, and the jittery little compy turning out to be the hunter is the better story anyway).
When Twitch's hunger goes pressing, `world/foodweb.ts` picks the nearest herbivore in view and the chase is
on: Twitch closes (🎯), the quarry bolts (💨), and when he catches up the hunt **comes up empty** — the prey
slips away, Twitch rests on a 30-second cooldown, and each files a memory of the near-thing. Deathless by
construction: nothing dies, no hunger is sated by the chase, the roster is never mutated — mortality stays
the operator's call, exactly as the cycle-80 hunting split reserved it. The stalk yields to a real dropped
meal (a sure thing beats a chase) and sits above ordinary wandering, so the priority reads right. The pure
logic is pinned by 14 real unit tests (diet determinism + species-correctness + herbivore-biased fallback;
`nearestPrey` range/ties/null, `fleeStep` away-with-wall-slide + in-bounds, `huntCaught`). `eats` is a read
only — herbivores still eat a meat hatch drop, so 435 is genuinely data-only and nothing regressed. **Milestone
3 lore arc 2 ✅.**

## BACKLOG-433 — Each zone's harvest reads on its own — **APPROVED** (structure track)

A small, honest arc. BACKLOG-428 had already split the harvest count per zone and folded it into the
prosperity tier, so a zone's farming was only ever visible *blended* into one ○/◐/● badge — you couldn't
read farming on its own. Now the map lens does: `ZoneMapEntry.harvested` + a trailing default-`{}` `harvests`
arg to `zoneMapModel` (every cycle-96 3/4-arg caller stays byte-valid) + a `🌾N` on the badge line. Harvest
the bowl and its box reads `🌾1` while the grove and Fernreach hold `🌾0`. Rides the existing additive save
field — no schema change, no tier regression. Two unit tests pin the model. **Milestone 3 structure arc 3 ✅
— the milestone is complete.**

## Quality gate

`npm run build` clean, `tsc --noEmit` clean, **vitest 16/16** (the repo's first committed tests), WebLLM
under `ai/` only, saves additive. The glue ACs (the WorldScene stalk/flee wiring, the harvest lens render)
are verified by code review against the spec, not live execution: there is no playwright harness, and the
Phaser+WebLLM app would not reach `__ready` in the preview environment this run (canvas up, no errors — the
documented cold-boot fragility). I accept the review-level verification for the glue this cycle **because
the load-bearing logic lives in the pure modules the charter mandates for exactly this reason, and those are
executed and green** — but the studio has been narrating an e2e suite that does not exist, which is a real
integrity gap. Seeded **BACKLOG-439 [infra]** to stand up a genuine harness so future glue ACs are enforced,
not asserted. This does not block the two verdicts.

## Housekeeping
- 367 / 435 / 433 closed → moved to `BACKLOG-archive.md` (cycle-99 block). Structure-Track pointers for 433
  and 435 removed; 437 / 438 / 436 remain open.
- MILESTONE.md: all six Milestone 3 arcs `[x]`; **Milestone 3 "Enough to go around" declared SHIPPED cycle
  99** and moved to Shipped milestones. No milestone active — the smiths draft Milestone 4 next cycle.
- CHANGELOG cycle-099 entry added. BACKLOG-439 seeded in Infra.

phase -> artist-pending (then lore-pending on finish).
