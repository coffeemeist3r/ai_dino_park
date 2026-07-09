# Cycle 96 — Design

Two file-disjoint tracks. Lore = BACKLOG-410 (`world/tic.ts` + the tic driver in `WorldScene`). Structure = BACKLOG-428 (new `world/prosperity.ts` + `ui/lenses.ts` + the map-lens/harvest wiring in `WorldScene`). Shared file `WorldScene.ts`, but different methods (the `maybeWander` tic branch vs. the zone-map/harvest paths).

---

## Lore track — BACKLOG-410 Homesick sooner

**What it is.** A dino's signature tic (405) normally forms after `TIC_AFTER_STEPS` (20) undisturbed force-steps (a solitary-intent day already shortens it via `ticAfterFor`, 393). A dino freshly *moved alone into a friendless zone* — not yet settled (341) and with no bonded friend residing in its current zone — should fall into its tic **sooner**: isolation in an unfamiliar place reads quicker. Pure onset-threshold read; no new motion, no new save state.

**The read.** "Alone in a strange zone" = `!settled && !hasFriendInZone`, where:
- `settled` = `isSettled(tenureOf(tenure, name))` (belonging.ts, already tracked/persisted).
- `hasFriendInZone` = the dino has at least one bonded friend (pairwise bond ≥ `GRIEF_BOND_FLOOR` = 8, the same friend floor 414/340 use) among the *other dinos residing in its current zone*.

