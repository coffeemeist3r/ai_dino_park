# Cycle 106 — Design

Two tracks, one shared seam (`WorldScene.crossDino`). The structure track adds a food-carry mover; the
lore track gives that mover a feeling. They ship together because 451's pride beat fires off 447's ferry.

---

## Structure track — BACKLOG-447: Food flows between zones

**What:** When a dino makes a *visible* crossing (home → dest), it ferries one unit of banked food from the
zone it leaves into the zone it enters — the food twin of the resource carry already applied in `crossDino`
(329/356/429). Food only flows *toward need*: nothing moves into an already-fuller-of-that-food neighbour.
The demand read (438, `zoneWant`) becomes the aim: prefer the food `dest` actually wants.

**Design (pure helper, foodstore.ts):**
`pickFoodCarry(src: FoodPile, dest: FoodPile, wantId?: string): string | null` — the food twin of
resource `pickCarry`/`directedCarry`:
1. **Directed:** if `wantId` is set, `src` has it banked (>0), `dest` can still accept it (not at cap),
   AND `dest` holds strictly less of it than `src` → return `wantId`. (The demand read drives the pick.)
2. **Fallback (glut → lighter):** otherwise the most-stocked id in `src` that `dest` can accept and holds
   strictly less of than `src` → return it. Deterministic (FOODS-order filter + stable count sort, exactly
   like `pickCarry`).
3. Nothing qualifies → `null` (src empty / dest fuller everywhere / all capped). Never lossy.

**Wiring (`crossDino`, after the existing resource-carry block):**
- `wantId = zoneWant(dest, this.harvestedByZone)?.food` (reuse the 438 demand fn from ui/lenses).
- `carry = pickFoodCarry(homeFoodPile, destFoodPile, wantId)`.
- If non-null: `takeFood(home)`, `bankFood(dest)`, `logEvent("<emoji> <name> carried <food> to <destName>")`,
  and the crossing already calls `refreshPlaque()` + `saveGame()` at its end (persistence is additive — the
  per-zone food pile already persists via `foodPileByZone`, no save-shape change).
- **Ceiling:** one unit per crossing (a lean, matching the non-pressured resource carry). `// ponytail:` note
  the ceiling; a pressured multi-unit food shed can follow if a zone visibly stays glutted.

**Acceptance criteria (447):**
- [ ] `pickFoodCarry` returns the wanted id when directed and src has it and dest is lighter; the most-stocked
      lighter-in-dest id otherwise; `null` when src empty, dest fuller of every src id, or all dest-capped.
- [ ] Pure: never mutates `src`/`dest`; deterministic on ties (FOODS order).
- [ ] A dino crossing bowl→grove with the bowl holding a food the grove is lighter on moves exactly one unit:
      bowl pile −1, grove pile +1, and a `📦`/food-emoji ticker line names it.
- [ ] A crossing where the source zone has no food the dest is lighter on moves nothing (piles unchanged, no line).
- [ ] The instant `__migrate`/`relocate` path still carries nothing (parity with resource carry).
- [ ] build clean; vitest green (new foodstore specs); e2e green (new crossing-food-carry spec).

---

## Lore track — BACKLOG-451: The courier's pride

**What:** A dino that actually ferries food across the edge (447 moved a unit) is the bowl's first *courier*.
At the crossing it shows a 📦 pride beat and files a "carried &lt;food&gt; to &lt;zone&gt;" memory; that memory
rides the existing store and feeds the next greeting (`recall` → `recentMemory` is already passed to `greet`),
so the pride reads a beat later in dialogue too — no new greet field.

**Design (pure helpers, foodstore.ts, beside the courier's cargo it describes):**
- `courierMemory(zoneName: string, foodEmoji: string): string` → e.g. `"you carried 🍓 to The Grove when its
  stores ran short"`. Twin of `storesFedMemory`.
- `courierLine(): string` → `'📦'` — the pride bubble shown at the crossing.

**Wiring (`crossDino`, inside the 447 food-carry success branch — same seam):**
- After the food unit moves: `this.memory = remember(this.memory, d.name, courierMemory(destName, foodEmoji))`
  and `this.showBubble(d, courierLine())` (mirrors the grove-arrival beat 339 already in `crossDino`).
- Only fires when a unit actually moved (dest was genuinely short), so a no-op crossing earns no false pride.

**Acceptance criteria (451):**
- [ ] `courierMemory` names the food emoji + dest zone; `courierLine` is the 📦 bubble. Pure, unit-tested.
- [ ] When a crossing ferries food, the carrier shows the 📦 beat and gains a courier memory (visible via the
      dino's recalled memory / the next greeting reading it).
- [ ] A crossing that ferries *nothing* files no courier memory and shows no 📦 beat.
- [ ] Deterministic under stub/fallback (no model dependency); the memory is the only greeting hook (reuses
      the existing `recentMemory` path — no NPCBrain surface change).

**Shared-seam note:** both tracks touch only `crossDino` (+ foodstore.ts helpers/tests). Build the 447 food
move first; 451 hangs its two lines inside that same success branch. One diff, two verdicts.
