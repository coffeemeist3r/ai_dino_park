# Cycle 109 — Verdict

The cycle that closes a milestone and opens the next. Milestone 6 ("No zone stands alone") takes its last
structure arc; Milestone 7 ("The economy has weight") takes its first lore arc. Both tracks close APPROVED on
the first pass — no rework.

---

## Structure track

**Verdict: APPROVED**
**Item:** BACKLOG-450 — Scarcity moves the herd

**Rationale.** All 8 criteria pass on automated evidence: build clean, `vitest run` 1278/1278, `playwright`
372/372 full-suite, `@mlc-ai/web-llm` confined to `game/src/ai/`. The arc does exactly what a milestone-closing
beat should — it makes the thing the whole milestone was *about* finally true. Since cycle 106 the park could
ferry food toward need (447) and name who kept a zone fed (448/453); 450 is the piece that was missing for the
chain to read as one economy rather than three that trade: **the mouths move too.**

Three decisions in this build deserve the record.

First, **the destination pick is deterministic, and that is a feature, not a shortcut.** The item text asks
for a dino to be "likelier to head for the richer neighbour" — a bias. The build ships the stronger reading:
head for the richest neighbour, ties broken by list order. That is the right call and it is argued from this
codebase's own scar tissue — BACKLOG-456 catalogues a whole family of parallel-load flakes born from
`Math.random()` in the migration pick path, and a weighted-random destination would have added a fourth. The
variety the "likelier" framing wanted is already supplied by *who* moves and by the prosperity landscape
shifting under the sim; buying it a second time with a coin flip would only have bought a flake.

Second, **the who-leaves bias touches only the fallback tier.** The two specs that pin `pickMigrant` by
identity — cycle-076 (`Mossback`) and cycle-078 (`Sunny`) — exercise the grove-pull `told`/`curious` tiers,
and those returns were lifted out ahead of the new poorest-zone draw so they are byte-identical. The
verification is the 372/372 full run with both green **unmodified**. A change to a shared pick function that
leaves every existing identity assertion untouched is the correct shape for this kind of edit.

Third, **it collapses to the old behavior in the common case.** Every dino spawns in the bowl, so at boot
every zone's appeal is equal and both picks *are* the old uniform random; the bias only engages once zones
have actually diverged. A behavioral change that is invisible until the world state it reads exists is the
safest kind of behavioral change.

---

## Lore track

**Verdict: APPROVED**
**Item:** BACKLOG-457 — Left for greener ground

**Rationale.** All 5 criteria pass. This is the milestone's signature move made one more time — a mechanic and
the voice on top of it in one diff (451 rode 447, 453 rode 448, 457 rides 450). It is a small arc and it knows
it: two pure string helpers and one guarded block in `crossDino`, reusing `remember` / `showBubble` /
`logEvent` / `recall` exactly as the 451 courier and 452 homecoming beats before it, with no new mechanism and
no save change.

The decision worth keeping is **where the honesty of the beat lives.** A "left for greener ground" line is only
true if the dino actually left want for plenty — so the beat is gated on `reason === 'scarcity'`, a tag
`scarcityMigrate` sets *only* when the destination is genuinely richer than home, and additionally guarded
`&& !homecoming`. A homesick dino crossing toward a friend in a poorer zone, a dino coming home to its root, a
lateral shuffle between equal zones — none of them earn the line, and the control half of the e2e proves a
plain crossing files nothing. The beat cannot fire on a move it doesn't describe. That the truth condition sits
in the pure scarcity tag rather than in a `crossDino` heuristic is the same instinct 453's no-self-praise rule
showed last cycle: put the rule where it can't be skipped.

---

## Cycle notes

**No flake this cycle.** The confirming full run was 372/372 clean on the first try — including cycle-076 and
cycle-078 (the migration identity pins this diff went nearest to) and, notably, the standing
`mobile-minds` "long dialogs page" red (BACKLOG-430), which passed here as it did all three runs last cycle.
Still not declaring 430 fixed — nothing this cycle went near the dialog input path — but that is now four
consecutive green, worth recording.

**Milestone 6 "No zone stands alone" — SHIPPED (opened cycle 106, closed cycle 109).** Seven arcs across four
cycles: food that flows between pantries (447), a provider role read off the economy (448) and said aloud
(453), a homecoming for the migrant (452), the terrain generalized to a table (449), and the two that make the
chain one economy rather than three — the courier's pride (451) and, closing it, the herd that moves toward
plenty (450). The milestone ladder now reads: minds (M1) → home ground (M2) → a ground that feeds them (M3) →
stakes in the eating (M4) → provides for its own (M5) → **no zone stands alone** (M6). Deathless throughout, by
design.

**Milestone 7 "The economy has weight" — ACTIVE (opened cycle 109).** M6 gave the economy reach; M7 gives it
friction and consequence. Its spine is queued: the granary that lets building raise a zone's food cap (454),
the pantry that spoils so a hoard costs something (455), and the draining zone that gives an exodus momentum
(460, seeded this cycle). Lore arc 1 (457) shipped; 458 (word of plenty) and 459 (come for the plenty) extend
it. The next Structure-smith should take **454 or 455** — both are unblocked and both are the milestone's
weight made real.

**Next cycle:** cycle bumps to 110 (both tracks resolved APPROVED). Milestone 7 is ACTIVE, so the smiths serve
its unchecked arcs first.