When that holds, the tic-onset threshold drops to `TIC_AFTER_STEPS_HOMESICK` (12), taken as the **min** with whatever `ticAfterFor(intent, TIC_AFTER_STEPS)` already returned (so a solitary-intent day 393 still wins if it's lower — the two shorteners compose, never fight). A distinct one-time memory names the strangeness when the tic invents under this condition, so the beat is legible in talk (not the plain 405 `ticMemory`, not the 414 grief memory).

**Interaction with 414 (grief tic).** Independent and compatible: 410 decides *how soon* the tic forms; 414 decides *where* it's aimed (the grief anchor, when the closest friend crossed away). A homesick newcomer whose closest friend is in another zone forms its tic sooner (410) *and* aims it at the grief edge (414). The strange-zone memory (410) is filed only when there's no grief memory to file — grief is the sharper, more specific ache and keeps priority (mirrors how `performTic` already prefers `griefTicMemory` over `ticMemory`).

**New in `world/tic.ts` (pure, unit-tested):**
- `TIC_AFTER_STEPS_HOMESICK = 12` — onset steps for a dino alone in a strange zone (< `TIC_AFTER_STEPS`).
- `aloneInStrangeZone(settled: boolean, hasFriendInZone: boolean): boolean` → `!settled && !hasFriendInZone`.
- `strangeZoneTicMemory(label: string): string` → e.g. `newly here and knowing no one, you ${label} sooner than you would at home`.

**`WorldScene` wiring (thin glue):**
- In the `maybeWander` tic branch, compute `hasFriendInZone` for `d` (reuse `closestFriend(d.name, this.bonds, <names of other dinos in d's zone>, GRIEF_BOND_FLOOR) !== null`) and `settled = isSettled(tenureOf(this.tenure, d.name))`.
- `after = ticAfterFor(intent, TIC_AFTER_STEPS)`; if `aloneInStrangeZone(settled, hasFriendInZone)` → `after = Math.min(after, TIC_AFTER_STEPS_HOMESICK)`. Feed `after` into `inventsTic(...)`.
- Track a per-stretch flag (or recompute at invention) so `performTic` files `strangeZoneTicMemory` when the tic first invents under strange-zone conditions **and** there's no grief memory; otherwise unchanged.
- Extend the `__tic(name)` hook with the current onset `after` (or a boolean `strange`) so the e2e can prove the shorter threshold deterministically.

**Acceptance criteria (Lore):**
1. `aloneInStrangeZone(false, false) === true`; `(true, false)`, `(false, true)`, `(true, true)` all `false`. Pure, no side effects.
2. `TIC_AFTER_STEPS_HOMESICK < TIC_AFTER_STEPS` and `inventsTic(TIC_AFTER_STEPS_HOMESICK, TIC_AFTER_STEPS_HOMESICK) === true` while `inventsTic(TIC_AFTER_STEPS_HOMESICK - 1, TIC_AFTER_STEPS_HOMESICK) === false`.
3. `strangeZoneTicMemory('paces a fixed little path')` names the ritual label and reads as new-here loneliness; distinct string from `ticMemory` and `griefTicMemory`.
4. **e2e:** a dino sent alone into a zone where it has **no** in-zone friend invents its tic by step `TIC_AFTER_STEPS_HOMESICK` (before the plain 20), and files the strange-zone memory. Zero console errors.
5. **e2e control:** a dino in the same zone as a bonded friend (bond ≥ floor), or one that is settled, still takes the full `TIC_AFTER_STEPS` (410 does not fire) — the shortening is gated, not universal.
6. The two shorteners compose: a solitary-intent day (393) already below 12 is not lengthened by 410 (`Math.min`), and a non-solitary day gets 410's 12. No change to the tic motion, glyph, anchor logic (414 grief aim intact), bonds, or save shape.

---

## Structure track — BACKLOG-428 Zone prosperity index

**What it is.** A pure derived per-zone read that folds a zone's live signals into one score + tier, so "which zone is thriving" is a glance on the map lens (425) instead of four separate lookups. Nothing here authors sim behavior — it's a readout of state already produced (the CHARTER lens rule).

**Signals folded (per zone):**
- **stockpile** — total banked resources in the zone: `sum(values(stockpileByZone[zone]))`.
- **structures** — built landmarks in the zone: cairns + shelters + thatches filtered by `.zone === id`.
- **heads** — resident dino count: `zonePopulations(...)[id]` (316).
- **harvested** — crops harvested from that zone's plot. Today `harvested` is one global counter; 428 adds a minimal per-zone `harvestedByZone` counter (incremented at the single harvest site by the plot's zone) so the farming term is honest per zone. (433's residual scope = surfacing per-zone harvest as its own line.)

**New in `world/prosperity.ts` (pure, unit-tested):**
- `interface ZoneSignals { stockpile: number; structures: number; heads: number; harvested: number }`.
- `zoneProsperity(s: ZoneSignals): number` — a weighted monotonic sum. Weights chosen so the rarer, harder-won signals count more: `structures*3 + heads*2 + harvested*1 + stockpile*1`. Every signal is non-negative and monotonic (more of any signal never lowers the score).
- `type ProsperityTier = 'quiet' | 'growing' | 'thriving'`.
- `PROSPERITY_TIERS`: thresholds — `score <= 3 → 'quiet'`, `<= 9 → 'growing'`, else `'thriving'` (tunable constants).
- `prosperityTier(score: number): ProsperityTier`.
- `PROSPERITY_GLYPH: Record<ProsperityTier, string>` — a small dot meter, e.g. `quiet: '○'`, `growing: '◐'`, `thriving: '●'`.
- `prosperityBadge(tier): string` → `glyph + ' ' + tier` for the lens line.

**`ui/lenses.ts` wiring:**
- Add `tier: ProsperityTier` (and its glyph via the badge) to `ZoneMapEntry`.
- `zoneMapModel(...)` gains a `prosperity: Record<string, ProsperityTier>` argument (or a `signals` map it folds) and sets `tier` per zone. Keep the signature back-compatible where cheap; existing `zoneMapModel` unit tests updated to pass the new arg.

**`WorldScene` wiring (thin glue):**
- A private `zoneSignals(id): ZoneSignals` builder (sum pile, count structures by zone, read heads, read `harvestedByZone[id]`).
- `zoneMapEntries()` passes each zone's tier (via `zoneProsperity`→`prosperityTier`) into `zoneMapModel`.
- The map lens draw appends the prosperity badge to each zone box line.
- `harvestedByZone: Record<string, number>` field; bump it at the harvest site (alongside the existing global `harvested`, which stays for back-compat/other readers); persist it additively in the save (absent → derive nothing, default `{}`).
- `__zoneProsperity = (zone: string) => ({ score, tier, signals })` dev hook.

**Milestone bookkeeping (for the Validator).** On APPROVE, mark MILESTONE.md structure arc 428 `[x]` — that closes the last open arc, so **Milestone 2 "Places to belong" ships** (big chronicle entry + draft the next milestone's headline/arcs).

**Acceptance criteria (Structure):**
1. `zoneProsperity` is monotonic and non-negative: `zoneProsperity({stockpile:0,structures:0,heads:0,harvested:0}) === 0`; raising any one field raises (or holds) the score, never lowers it; the documented weights hold (e.g. a structure outweighs a lone stockpile unit).
2. `prosperityTier` partitions the score line correctly at the tier boundaries (both sides of each threshold tested); `PROSPERITY_GLYPH`/`prosperityBadge` return the right glyph+label per tier.
3. `zoneMapModel` sets each entry's `tier` from the passed prosperity, keeper flag + counts unchanged; a zone with no signals reads `'quiet'`.
4. **e2e:** with the map lens open, each zone box shows its prosperity badge; seeding a zone's pile/structure/heads (via existing `__setZonePile` etc.) and re-reading `__zoneProsperity` moves its tier upward across a threshold (quiet → growing/thriving). Zero console errors.
5. **e2e/persistence:** `harvestedByZone` round-trips through save/load (additive — an old save without it loads clean, defaults `{}`); harvesting from a zone's plot increments that zone's count and can lift its tier.
6. Build clean, full unit + e2e green. No WebLLM import outside `game/src/ai/`. `harvested` global untouched for existing readers; save change additive only.
