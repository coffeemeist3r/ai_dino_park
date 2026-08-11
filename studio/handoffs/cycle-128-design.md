# Cycle 128 — Design

Two tracks, disjoint. Lore: **BACKLOG-401** pecking-order memory. Structure: **BACKLOG-480** landmark
upkeep + reversible disrepair.

---

## Lore track — BACKLOG-401: the hatch remembers who

### The gap
`checkFeeding` decides a contested drop with `standsGround(eater.traits.bravery)` — one number, the same
against every opponent forever. Four cycles of beats (375/387/390/394) file memories that *name* the
other dino and nothing reads the name.

### Spec

New pure module `game/src/world/pecking.ts`. Nothing persisted: it derives from the same 6-slot recall
ring `manner.ts` (402) reads, so a disposition is *recent* history and fades as the ring rolls — the
same discipline that kept 402 from becoming a permanent script.

**Per-opponent score**, parsed out of this dino's own memories (its point of view only):

| memory (this dino carries) | item | toward that name |
|---|---|---|
| `you stood your ground and kept your food from X` | 390 | **+2** confident |
| `you shouldered past X and snatched the food first` | 387 | **+1** confident |
| `you stepped back and let X eat first` | 375 | **−1** wary (deference, not fear — hence the light weight) |
| `X wouldn't budge — you slunk off` | 394 | **−2** wary |

`dispositionToward(memories, other)` → `'confident' | 'wary' | null`, null inside a dead band
(|score| < 2) so a single beat is never a disposition. The threshold is the calibration knob and lives
in the module as a named constant.

**What it changes.** In `checkFeeding`'s gobble branch, the winner's stand/cede call becomes
`holdsAgainst(bravery, disposition)`:

- `confident` → holds even if bravery is below the `standsGround` bar (it has faced this one down before)
- `wary` → cedes even if bravery is above it (this one has beaten it before)
- `null` → **byte-identical to today** (`standsGround(bravery)`), so a fresh park is unchanged

This is deliberately the *winner's* side only. BACKLOG-397 (the gobbler learns who not to push) stays
open and un-poached.

**No silent change** (CHARTER §Quality bar): when the disposition overrides bravery, the existing event
line gains a because-clause naming the history (`— it has faced Rex down before` / `— Rex has beaten it
here before`). The plain-bravery outcome keeps today's line exactly.

**The book.** One optional line per dino, beside the manner line (402): `👊 pecking order: faced down
Rex · wary of Sunny`, listing at most the strongest two of each, or omitted entirely when the dino holds
no disposition. Built by `peckingLine`; a `pecking?: string` field on `BookRow`.

### Acceptance criteria (lore)

1. `dispositionToward` returns `null` for an empty ring, and `null` for a single beat of any kind.
2. Two stands against the same dino → `confident`; one slink → still `null`; two slinks → `wary`.
3. Scores are **per opponent**: stands against Rex do not make a dino confident toward Sunny.
4. A yield weighs less than a slink: one yield + one stand toward the same dino nets `null`, one slink +
   one stand nets `null`, but two slinks + one stand nets `wary`.
5. `holdsAgainst(bravery, null)` equals `standsGround(bravery)` for the whole bravery range.
6. `holdsAgainst` with `confident` is true below the bravery bar; with `wary` is false above it.
7. The specs import `slunkOffMemory` (and any other builder that exists) rather than re-typing the
   strings they match — 127's finding, applied.
8. `peckingLine` returns null with no dispositions, names both sides when both exist, and caps each side
   at two names.
9. In-game: a dino wired with two slink memories against a named gobbler cedes the drop to it even when
   its bravery would stand, and the event line says why. Drivable from a dev hook.
10. A fresh park's contested drops behave exactly as before this cycle (no disposition, no new lines).

---

## Structure track — BACKLOG-480: a landmark that has to be kept up

### Spec

New pure module `game/src/world/upkeep.ts`.

**What is owed.** `upkeepDue(standing)` = `Math.floor(standing / STRUCTURES_PER_UPKEEP)` with
`STRUCTURES_PER_UPKEEP = 2`. So a ground with one landmark owes nothing (a fresh park is inert, 476's
precedent), two or three owe one resource a day, four or five owe two. **Standing** means maintained —
a derelict landmark owes nothing, which is what stops a struggling ground from cascading to zero.

