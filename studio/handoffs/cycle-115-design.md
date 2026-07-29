# Cycle 115 — Design

Two tracks: lore **BACKLOG-215 (Spring thaw relief)** + structure **BACKLOG-463 (The provider's say)**.

---

## Lore track — BACKLOG-215: Spring thaw relief

### Item
BACKLOG-215 [social] Spring thaw relief — the season turning out of winter rewards the dinos that
toughed the cold nights.

### Why this cycle
It is the last unchecked Milestone 8 lore arc (`MILESTONE.md`). Four cycles of the year *taking*
(cold voice, lean pantry, tightened herd, away-spoilage); 215 is the calendar finally giving back,
and shipping it closes the milestone. It reuses the cold arc (179/208) and the season-turn beat (159)
already in the tree — a tight, playable close-out.

### What ships
On the in-game season turn **out of winter** (winter → spring — the only way spring is reached on a
live tick), every dino that carries a **first-hand cold-night memory** (from 179's shiver or 208's
neglect — both begin "shivered…") gets, once:
- a **relieved bubble** floated over it (`🌱 <name> made it through the winter`),
- a one-off **friendship lift** toward the keeper (they weathered it under your watch),
- a filed **"made it through the winter 🌱" memory** that can colour its next greeting.
A dino the keeper *warmed* (184, memory "the keeper warmed me…", no "shivered") did not tough it out
alone and does not get the beat. A dino with no cold memory (slept warm all winter) gets nothing.
The beat fires at the turn moment only — naturally one-off per winter.

### Acceptance criteria
- [ ] `thawedThroughWinter(store, name)` returns true for a dino carrying a first-hand `coldMemory()` or `neglectMemory()`, false for one carrying only `warmMemory()`, and false for one with no cold memory.
- [ ] A dino carrying only a rumor-marked cold *word about someone else* is NOT counted (first-hand only).
- [ ] On a live winter→spring turn, each qualifying dino's friendship points rise by exactly `THAW_LIFT` and it files the "made it through the winter" memory; the event log shows `thawLine(name)`.
- [ ] A turn into any season other than spring fires no thaw relief.
- [ ] `npm run build` clean, full unit + e2e suite green, spring-default builds byte-identical (no thaw path touched outside the winter→spring turn).

### Out of scope
- The persisted hardy-nights tally (BACKLOG-186) — 215 reads the memory ring, not a counter.
- Any change to the cold-night/warming beats themselves (179/184/208).
- A spoken greeting line beyond the floated bubble + the filed memory (the memory already feeds the greeting context).

### Constraints
- Pure logic in a new `world/thaw.ts` (Node-testable); WorldScene glue thin, mirroring `cold.ts`/`spoilage.ts`.
- Must not disturb `checkSeasonTurn`'s existing turn beats (banner, grip line, turn memory).
- Provide a `__thawRelief` dev hook running the same pass the turn runs (mirror `__spoilFood`→`runSpoilage`) so e2e can drive it deterministically.
- No `@mlc-ai/web-llm` import. No new save state.

---

## Structure track — BACKLOG-463: The provider's say

### Item
BACKLOG-463 [emergent] The provider's say — one persistent, per-zone spend priority set by the
zone's provider, read by the pantry-spend and the granary auto-build gate.

### Why this cycle
The CHARTER's resources→crafting→building→**governance** arc has been stuck at *building* for a
milestone: a zone raises a granary (454) and crowns a provider (448), but no dino ever *decides*
anything for the ground. 463 is the first governance beat, foundation-first — one policy value, two
existing reads, no vote.

### What ships
A zone with a standing `provider` (448) gains a persistent **`SpendPriority`** — `'feed'`
(feed-the-hungry-first) or `'bank'` (bank-for-a-granary) — chosen from the provider's temperament:
a **warm** provider (`agreeableness ≥ 0.5`) feeds first; a **prickly** one banks. It is set on the
role cadence (each time the zone's provider is read) and persisted per zone; a departed provider's
policy lingers until a new provider re-sets it. Two hooks read it:
1. **Pantry-spend (444)** — a `'bank'` zone keeps a `BANK_RESERVE` (1) of each food id banked and
   spends on a starving resident only *above* the reserve; a `'feed'` zone spends down to zero (today's behavior).
2. **Granary auto-build (454)** — a `'feed'` zone defers putting up its granary while its food store
   is thin (`foodPileTotal < FEED_BUILD_FLOOR` = 4) — mouths before buildings; a `'bank'` zone builds
   as soon as resources allow (today's behavior).
A zone with **no provider** (the normal young-park state) has no policy → both hooks behave exactly
as today (compatibility seam, mirroring 461's neutral spring).

### Acceptance criteria
- [ ] `providerPriority(traits)` returns `'feed'` for `agreeableness ≥ 0.5`, `'bank'` below.
- [ ] `feedReserve('bank')` = `BANK_RESERVE`; `feedReserve('feed')` = 0; `feedReserve(null)` = 0.
- [ ] `granaryDeferredForFeeding('feed', total)` is true iff `total < FEED_BUILD_FLOOR`; false for `'bank'` and for `null` at any total.
- [ ] `pickFoodToSpend(pile, fav, reserve)` ignores ids at/below `reserve`; with `reserve` defaulted/0 it is byte-identical to today.
- [ ] In-game: a zone whose provider is prickly holds its last unit of a food id back from a starving resident (reserve); a zone whose provider is warm spends it. Exposed via `__spendPriority(zone)` dev hook (returns `'feed'`/`'bank'`/`null`).
- [ ] A zone with no provider returns `null` from `__spendPriority` and feeds/builds exactly as before (no regression in existing foodstore/granary specs).
- [ ] `npm run build` clean; full unit + e2e suite green.

### Out of scope
- Voting / quiet-hours governance (BACKLOG-031) — this is provider-set, not collective.
- The turnover beat (467) and the lens read (468) — queued follow-ups.
- Any change to how the provider role itself is derived (448/032).

### Constraints
- Pure logic in a new `world/governance.ts`; the only foodstore change is an **optional trailing
  `reserve` param** on `pickFoodToSpend` (default 0 → byte-identical).
- Persist `spendPriorityByZone` as one additive save field (absent → `{}`); restore tolerant.
- **Compatibility:** no provider → no policy → unchanged behavior. Verify the existing granary +
  foodstore e2e specs stay green (a provider emerging mid-spec must not silently block a build/spend
  the spec expects — if one does, that's the signal `FEED_BUILD_FLOOR`/reserve need the no-provider guard, which they have).

### Cross-track note
No shared source file with the lore track except the save envelope — both add one additive field
(`thaw.ts` adds none; governance adds `spendPriorityByZone`). Sequence the two save-field edits so
neither clobbers the other; thaw needs no save change, so the only new field is the governance one.
