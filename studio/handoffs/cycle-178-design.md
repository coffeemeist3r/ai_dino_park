# Cycle 178 — Design

Milestone 26 (TENTPOLE): minds that act and reflect. Both tracks serve it.

## Lore track — BACKLOG-582

**Item:** BACKLOG-582 — whom a mind goes looking for (first slice of 104).

**Why this cycle:** when a dino drifts toward company today it walks to `nearestOther` — geometry, not a choice. The
tentpole's headline is "two dinos in the same circumstances make different days"; the cheapest true version of that is
a mind deciding *whom* it walks to, for a reason that reads off who it is.

**What ships:**
- New pure module `game/src/ai/companion.ts`. `chooseCompanion(self, mates, ctx)` → `{ name, why } | null`, where
  `why ∈ 'rival' | 'stranger' | 'yesterday' | 'friend'`, decided in this order:
  1. **rival** — prickly (`agreeableness < 0.35`) and a zone-mate it holds a grudge ≥ `RIVAL_BAR` against → the worst one.
  2. **stranger** — curious (`curiosity ≥ 0.6`) → the zone-mate it has met least (ties: lower bond, then name).
  3. **yesterday** — its reflection's `best` (583) is a zone-mate → that one.
  4. **friend** — its warmest zone-mate bond above 0.
  5. otherwise `null` (falls back to the nearest dino, the old behaviour).
- Chosen once per day-phase (with the phase intent in `ensureIntent`); recomputed when the phase turns.
- The socialize roll's *probability* is unchanged. When it fires, a dino with a companion still on its ground steps
  toward the companion instead of `nearestOther`.
- When a choice is new (differs from the dino's previous pick): a 👀 mark over the seeker (`popMark`, in view only;
  `SEEK_ART_KEY = 'seek'`, BACKLOG-584 draws it) and a ticker line in its reason's voice
  (`Mossback goes looking for Twitch — spoiling for it.`).
- Book: a `seeking: Twitch (spoiling for it)` line on the seeker's row.
- Arrival: the first time in a phase the seeker is adjacent to its companion (same ground), it says a line in a bubble
  (`You again, Twitch.` / `Don't think we've met properly, Glade.` / `Rex! Same again?` / `There you are, Sunny.`).

**Acceptance criteria:**
- [ ] Unit: on the founding bowl, `chooseCompanion` picks Twitch for Mossback (`rival`), a least-met stranger for Rex
      (`stranger`), Rex for Sunny (`yesterday`, founding reflection), and differs between at least three bowl dinos.
- [ ] Unit: only zone-mates are ever chosen; no candidates → `null`.
- [ ] e2e: in a fresh save, `__seeking()` names a companion for Mossback (Twitch, `rival`) and the book row reads
      `seeking: Twitch`.
- [ ] e2e: forcing steps with a socializing roll moves the seeker toward its companion, not merely its nearest dino.
- [ ] e2e: the ticker carries a seek line within the first minute of a fresh save.
- [ ] Zero-model: everything above runs under the stub brain (headless CI).

**Out of scope:** the model choosing the companion (Milestone 26 structure arc 3); destinations other than a dino (arc 2).

**Constraints:** WorldScene glue stays thin; selection logic pure. Shares `ensureIntent`/`ensurePlan` with 583 — build
583's reflection first, then 582 reads it.

## Structure track — BACKLOG-583

**Item:** BACKLOG-583 — the dusk reflection (first slice of 014).

**Why this cycle:** the tentpole's second half — a day summed into a memory that shapes tomorrow — needs a record a
plan can read. `reflect()` is a string nobody reads.

**What ships:**
- New pure module `game/src/ai/reflection.ts`: `Reflection = { day, best: string | null, met: number }`;
  `reflectDay(name, day, meetingsNow, meetingsAtDawn, bonds)`; `foundingReflection(name, day, bonds, names)`;
  `planAfter(plan, reflection, traits, today)`; `reflectionLine(r)` (book); `reflectionMemory(r)` (ring);
  `duskLine(reflections)` (ticker).
- WorldScene snapshots the meetings ledger at boot and at each dawn crossing (hour 5); at the dusk crossing (hour 17,
  live `onHour` only) every dino files a reflection: `best` = the dino it met most since dawn (ties: bond, then name),
  `met` = its meetings since dawn. Each gets a memory line (`spent the day with Sunny` / `spent the day alone`), the
  ticker gets one dusk line, and a 💭 pops over in-view dinos.
- Tomorrow: `planAfter` turns a sociable (`sociability ≥ 0.5`) dino's `day` phase social when yesterday's `met` was 0.
  582's chooser seeks yesterday's `best` (rule 3).
- Founding: the `!save` branch (bonds not cleared) seeds a reflection for every dino with a founding friend
  (`best` = founding best friend, `met` = 1, `day = FOUNDING_DAY - 1`). Twitch, with nobody, gets none.
- Save: additive optional field `reflections` (name → Reflection). Malformed → reject; absent → `{}`.
- Book: `yesterday: spent it with Rex` / `yesterday: kept to itself`.

**Acceptance criteria:**
- [ ] Unit: `reflectDay` picks the most-met partner since the snapshot; a dino with no new meetings gets `best: null, met: 0`.
- [ ] Unit: `planAfter` leans `day` social only for a sociable dino whose yesterday was empty; an unsociable one is unchanged; a stale (older) reflection does nothing.
- [ ] Unit: save round-trips `reflections`; a malformed entry rejects; an old save without it loads.
- [ ] e2e: a fresh save's book shows `yesterday: spent it with Rex` for Sunny from frame one.
- [ ] e2e: setting the clock to just before 17:00 and letting it cross files new reflections (`__reflections()` day = today) and a dusk line reaches the ticker.

**Out of scope:** model-authored dusk lines (lore arc 2); retiring the old dawn `reflect()` string (left as is).

**Constraints:** `onHour` dusk listener is live-only, like every other day hook. Save additive only.