**How it's paid.** From that zone's *resource* stockpile (branch/stone/frond — the same pile the
landmark was built from), one unit at a time from whichever kind is currently largest, so upkeep never
empties a scarce kind while a plentiful one sits full. Ties break in `RESOURCE_GLYPH` key order for
determinism.

**When it can't be paid.** Each unpaid unit drops one standing landmark into disrepair — the **newest**
first, so a ground's founding cairn is the last thing to fall. Disrepair is a flag on the structure
record, never a removal.

**Coming back.** A zone that owes nothing this pass and still has `REPAIR_COST = 1` spare in its pile
repairs one derelict landmark per day — the **oldest** derelict first, the exact inverse of the lapse
order. Reversible by construction.

One entry point, so live and away drive the same code:

```ts
export interface UpkeepPlan { pile: Stockpile; paid: number; lapsed: number; repaired: number }
export function runUpkeep(pile: Stockpile, standing: number, derelict: number): UpkeepPlan
```

`lapsed`/`repaired` are counts; the *choice of which* structure is WorldScene's (newest standing /
oldest derelict), because only it holds the arrays. Away catch-up loops the same function up to `days`
times and breaks when a pass changes nothing (the `spoilFoodOverDays` shape, reused not reinvented).

**Downstream reads — decided per consumer, out loud:**

| consumer | reads |
|---|---|
| `zoneSignals.structures` (prosperity 428) | **maintained** — the index can finally fall |
| granary food-cap lift (`hasGranary` → `granaryFoodCap`) | **maintained** — a rotting granary holds nothing |
| granary one-per-zone gate | **raised** (incl. derelict) — or a ground builds a second beside the first |
| `baseLandmarks` granary gate | **maintained** — you must keep three up to earn the fourth |
| map-lens 🏛️ marker | **raised**, dimmed marker out of scope this cycle (see below) |

**Save:** additive only — `derelict?: boolean` on the existing structure records; absent → false, so
every old save restores with a fully maintained skyline.

**Render:** a derelict landmark draws at reduced alpha in-world (`DERELICT_ALPHA`), so disrepair is
visible where it happens. **Deliberately out of scope:** a new zone-map-lens row or badge. The box has
absorbed five reads in three cycles and the cycle-127 artist note asked that the next feature argue for
the space; upkeep argues on the ticker and in the world instead.

**Ticker (no silent change):** `🛠️ <Zone>'s <glyph> fell into disrepair` and `🛠️ <Zone> patched up its
<glyph>`, plus the pile spend riding the existing save.

### Acceptance criteria (structure)

1. `upkeepDue`: 0 for 0 and 1 standing, 1 for 2 and 3, 2 for 4 and 5.
2. `runUpkeep` on a pile that covers the due: `paid` equals due, pile down by exactly that many units,
   `lapsed` 0.
3. Payment drains the largest kind first; a pile of `{branch:1, stone:4}` paying 2 leaves `{branch:1,
   stone:2}`.
4. An empty pile with 4 standing: `paid` 0, `lapsed` 2 — and nothing goes negative.
5. A partial pile (1 unit, due 2): `paid` 1, `lapsed` 1.
6. Derelict landmarks are excluded from `standing` at the call site, so a lapsed ground owes less next
   pass — proven by a two-pass test that converges instead of cascading to zero.
7. Repair: due 0 (or fully paid) + spare pile + ≥1 derelict → `repaired` 1 and one unit spent; no spare
   or no derelict → `repaired` 0.
8. `runUpkeep` returns the **same pile reference** when nothing at all happens (the `spoilFood` no-op
   contract), so the caller can skip the save.
9. Away catch-up over N days equals N sequential live passes, and stops early once a pass is a no-op.
10. A zone whose only granary is derelict gets the **base** food cap, and still **cannot** build a
    second granary.
11. Prosperity `structures` counts maintained only: derelicting a landmark lowers the zone's score.
12. An old save with no `derelict` field restores every structure maintained (byte-identical behavior).
13. In-game: a dev hook that strips a zone's pile and runs an upkeep pass leaves a visibly dimmed
    landmark and a 🛠️ ticker line; a second pass with a restocked pile patches it back up.
14. A fresh park run through a full in-game day loses no landmark (the inertness bar).

---

## Shared bar (both tracks)

`npm run build` clean · `npx vitest run` green · `npx playwright test` green (or the catalogued
parallel-load flake, re-run isolated) · `@mlc-ai/web-llm` still imported only under `game/src/ai/` ·
additive save only · new logic in pure Node-testable modules with the Phaser glue thin.
