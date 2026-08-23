# Cycle 138 — Design

## Lore track — BACKLOG-421

**Item:** BACKLOG-421 [emergent] The ritual drifts — a dino's tic anchor wanders instead of
being re-chosen from scratch, so the little path reads as a living habit.

### Why this cycle

Milestone 15's open lore arc is "the ritual is a living habit". It is also the arc
BACKLOG-496's worn-ground art was seeded against, and 496 cannot mean anything until this
lands: a scuff mark under an anchor the dino never returns to is litter, not a path.

**Read the code before believing the item's own framing.** 421 says the anchor "pins one
tile". It does not. `WorldScene` sets `ticAnchor[name] = cur` on the first ticcing step of
a stretch and `resetTic` deletes it, so today's anchor is **wherever the wander happened to
drop the dino** — arbitrary, with *zero* continuity between stretches. The defect is the
opposite of the one filed, and it is the same failure: a ritual with no memory of where it
is performed is not a habit either. So the fix is not "make the pin move", it is **give the
ritual a place, then let that place drift**.

### What ships

A **haunt**: one remembered tile per dino, per ground, that its ritual returns to and that
moves one tile each time the ritual is performed there.

- The first time a dino's tic forms on a ground, the tile it forms on becomes its **haunt**
  for that ground. (Same tile as today — a first stretch is unchanged.)
- On every *later* stretch on that ground, the ritual anchors on the haunt, **drifted one
  tile** in a direction that itself wanders (deterministic per dino + drift count, so it is
  a meander, not a straight line). The dino walks back to it and performs there — reusing
  the existing walk-to-anchor path that 414's grief anchor already uses.
- If the dino falls into its ritual **more than `HAUNT_RETURN_RANGE` (6) tiles** from its
  haunt, it does not trek: the old haunt is abandoned and the current tile becomes the new
  haunt. A habit you have wandered away from is a habit you have lost.
- Once the haunt has drifted `HAUNT_DRIFT_NOTED` (4) times, the dino files a one-time
  memory naming the ritual and the fact that the path has moved, and a ticker beat fires.
  That is what makes the drift *legible* rather than merely true.
- The haunts are **persisted** (`ticHaunts`, additive, absent → `{}`), so a reloaded park
  keeps its worn ground.

**Grief (414) still wins.** A dino grieving a friend who crossed away aims at the edge they
left by, exactly as now, and that aimed anchor **does not** touch the haunt — grief is not a
habit, and the haunt must survive it so the ritual returns home afterward.

### Acceptance criteria

- [ ] `game/src/world/tic.ts` exports `HAUNT_RETURN_RANGE`, `HAUNT_DRIFT_NOTED`,
      `driftHaunt(...)` and `hauntAnchor(...)` as pure, Node-testable functions with no
      Phaser and no WebLLM import.
- [ ] `driftHaunt` moves the haunt **exactly one tile** (Chebyshev distance 1) per drift,
      stays within `0..cols-1` / `0..rows-1`, and is deterministic: the same inputs yield
      the same tile on repeated calls.
- [ ] Four consecutive drifts from the same dino are **not all in the same direction**
      (the path meanders) — asserted for at least one seed in the unit suite.
- [ ] A dino's **first** tic stretch on a ground anchors on the tile it stands on — the
      pre-421 behavior, asserted so a first stretch is provably unchanged.
- [ ] A **second** stretch on the same ground, begun within `HAUNT_RETURN_RANGE` of the
      haunt, anchors on a tile **different from** the first stretch's anchor and **adjacent
      to** it.
- [ ] A stretch begun further than `HAUNT_RETURN_RANGE` from the haunt re-seats the haunt at
      the dino's current tile and does **not** walk it back across the ground.
- [ ] A grieving dino (414) still anchors on `griefAnchor`'s edge tile, and its haunt is
      unchanged by that stretch.
- [ ] After `HAUNT_DRIFT_NOTED` drifts, the dino files the drift memory exactly once and a
      ticker line fires exactly once for that dino.
- [ ] `ticHaunts` round-trips through `saveGame`: a park with drifted haunts, saved and
      reloaded, resumes on the same haunts. A save without the key loads with `{}`.
- [ ] e2e: from a fresh save, force two solitary stretches for one dino on one ground via
      the dev hooks and read back the anchor; the second stretch's anchor differs from the
      first's.
- [ ] Build clean, `npx vitest run` green, `npx playwright test` green.

### Out of scope

- The worn-ground **art** (BACKLOG-496) — this ships the path, not the pixels.
- BACKLOG-411 (the warm trace a catch leaves) — the arc's other half, next cycle.
- Cross-zone haunts travelling with a migrating dino: a haunt is per (dino, ground).

### Constraints

- Pure logic in `world/tic.ts`; `WorldScene` stays thin glue.
- Additive save change only; a pre-138 save must load.
- Do not change `TIC_AFTER_STEPS*`, the onset shorteners, or any of 408/413/420/422 — this
  cycle touches **where** the ritual happens, never when it starts or how it reads.
- File overlap with the structure track: both edit `WorldScene.ts` (tic block ~L4450 vs
  `checkCouncilCall` ~L800) and `saveGame.ts`. Sequence lore first, then structure.

---

## Structure track — BACKLOG-489

