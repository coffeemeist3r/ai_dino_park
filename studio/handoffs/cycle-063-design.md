# Cycle 63 — Design (two tracks)

## Lore track — BACKLOG-150 Stargazer's awe varies by temperament

**Item:** BACKLOG-150 — Stargazer's awe varies by temperament.

**Why this cycle:** The sky event (144, cycle 36) is the bowl's one collective beat, but it renders
every dino identically: all five march to `SKY_GATHER_TILE` and register as gazers inside the same
radius-1 box. That flattens exactly the thing the CHARTER says is first-class — distinctness. The fix is
small and high-leverage: give each dino a personal *gather ring* shaped by its temperament, so the bold
crowd in under the spectacle and the timid hang back at the edge. One event, five readings. It's the
queued cycle-36 follow-up and it unblocks 287/288/289.

**What ships:** Trigger a clear-night sky event (meteors/aurora) and pump the world. As before the whole
cast drifts toward the centre gather tile — but now each dino *stops at its own ring*: a bold, curious dino
presses all the way in (ring 0, the gather tile itself); a middling dino halts one tile out (ring 1); a
timid, incurious dino stops two tiles out at the edge of the cluster (ring 2) and only peeks. Each dino
still files the one shared memory and throws its ✨ bubble the moment it reaches its own ring (so the timid
ones aren't excluded — they watch from the edge). The cluster visibly spreads by temperament instead of
stacking on one tile.

**Acceptance criteria:**
- [ ] `gazeRing(traits)` is a pure function of `bravery`+`curiosity` returning 0, 1, or 2: high boldness → 0, middling → 1, low → 2 (exact thresholds pinned in a unit test).
- [ ] During an active sky event, each dino approaches the gather tile but stops once it is within its own ring (Chebyshev distance ≤ ring) — a ring-2 dino never reaches the centre tile.
- [ ] Every dino still registers as a gazer and files the shared memory + ✨ bubble once it reaches its ring (gazer count still equals the cast size after the cast settles).
- [ ] After the cast settles under an event, the gather cluster spans more than one ring: at least one dino sits on/adjacent to the centre (ring ≤ 1) and at least one sits ≥ 2 tiles out (a ring-2 dino), proving the spread is temperament-driven.
- [ ] The event still ends on duration/dawn and ordinary life resumes (cycle-36 specs stay green).
- [ ] No save change — this is movement/registration only; the shared memory still persists via the existing memory store.

**Out of scope:** Lingering-after-the-event (287), pairwise stargazing bonds (288), the book readout (289),
any change to *which* event fires or its odds, the shimmer overlay.

**Constraints:** Don't break the cycle-36 sky specs (cast gathers, one shared memory persists, event ends
at dawn, tone menu unaffected). `gazeRing` takes a structural `{ bravery, curiosity }` — do **not** import
from `ai/` into `world/skyEvent.ts` (keep the file dependency-free, mirroring its current shape). Reuse the
existing `atGather(tile, gather, radius)` for the per-dino ring test rather than adding a new distance
helper. WorldScene touch is confined to `stepSky`.

## Structure track — BACKLOG-285 Resource stockpile

**Item:** BACKLOG-285 — Resource stockpile.

**Why this cycle:** 146 (cycle 62) made resources *gatherable* but the harvest banks into a per-dino
`gathered` counter that nothing reads — a dead-end tally. 285 turns the flow into a stock: every pickup
also banks into one shared, per-kind **park stockpile** (`{ branch, stone }`), persisted in the save and
shown on the plaque. That park-level total is the value 286 (first craft) and 029 (crafting) will read a
threshold off, so it's the load-bearing next beat of the build arc.

**What ships:** When a dino picks up a resource (the existing 146 flow), the park stockpile for that kind
increments by one, alongside the unchanged per-dino tally. The plaque under the bowl grows a third line —
`Stores · 🪵 3 · 🪨 1` — that appears once anything has been banked and updates live. The stockpile rides
the save additively: a save that predates this field loads to an empty stockpile; an exported save after
gathering carries `stockpile: { branch: N, ... }`.

**Acceptance criteria:**
- [ ] `bankResource(pile, kind)` is pure and returns a new map with that kind's count + 1 (other kinds untouched; absent kind starts at 0).
- [ ] `stockpileLine(pile)` renders a glyph readout (`🪵 3 · 🪨 1`) listing only kinds with count > 0, and returns `''` for an empty stockpile.
- [ ] Picking up a resource increments the park stockpile for that kind (a branch pickup → `stockpile.branch` rises by 1), in addition to the existing per-dino `gathered` tally.
- [ ] The plaque shows the stores line once the stockpile is non-empty and omits it while empty; the line reflects the live counts.
- [ ] The stockpile persists: an exported save after a pickup carries the `stockpile` map; a save without the field loads to `{}` (old saves still load — additive only, no `SAVE_VERSION` bump).
- [ ] `npm run build` clean, unit + e2e green.

**Out of scope:** Crafting / spending the stockpile (286), per-dino vs park reconciliation (the `gathered`
tally stays as-is), a book panel for the stockpile, resource kinds beyond branch/stone, any stockpile cap.

**Constraints:** Additive save only — `stockpile` is optional, absent → `{}`, no version bump (mirror the
`gathered` field's validation exactly in `deserialize`). Keep `world/resource.ts` pure (no Phaser). The
plaque change is an optional third line — `plaqueLines` must stay backward-compatible (old callers without
`stockpile` render the existing two lines unchanged). **Cross-track note:** both tracks touch WorldScene.ts
but in disjoint methods (`checkGather`/save/plaque here, `stepSky` for the lore track) — no ordering risk.
