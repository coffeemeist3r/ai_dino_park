# Cycle 101 — Design handoff

Two tracks. Shared file only `scenes/WorldScene.ts` (two non-overlapping regions). 7 acceptance criteria each.

---

## Lore track — BACKLOG-442: The hunter's reputation

**Goal.** A herbivore chased by the *same* carnivore several times grows wary of that dino specifically —
startles and keeps distance when its chaser is near, **even when not being actively stalked**. Fear becomes a
personal, standing read on the food-web history. Deathless, no save change.

**Design.**

`world/foodweb.ts` (pure, additive):
- `export const WARY_CHASES = 2;` — repeat chases by the *same* hunter before fear turns personal. Chosen at
  2 (not 3) deliberately: `recall` caps the store at 6 slots shared with all memory, so 3 same-hunter hunt
  memories rarely coexist in the window; 2 is a reachable "again — that one" while still distinct from 440's
  single-chase rattle. Named so it's a tuning knob.
- `export function chaseCount(memories: readonly string[], hunter: string): number` — counts memories whose
  `slipped (.+?)'s hunt` capture equals `hunter` (same pattern `recentHunter` reads; the 367 memory is
  exactly `you slipped ${hunter}'s hunt`).
- `export function fearsHunter(memories: readonly string[], hunter: string, threshold = WARY_CHASES): boolean`
  → `chaseCount(memories, hunter) >= threshold`.
- `export const WARY_RANGE = STALK_RANGE;` — tiles within which a wary prey startles from its feared hunter
  (reuses the stalk range; a named knob, `keeps its distance` tunable later).

`scenes/WorldScene.ts` — in `forceStep`, right after the stalk-pairing loop builds `stalkTargets`/`fleeFrom`
and sets `this.lastStalk` (~L2442), add a **wariness pass**:
- For each in-view herbivore `h` **not already in `fleeFrom`**: read `recall(this.memory, h.name)`; scan
  in-view carnivores `c` (`c.name !== h.name`) and, among those with `fearsHunter(mem, c.name)` and
  `chebyTiles(tileOf(h), tileOf(c)) <= WARY_RANGE`, pick the **nearest**; if found, `fleeFrom[h.name] = c`.
- The existing flee branch (~L2538) then moves `h` away and flashes `fleeing` — no new motion code. A wary
  prey flees its feared hunter regardless of that hunter's hunger/cooldown/stalk state (the whole point).
- Expose the resolved flee map for verification: store `this.lastFlee = fleeFrom` beside `this.lastStalk`, and
  add a dev hook `(window as any).__fleeFrom = () => ({ ...this.lastFlee })` next to `__stalkTargets`.

**Acceptance criteria (442):**
1. `chaseCount(['you slipped Twitch\'s hunt','you slipped Twitch\'s hunt'], 'Twitch')` → 2; a different
   hunter or non-hunt memory contributes 0; `chaseCount([], 'Twitch')` → 0. *(unit)*
2. `fearsHunter` is true at ≥ `WARY_CHASES` chases and false below; `WARY_CHASES` ∈ [2,∞) and `WARY_RANGE`
   equals `STALK_RANGE`. *(unit)*
3. Two hunters are tracked independently — a dino chased twice by A and once by B fears A, not B. *(unit)*
4. The wariness pass sets `fleeFrom[h]` to the **nearest** in-range feared carnivore, and only for a herbivore
   not already fleeing an active stalker; the existing flee branch then drives it. *(review + `__fleeFrom`)*
5. A herbivore near a carnivore that has chased it **fewer than `WARY_CHASES`** times does **not** flee it
   (no false fear); a carnivore beyond `WARY_RANGE` is ignored. *(unit on `fearsHunter` + review)*
6. Deathless: the wariness pass mutates only `fleeFrom` (movement), never the roster/needs/memory. No save
   change (fear is read from the existing 367 memory, ages out of `recall`'s window). *(review)*
7. `npm run build` + `tsc --noEmit` clean; WebLLM stays `ai/`-only. *(review/build)*

---

## Structure track — BACKLOG-438: A zone wants what it can't grow

**Goal.** Surface each zone's **demand**: a legible carry-request leaning toward the linked neighbour
producing the most of a crop this zone can't grow itself. The demand half of "enough to go around," keyed to
farming output (433). A read, not a mover (no banked food exists yet — 446 seeds that).

**Design.**

`ui/lenses.ts` (pure, additive):
- `export interface ZoneWant { food: string; glyph: string; from: string; fromName: string; }`
- `export function zoneWant(zone: string, harvests: Record<string, number>): ZoneWant | null` — among
  `zoneNeighbors(zone)` whose `cropOf(l.to).food` differs from `cropOf(zone).food`, pick the neighbour with
  the greatest `harvests[l.to]` (strict `>` from a 0 floor, so **null** until a neighbour output > 0, and the
  first neighbour in link order wins a tie). Returns that neighbour's crop food id, its ripe glyph
  (`cropOf(from).ripe`), the neighbour id and display name (`zoneById`). Imports `zoneNeighbors`/`zoneById`
  from `world/zones` and `cropOf` from `world/plot`.
- `ZoneMapEntry` gains `want: ZoneWant | null`; `zoneMapModel(..., harvests = {})` sets
  `want: zoneWant(id, harvests)` per entry. `harvests` already the 5th arg (433) — no new param, no
  signature break; a 3/4-arg caller passes `{}` and every entry's `want` is null.

`scenes/WorldScene.ts` — `drawZoneMap` (~L2166): append a fourth label line when `e.want` is set —
`\nwants ${e.want.glyph}◂${e.want.fromName}` (short — the neighbour name is already on its own box). Bump
`boxH` if needed so the line fits. When `e.want` is null the box reads exactly as cycle-100 (three lines).

**Acceptance criteria (438):**
1. `zoneWant('bowl', {})` and any all-zero `harvests` → null (no want until a neighbour has a surplus).
   *(unit)*
2. With the grove having harvested more than the Fernreach, `zoneWant('grove', {...})` requests from whichever
   neighbour (bowl/Fernreach) has the greater output — the productive-farmer lean. *(unit)*
3. Tie in neighbour output → the first neighbour in `zoneNeighbors` link order wins (deterministic strict
   `>`). *(unit)*
4. The returned `food`/`glyph`/`from`/`fromName` match `cropOf(from)` + `zoneById(from)` for the chosen
   neighbour. *(unit)*
5. `zoneMapModel` attaches `want` per entry from the passed `harvests`; a 3/4-arg call (no harvests) yields
   `want: null` on every entry (back-compat). `drawZoneMap` renders the `wants …` line only when non-null.
   *(unit + review)*
6. Additive: **no save-schema change** (reads the existing `harvestedByZone`); older `zoneMapModel`/
   `ZoneMapEntry` callers/tests stay valid. *(review)*
7. `npm run build` + `tsc --noEmit` clean; WebLLM stays `ai/`-only. *(review/build)*

---

**Disjointness.** 442 → `world/foodweb.ts` (new `chaseCount`/`fearsHunter`/`WARY_*`) + `forceStep` stalk/flee
region + `__fleeFrom` hook. 438 → `ui/lenses.ts` (new `zoneWant`/`ZoneWant`/`ZoneMapEntry.want`) +
`drawZoneMap`. Only `WorldScene.ts` is shared, in two non-overlapping regions (the tick vs. the lens draw).

phase → codeplan-pending