**Item:** BACKLOG-489 [core] The gate that was written for one door — one shared seam that
tells *seeding* apart from *suppressing*.

### Why this cycle

Last open structure arc of Milestone 15. Cycle 133 found that 485's bill line was correct in
every hook and posted nothing, because the gate it had to pass through was keyed by
**ground** alone and therefore could not tell "this ground has never spoken" from "this
cause has never spoken". 485 was repaired by hand with `!seeding || lean === call`. A
hand-patch at one call site is a bug fixed; the pattern is not.

**The item over-counts itself and the Coder must not chase the extra three.** The
Structure-smith read all four gates 489 names (see `cycle-138-structure.md`): only
`lastWorkCallByZone` (481) and `lastSpendCallByZone` (487) are seed-silently gates. 471
already fires on its first record, 251 is a ring-position window and not a gate of this
shape, and 226 **does not exist** — `sympathyVisit` carries a `ponytail:` comment saying so.
Build the seam against the two real sites. Record the correction.

### What ships

`game/src/world/gates.ts` — a pure, cause-aware announce gate:

- `Cause` = `{ id, seedsSilently }`.
- `CauseLog<T>` = key → causeId → last value recorded.
- `recordCall(log, key, cause, value)` returns the next log plus an `announce` boolean.

Rules, in order:

1. The cause already recorded **this same value** → no announce, log unchanged. (Only a
   change is news — 481's rule, kept.)
2. Nothing at all recorded for this key **and** the cause seeds silently → record, no
   announce. (An opening seating is not a turnover — 481's rule, kept, and now stated as a
   property of the *cause* rather than of the ordinal.)
3. Otherwise → record and **announce**. In particular a cause that has never spoken on a
   key another cause has already spoken on **is news**, which is precisely the case 489
   exists for.

Ported onto it: `checkCouncilCall`'s work call (causes `council` — seeds silently — and
`bill` — does not) and its spend call (cause `council`). 485's hand-rolled
`!seeding || lean === call` is **deleted**, its behavior now falling out of the rules.

### The reachability answer (CHARTER v7)

> *In a fresh save, watched for ten minutes, what does the player see that they could not
> see before?*

**A ground whose council has already called `gather`, and which then loses a landmark,
says so out loud.** Today it says nothing: the standing call already equals the bill's
lean, so the change test is false and 485's line is swallowed in the one case where two
authorities agree — and the *reason* they agree is that the walls are coming down, which is
the thing worth hearing. Under a cause-keyed gate the bill is a different cause and speaks.
**BACKLOG-488 seeds a derelict landmark in the Grove on a fresh save**, so this is reachable
on a brand-new park inside one watch — no six residents, no day boundary.

### Defect repair, in cycle (found while reading `saveGame.ts`)

`catchWarmth` (BACKLOG-422, shipped last cycle) is declared in `SaveData`, written by the
scene's serializer, and **never parsed by `parseSave`** — so `save.catchWarmth` is always
`undefined` and the lifetime ceiling that exists to stop being-found becoming farmable is
reset by every reload. BACKLOG-498 predicted this class of failure by name the same night.
Repair it here, with the general guard 498 asks for:

- Parse and return `catchWarmth` in `parseSave`, in the `foodBanked` idiom.
- Add a **whole-shape round-trip spec**: build a `SaveData` with every optional key
  populated, serialize, parse, and assert deep equality — so the next dropped field fails a
  test instead of shipping. This closes BACKLOG-498.

### Acceptance criteria

- [ ] `game/src/world/gates.ts` is pure (no Phaser, no WebLLM) and unit-tested for all
      three rules above, including: same value → silent; virgin key + seeding cause →
      silent; virgin key + non-seeding cause → announce; **already-seeded key + new cause →
      announce**; recorded cause + changed value → announce.
- [ ] `checkCouncilCall` uses `recordCall` for both the work call and the spend call;
      `lastWorkCallByZone` / `lastSpendCallByZone` and the `!seeding || lean === call`
      branch are gone.
- [ ] Regression: a ground's **first** council work call is still silent; its first spend
      call is still silent; a flip in either still announces in the existing wording
      (`workCallMeaning` / `billCallLine`) — the pre-489 e2e and unit specs pass unchanged.
- [ ] **The reachable beat:** a ground with a standing council call of `gather` that then
      goes derelict emits `billCallLine(zone)` exactly once. Proven by a unit test on the
      gate and an e2e on a fresh save.
- [ ] Regression test on `soundsDiscontent` asserting a ground that has never sounded
      **does** sound on its first qualifying record (pinning the not-a-defect finding).
- [ ] `parseSave` restores `catchWarmth`; a full-shape save round-trips to deep equality; a
      save missing the key loads with the field absent.
- [ ] Build clean, `npx vitest run` green, `npx playwright test` green.

### Out of scope

- Porting 251 / 226 / 222 / 233 — they are not gates of this shape (226 does not exist).
  Leave 226 queued and leave its `ponytail:` comment in place; it is still true.
- Any change to what the calls *mean* (`workCallMeaning`, `billLean`, `spendPriorityFor`).
- Persisting the call log — it stays a live read of a live situation, per 481.

### Constraints

- No save-format change from the gate itself.
- `WorldScene` glue only; the decision lives in `gates.ts`.
- Sequence after the lore track — both touch `WorldScene.ts` and `saveGame.ts`.
