# Cycle 141 — Design

Two tracks, no file collision beyond `WorldScene` (opposite ends of it). Both are CHARTER v7 items: each
takes something the park already computes correctly and puts it somewhere the player can be standing.

---

## Lore track

**Item:** BACKLOG-300 — Caught in the act.

**The gap.** `dinoActivity` (295) resolves ten activities from the realized movement flags every step, and
`activityById[name]` is read by exactly one thing: the glyph over the dino's head. Press E on a dino that is
face-down in a food drop, curled in a huddle, or carrying a stone across the ground, and the hello that
comes back is the hello it would have given standing still in an empty field. The one axis of this park that
differs per dino *and* per minute is invisible to the one moment the player is actually talking to it.

**The spec.**

1. `world/activity.ts` gains a pure `activityAside(activity, name): string | null`.
   - `wandering` returns **null**. That is deliberate and load-bearing: a dino that was doing nothing in
     particular greets exactly as it does today, byte-for-byte, so the beat *means* something when it fires
     and the plain greet has no regression surface.
   - Every other activity returns a short clause naming what the keeper interrupted, in the same register as
     `ticAside` (423): the physical business of stopping. Two phrasings per activity, picked by
     `hashSeed(name)` from `ai/personality.ts` — so the same dino always words it the same way (a tell you
     can learn) and two dinos caught at the same thing need not sound alike.
2. `WorldScene.pickTone` composes it through the seam 423 already built:
   `aside = caught ? ticAside(...) : activityAside(activityById[target.name] ?? 'wandering', target.name)`.
   One aside or the other or neither — **never both**. The caught-mid-ritual branch wins, because a dino
   deep in its own private ritual is the more specific truth about it, and 423's frozen strings and its
   memory filing are untouched.
3. The enrichment half rides the same context object the ritual does: `greet({ ..., doing })` carries the
   activity when there is one, so a machine with a model colours the reply too. **The aside ships without
   it** — this is not a prompt-only cycle (the 423 finding, applied a cycle later).

**Acceptance criteria (lore)**
- L1. `activityAside('wandering', n)` is null for every name; every other `Activity` returns a non-empty
  string.
- L2. The aside is stable per name and differs across at least one name pair for at least one activity.
- L3. Greeting a dino whose activity is `huddling` / `gathering` / `feeding` puts that activity's clause in
  the line, and no other activity's clause.
- L4. A dino caught mid-ritual gets the **tic** aside and **no** activity aside — exactly one aside.
- L5. Composition stays single-spaced, no leading/trailing space, with any combination of opener/aside/reply.
- L6. Works with no model loaded (headless, no WebGPU) — the e2e proves it rather than the verdict asserting
  it: boot fresh, drop food with `H`, poll `__activity` until a dino reads `feeding`, greet it, assert its
  clause is present and the other activities' clauses are absent.
- L7. No save field added or changed.

---

## Structure track

**Item:** BACKLOG-504 — the pile gets a place.

**The gap.** `stockpileByZone` pays the upkeep bill, funds a mend, stakes a ballot, fills toward the granary
cap and rides along with a courier. Its entire on-screen existence is `stockpileLine` inside the zone-map
lens. A dino walks a stone across a ground and the stone becomes an integer in a menu.

**The spec.**

1. New pure module `world/bank.ts`:
   - `BANK_TILE = { tileX: 16, tileY: 11 }` — **the same tile on every ground**, on purpose. The bank is a
     place the player learns once and can then find on any ground, the way the hatch key is one key. It is
     grass on all five grounds and clear of every fixture the park already pins (the bowl's waterhole and
     huddle tile, the grove's pond, trail and founding ruin, the Fernreach's creek and scrub, the Hollow's
     pool and fen rim, the Ridge's switchback and tarn) — and a unit test asserts that against
     `zoneTileAt` for every ground in `zoneChain()` rather than a comment claiming it.
   - `PILE_STEPS = [1, 2, 4]` and `pileStep(total): 0 | 1 | 2 | 3`.
   - `pileArtKey(step)`: `pile_1` / `pile_2` / `pile_3`, or null at step 0.
2. **The founding park ships a visible heap and is watched losing a step.** The Grove starts with
   `{ stone: 2 }` (136's founding pile, untouched) which is **step 2**, a heap standing on the Grove the
   moment a new player walks one edge east. `REPAIR_COST` is 1, so when Bramble mends the founding ruin —
   the beat 488 built to happen inside the first minute — the pile drops to 1 and the heap **visibly drops a
   step**. That is the reachability answer, and it needs no founding constant to change: the thresholds are
   chosen to sit *around* the founding state instead of above it, which is the v7 corollary read forwards.
   `FOUNDING_PILES` is explicitly **not** widened — cycle 136's "the founding park is not made rich" guard
   stays green, and the bowl's own heap appearing when the first gathered stone banks is itself the beat.
3. **One seam for every pile write.** `this.stockpileByZone[z] = ...` appears in ~10 places (bank, craft,
   build, granary, mend, upkeep, carry, pressured carry, barter, the dev hooks). Every one routes through a
   single private `setPile(zone, pile)` that assigns and then syncs that ground's bank sprite. This is the
   root-cause shape: a future pile write cannot forget to update the heap, because there is nowhere else to
   write a pile.
4. Rendering rides the existing prop path exactly as the cairn/shelter/thatch/granary do:
   `bakePropArt` on the step's key where a rig exists, else the graceful fallback — here the stone glyph
   repeated once per step, which reads as a heap that grows and reuses the park's own resource vocabulary.
   The rigs are BACKLOG-506, seeded this cycle for the Artist; **this item ships on the fallback**, which is
   the same per-item fallback 490/494/496/502 all ship, and the heap is legible either way. Visible only in
   its own zone (the 308 rule), depth 2 like every other placed prop, step 0 hidden.
5. Test hook `__bank(zone?)` returning `{ tile, step, total, visible }`.

**Acceptance criteria (structure)**
- S1. `pileStep` maps 0 to 0, 1 to 1, 2 and 3 to 2, 4 and above to 3.
- S2. `BANK_TILE` is grass on every ground in `zoneChain()` (checked against `zoneTileAt`, not asserted).
- S3. `pileArtKey(0)` is null; 1/2/3 give the three keys.
- S4. On a fresh save the Grove's bank reads step **2**; the bowl's reads step **0**.
- S5. Banking one resource into a ground at step 0 raises it to step 1 and the sprite becomes visible;
  spending back to 0 hides it. Proven through the real path, not by calling the helper.
- S6. The founding mend drops the Grove's bank from step 2 to step 1 (e2e, fresh save, no model).
- S7. The heap shows only on the ground it belongs to.
- S8. No save field added or changed — the bank is derived from `stockpileByZone`, which already persists.
- S9. Build clean, unit + e2e green, `@mlc-ai/web-llm` still only under `game/src/ai/`.
