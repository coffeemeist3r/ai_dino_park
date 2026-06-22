# Cycle 70 — Design

Two tracks. Lore: BACKLOG-310 (quirk shaded by feeling). Structure: BACKLOG-309
(stockpile capacity + pressure).

---

## Lore track — BACKLOG-310 (Quirk shaded by feeling)

**Item:** BACKLOG-310 [emergent] — a dino in a transient mood colours its signature
idle fidget, so the same body language reads its *current state*, not just its
temperament.

**Why this cycle:** The signature `fidget()` (298) now appears in four places, all
reading temperament. The bowl already tracks two *transient* moods on a dino:
the jealous **sulk** awaiting a make-up greet (`pendingRepair`, 125) and the cold
**funk** after a cold night (`coldPending`, 184). 310 makes the idle motion read
those moods — a sulking pacer reads as glum, not generic — the cheapest possible
"minds surface feeling through motion" beat, and a pure shading of an existing fn.

**What ships:**
- A pure `moodFidget(personality, mood?)` in `world/fidget.ts`. With no mood it
  returns *exactly* `fidget(personality)` (byte-identical — every 298/303/306/312
  path is untouched). With a mood it returns a Quirk whose **label** gains a mood
  clause (e.g. `"paces, sulking"`, `"paces, shivering"`) and, for `sulk`, whose
  **glyph** becomes the mood tell `😒`.
- In-world: a wandering dino that is currently the jealous runner-up
  (`pendingRepair === name`) shows `😒` above its head in place of its idle quirk
  glyph — its mood overrides its idle motion until the keeper makes up with it.
- Cold's existing floating `🥶` mark (184) already signals the cold funk above the
  head, so the **cold** mood shades the *label* only (no second 🥶 on the activity
  mark) — kept consistent through `moodFidget` for the readouts/hooks, not doubled
  in the live glyph.
- A dev hook `__moodFidget(name, mood?)` returning the shaded quirk, so QA can
  assert the shading deterministically without staging transient state.

**Acceptance criteria:**
- [ ] `moodFidget(p)` (no mood) deep-equals `fidget(p)` for several personalities (byte-identical fallback).
- [ ] `moodFidget(p, 'sulk').glyph === '😒'` and `.label` is `fidget(p).label + ', sulking'`.
- [ ] `moodFidget(p, 'cold').glyph === '🥶'` and `.label` is `fidget(p).label + ', shivering'`.
- [ ] `__moodFidget(name, 'sulk')` returns `{glyph:'😒', label:'<sig>, sulking'}` via the real scene build.
- [ ] `__moodFidget(name)` (no mood) returns the dino's plain signature quirk (matches `__fidget(name)`).
- [ ] Build clean; all prior fidget specs (cycle-066, cycle-068-homecoming-quirk) stay green.

**Out of scope:** the freshly-fed `😋` mood (it's a one-frame `flashFeed`, not a
lingering state — deferred); feeding mood-shaded fidget into the book/scan/homecoming
text (that's 319/321); the brightened recovery flourish (318). 310 is the spine.

**Constraints:** `fidget()` must stay byte-identical (no signature change). No
WebLLM. Pure module — no Phaser import in fidget.ts.

---

## Structure track — BACKLOG-309 (Stockpile capacity + pressure)

**Item:** BACKLOG-309 [emergent] — the shared per-kind stockpile gains a cap; at
cap, banking stalls — the first economy constraint.

**Why this cycle:** `bankResource` (285) accrues forever, so the gather loop has no
ceiling and no reason to spend. A per-kind cap turns "gather endlessly" into a
pressure: once a kind is full, picking up more of it banks nothing (and says so),
so the only way forward is the craft that spends it. Foundation for 315 (a shelter
at a higher threshold).

**What ships:**
- `STOCKPILE_CAP = 8` (per kind) and `atCap(pile, kind)` in `world/resource.ts`.
- `bankResource` clamps: banking a kind already at cap returns the pile unchanged
  (pure, defensive — never exceeds the cap).
- In `WorldScene.checkGather`: when the picked-up kind is at cap, the resource is
  still consumed (no slot-deadlock) but **not banked**, and a one-line beat logs the
  stall (`🪵 stores full — Rex drops the branch`). Below cap, banking is unchanged.
- The auto-craft on bank (286) is untouched — a craft that spends a kind drops it
  below cap, so banking that kind resumes naturally.

**Acceptance criteria:**
- [ ] `atCap({branch:8}, 'branch')` is true; `atCap({branch:7}, 'branch')` is false; `atCap({}, 'stone')` is false.
- [ ] `bankResource({branch:8}, 'branch')` returns `{branch:8}` (clamped, not 9); unchanged-input purity preserved.
- [ ] `bankResource({branch:7}, 'branch')` returns `{branch:8}` (below cap still banks).
- [ ] After banking 9 branches with no stones (no craft fires), `__stockpile().branch === 8` (the 9th didn't raise it).
- [ ] A craft that spends branches drops the pile below cap, so `atCap` is false again afterward.
- [ ] Build clean; all prior resource/stockpile/craft specs (cycle-062/063/064) stay green.

**Out of scope:** lingering the capped resource on the ground (rejected — a single
resource slot would deadlock: a stuck capped resource blocks the other kind from
spawning, so the craft that frees the cap could never happen; "isn't banked" is the
chosen branch of the backlog's OR); per-zone caps; a plaque "full" readout (the log
beat carries the pressure); raising the cap with a building (315).

**Constraints:** additive only — no save format change (the cap is a runtime
constant, the stockpile shape is unchanged). `stockpileLine` format must stay
byte-identical (cycle-063 asserts exact strings). No new deps.

---

## Cross-track collision

Both tracks touch `WorldScene.ts` but **different methods**: 310 →
`refreshActivityMarks` (the idle-glyph render) + a dev hook; 309 → `checkGather`
(the bank path) + the resource import. No shared lines. Pure modules are different
files (`fidget.ts` vs `resource.ts`). The Coder can build them in either order.
