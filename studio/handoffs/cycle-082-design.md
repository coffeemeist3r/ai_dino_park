# Cycle 82 — Design

Two file-disjoint tracks.

---

## Lore track — BACKLOG-374: Comfort food

**Intent.** A moping loner that eats *its own favorite* food gets a quiet solace beat a plain meal never
gives. Solace is per-palate: who is soothed by what becomes a per-dino tell. Scoped to the **loner (🥀)**
case — cleanly queryable via `isLoner` off the saved bond graph. (A sulk-state version is deferred to a
follow-up; sulk-shakeoff 123 isn't shipped, so there is no queryable sulk timer yet.)

**Why this scope.** The loner mope is *derived* from the live bond graph (369): only a real bond lifts the
🥀 (a meal can't, by design). So comfort food is a **momentary solace beat** — a one-shot 😌 mark + a
"comfort food" memory — not a status change. It mirrors the 135 💐 greet-perk pattern: a visible perk-up that
acknowledges the keeper hit the right note, without rewriting the loner's standing.

**Design.**
- Pure helper, `world/loner.ts` (it owns the mope):
  - `COMFORT_FOOD_GLYPH = '😌'`
  - `comfortsLoner(favorite: boolean, lonerNow: boolean): boolean` → `favorite && lonerNow` (the predicate, one place, unit-tested).
  - `comfortFoodMemory(label: string): string` → e.g. `comfort food — the ${label} eased the ache 😌` (distinct from the plain-favorite memory `eatFood` already files).
  - `comfortFoodLine(name: string): string` → `${name} ${COMFORT_FOOD_GLYPH}` (the floated bubble).
- `WorldScene.eatFood`: after the existing favorite memory/flash, compute
  `const comforted = comfortsLoner(r.favorite, isLoner(this.bonds, d.name, this.dinoNames(), LONER_FLOOR));`
  If `comforted`: `this.memory = remember(this.memory, d.name, comfortFoodMemory(kind!.label));` and
  `this.showBubble(d, comfortFoodLine(d.name));`. Dev hook `__lastComfortFood` = last `{name, food}` or null.
- No save change: loner status derives from the saved bonds; the memory rides the already-persisted memory store.

**Acceptance criteria (374):**
1. A loner (every bond < `LONER_FLOOR`) eating its **favorite** food files a distinct "comfort food" memory **and** floats a 😌 beat.
2. A loner eating a **non-favorite** food gets the plain-feed path only — no comfort memory, no 😌.
3. A **non-loner** (a bond ≥ floor) eating its favorite gets the normal 😋 favorite beat only — no comfort memory.
4. `comfortsLoner` is a pure predicate, unit-tested for all four favorite×loner combinations.
5. The existing favorite-eat behavior is unchanged: gain `FEED_GAIN_FAV` (9), 😋 flash, the favorite memory still filed; `eatFood` still sates hunger (371) and mends a cold funk (184).
6. No save change. Build clean; vitest + e2e green; web-llm boundary untouched.

---

## Structure track — BACKLOG-357: Both-zone stores readout

**Intent.** The plaque's `Stores · …` line shows only the keeper's *active* zone pile (328). Show **both**
zones' piles at once — the way the zone tally (316) already shows both populations — so the player can watch
the bowl and grove economies diverge without crossing.

**Design.**
- Pure helper in `ui/plaque.ts` (mirrors `zoneTallyLine`, maps over `ZONES`):
  ```ts
  export function zoneStoresLine(stores: Record<string, string>, activeZoneId: string): string {
    return ZONES
      .map((z) => ({ z, line: stores[z.id] ?? '' }))
      .filter((e) => e.line)                                   // omit a zone with an empty pile
      .map((e) => `${e.z.id === activeZoneId ? '▸' : ''}${e.z.name} ${e.line}`)
      .join(' · ');
  }
  ```
  `stores` is `zoneId → already-formatted glyph string` (the existing `stockpileLine` output per zone), so
  the helper stays glyph-agnostic and no `plaque.ts ↔ resource.ts` import is introduced.
- `WorldScene` plaque-stats builder (the two `stockpile: stockpileLine(this.pileFor(this.zoneId))` sites):
  build `const stores = { [BOWL_ID]: stockpileLine(this.pileFor(BOWL_ID)), [GROVE_ID]: stockpileLine(this.pileFor(GROVE_ID)) };`
  and pass `stockpile: zoneStoresLine(stores, this.zoneId)`.
- `PlaqueStats.stockpile` stays a `string` — `plaqueLines` unchanged, so all its back-compat tests pass.

**Acceptance criteria (357):**
1. When both zones hold resources, the Stores line shows **both** zones' piles, each as `<name> <glyphs>` joined by ` · `.
2. The keeper's **active** zone carries the `▸` marker (matching the zone-tally convention).
3. A zone whose pile is empty is **omitted** from the line; both empty → no Stores line at all (byte-identical to the pre-357 empty case in `plaqueLines`).
4. The other zone's count is visible **without crossing** — i.e. the line reads both piles regardless of `this.zoneId`; crossing only moves the `▸`.
5. `zoneStoresLine` is a pure helper, unit-tested (both-full, one-empty, both-empty, ▸ placement).
6. `PlaqueStats`/`plaqueLines` signatures unchanged; no save change. Build clean; vitest + e2e green.

---

**Disjointness.** 374 = `world/loner.ts` + `WorldScene.eatFood`. 357 = `ui/plaque.ts` + the plaque-stats
builder. Distinct modules; the two WorldScene touch-points are different methods. Clean two-track fire.
