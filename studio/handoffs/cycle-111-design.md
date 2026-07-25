# Cycle 111 — Design (two tracks)

## Lore track — BACKLOG-459 (Come for the plenty)

### Item
BACKLOG-459 [social] — a scarcity migrant arriving in a richer zone is met by a resident with a wry
welcome + a small bond.

### Why this cycle
M7's last open Lore arc. 450 moves a mouth toward plenty; 457 gives that mouth a reason it leaves (the
🍃 greener-ground beat, already firing in `crossDino` on a `reason === 'scarcity'` crossing); 458 lets
plenty gossip ahead of the body. What's missing is the *far side* — the ground it arrives at is silent.
This makes the arrival a two-sided social moment: the resident who watches the pantry-poor drift in for
the food gives a wry welcome, and a small mutual bond forms. The exact mirror of 452's homecoming welcome
(same `crossDino` seam, same nearest-resident greeter, same `strengthen` bond), but wry (a newcomer, not
a returner).

### What ships
- When a dino crosses into a zone on a **scarcity** move (dest genuinely richer than home — the same
  condition the 🍃 greener-ground beat fires on) **and it is not a homecoming**, the nearest resident of
  the destination zone gives it a **wry welcome**: a 😏 speech bubble over the greeter ("Come for the
  plenty, have you?"), a small mutual **bond bump** between greeter and migrant, a ticker line, and a
  memory on each side.
- The migrant files a "welcomed to `<zone>`" memory; the greeter files a "gave `<migrant>` a wry welcome"
  memory (both ride the existing store → surface in later greetings, like 452's welcome).
- **Nobody home** is a legitimate read: if the destination zone has no other resident near enough, the
  crossing still happens, just unwitnessed (mirrors 452 exactly). The greener-ground 🍃 beat still fires.
- Fires on the visible crossing path only (`crossDino`), never the instant relocate/`__migrate` path.

### Acceptance criteria
- [ ] A scarcity crossing (dest richer than home) into a zone that has ≥1 other resident produces a wry
      welcome: greeter shows the 😏 bubble, a `👋`/wry ticker line naming greeter + migrant is logged.
- [ ] The greeter↔migrant bond strengthens by the welcome amount (a small, positive delta; assert bond
      after > before).
- [ ] The migrant carries a "welcomed"/arrival memory and the greeter a "gave a wry welcome" memory after
      the crossing (both readable via the memory store / a dev hook).
- [ ] The wry welcome line is distinct from 452's "welcome home" line (contains the wry 😏 register, not
      the 🏡 homecoming string).
- [ ] A **homecoming** crossing (returning to a settled root zone) still fires 452's welcome-home, NOT the
      459 wry welcome (the two are mutually exclusive — homecoming wins).
- [ ] A **non-scarcity** crossing (homesick / lateral / downhill) fires no wry welcome.
- [ ] A scarcity crossing into an **empty** destination fires no wry welcome and does not throw; the
      greener-ground 🍃 beat still fires.
- [ ] Build clean, unit + e2e green, no regression in the 452 homecoming specs or the 457 greener-ground
      spec.

### Out of scope
- Temperament-shaded welcome voices (a prickly resident's welcome vs. a warm one's) — a follow-up; ship
  one wry deterministic line this cycle.
- LLM-coloured welcome text — deterministic line only (the NPCBrain boundary stays; no inference added).
- The migrant answering back / a two-line exchange — one-sided wry welcome + bond is the beat.

### Constraints
- Reuse the 452 seam: `pickNearest` for the greeter, `strengthen` for the bond, the same
  `reason === 'scarcity' && !homecoming` guard the greener-ground beat already uses. Put the pure helpers
  in a new small `world/plentywelcome.ts` (line + event + memories + bond const), mirroring `belonging.ts`.
- Must not disturb the 452 homecoming block or the 457 greener-ground block — the wry welcome is an
  **additional** branch under the same scarcity guard, ordered so homecoming still short-circuits it.
- File overlap with structure track: **none in the pure modules**; both edit `WorldScene.ts` (459 the
  `crossDino` arrival, 455 a new per-day hook + food-store wiring) — different methods, sequence 455 first
  then 459 to keep the diff clean.

---

## Structure track — BACKLOG-455 (A pantry that spoils)

### Item
BACKLOG-455 [core] — banked food sitting at/near a zone's cap slowly decays across in-game days.

### Why this cycle
The granary (454) gave the economy a *source* — building lifts a zone's food cap 6→9. But banked food is
immortal, so a glutted pantry pins at cap forever: nothing spends down, and because the ferry (447) only
flows toward a *lighter* neighbour, two full zones deadlock and the milestone's flows go stagnant. 455 is
the *sink*: a hoard at/near its zone's cap bleeds one unit per in-game day toward a safe floor, so sitting
on a glut costs something and the pressure to ferry / spend (444) / eat stays live. Cap up (454), now cap
bites (455) — the two halves of "the economy has weight."

### What ships
- A pure `world/spoilage.ts`: `spoilFood(pile, cap)` returns a new pile with **one unit removed from every
  food id at/near `cap`**, where "at/near" = `count >= cap - SPOIL_MARGIN` (SPOIL_MARGIN = 1, the
  calibration knob). Self-limiting: a static hoard bleeds from cap down to a floor of `cap - SPOIL_MARGIN - 1`
  (e.g. 6→5→4-stop; a granary'd 9→8→7-stop) and no further, so a circulating zone is never starved.
- WorldScene fires spoilage **once per in-game day** via an `onHour` day-boundary hook (mirrors the season
  turn / dawn chorus: live-only — `onHour` never fires on a restore/away `clock.set`, so restore doesn't
  double-spoil), using each zone's **granary-aware cap** (`granaryFoodCap(hasGranary(zone))`).
- A spoilage that actually removes a unit logs a ticker line (`🥀 <zone>'s <food> spoiled`) — no silent
  change (CHARTER §Quality bar).
- Dev hooks: `__spoilFood()` runs one day's spoilage pass and `__foodStore(zone)` reads a zone's pile, so
  QA can assert the decay deterministically.

### Acceptance criteria
- [ ] `spoilFood`: a pile at the flat cap (6) for a food id → that id becomes 5 after one pass; a second
      pass → 4; a third pass → **still 4** (self-limits at the floor `cap - 2`).
- [ ] `spoilFood`: an id **below** the near-cap threshold (≤ cap-2, e.g. 4 of 6) is left unchanged (a
      circulating pantry never spoils).
- [ ] `spoilFood` with a **granary cap of 9**: an id at 9 → 8 → 7 → stops at 7 (floor scales with cap).
- [ ] `spoilFood` is pure: it returns a new pile and never mutates the input; an empty pile returns empty.
- [ ] In-world: a zone seeded to cap and advanced one in-game day (via the day hook / `__spoilFood`) reads
      one less of the capped id on `__foodStore`; a 🥀 ticker line is logged.
- [ ] A restore / clock jump (`__setClock`) does **not** trigger a spoilage pass (live-only, no
      double-decay).
- [ ] Build clean, unit + e2e green, no regression in the 446 food-store or 454 granary specs.

### Out of scope
- Spoilage during a long absence / the 106 away digest — deferred to **BACKLOG-462** (455's live-only spine
  is the honest first slice; away-catch-up spoilage rides the day-count math there).
- Seasonal spoilage rate (winter quickens it) — that's **BACKLOG-461** (the lean season), which reads 455.
- Per-food-id different spoil rates / a "freshness" clock per unit — one uniform gentle decay this cycle.

### Constraints
- Deterministic, no `Math.random` in the spoil decision (BACKLOG-456 flake discipline).
- Must thread each zone's **granary cap**, not the flat `FOOD_STOCKPILE_CAP`, so a granary'd zone's floor
  scales (reuse `granaryFoodCap`).
- Additive save only — no new persisted field required (the `lastSpoilDay` tracker is transient, like
  `lastSeasonDay`/`lastDawnDay`; init it at setup and on the restore/`__setClock` path so no spurious
  catch-up spoil).
- File overlap with lore track: both edit `WorldScene.ts` only (different methods). Sequence 455 first.
