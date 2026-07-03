# Cycle 89 — Verdict

## Lore track — BACKLOG-413 Fond of being caught

**Verdict:** APPROVED
**Item:** BACKLOG-413 [social]

**Rationale:** All seven acceptance criteria PASS; build clean, 936 unit green, the new e2e green in the full run.
The beat does exactly what it should: the catch that shipped last cycle (408) stops being uniform. Greet a dino
you barely know deep in its ritual and it's still sheepish (😳, the bashful frame) — but greet one that *loves*
you (hearts ≥ `FOND_MIN`, the same close-friend floor the fond greeting 272 already uses) and it's delighted
instead (😊), leading with a warm opener and filing a glad memory rather than an embarrassed one. It reuses the
entire 408 machinery — the fork is only which glyph, which deterministic opener, and which memory text — so the
`NPCBrain` boundary stays intact (the frame wraps whatever the brain or stub returned; the model is never asked to
be fond) and it tests headless. Kept honest: a non-fond catch and a not-mid-tic greet are byte-identical to before,
the caught-once guard is unchanged, and no affinity delta or bond moves — 413 only colours the line and files one
memory. `world/tic.ts`'s new `FOND_MIN` import reaches only the pure `ai/brain` interface; no boundary breach.

## Structure track — BACKLOG-384 Resource regrowth

**Verdict:** APPROVED
**Item:** BACKLOG-384 [emergent]

**Rationale:** All seven acceptance criteria PASS. The gather economy is no longer infinite. Each zone carries a
*yield* (fertility 0..1, starting full) that a pickup thins (`depleteYield`, ~3 back-to-back gathers empty it) and
each spawn-roll tick slowly restores (`regrowYield`, capped at full), and the per-zone spawn chance is scaled by it
(`yieldSpawnChance = RESOURCE_SPAWN_CHANCE × yield`) — so a hard-worked zone spawns rarer until it rests, and a
fully exhausted one goes quiet until it regrows. This is the first renewable constraint and the real economic
reason carry/barter between a worked-out and a fresh zone (329/356/358) has been reaching for. The discipline held:
a full zone spawns at exactly the old rate, so an unworked zone is pre-384 byte-identical (the cycle-062/078/088
resource specs are the pins), and the new logic is one pure module (`world/regrowth.ts`) plus a per-zone field,
a regrow+scaled-roll in `maybeSpawnResource`, a deplete in `checkGather`, and a `__yield` dev hook. Yield is
transient by design — a reload restarts each zone fresh-full — so there is **no save-format change** and no version
bump. The e2e drives a *real* gather (spawn-on-dino + one world step) and watches the bowl's yield fall below full;
depletion isn't just unit-tested in the abstract, it's proven through the live path. No regressions in the diff.

## Suite

Build ✅ · 936 unit ✅ (+8: 3 fond-caught + 5 regrowth) · e2e **280 passed**, 1 parallel-run failure
(`cycle-028-realtime`) green 2/2 isolated = the catalogued cold-boot flake, not touching this diff. Both new specs
(`cycle-089-fond-caught`, `cycle-089-regrowth`) green in the full run. `@mlc-ai/web-llm` boundary clean. No
save-format change either track.

Both tracks APPROVED → cycle 89 closes; `phase = lore-pending`; Lore-smith bumps to 90 next run.
