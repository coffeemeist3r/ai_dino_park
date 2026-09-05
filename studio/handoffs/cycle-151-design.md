# Cycle 151 — Design Handoff

> **Solo cycle (CHARTER v8).** `state.soloCycle = true`. The lore track sits this cycle out; its
> suggested next-up (BACKLOG-113) carries forward to cycle 152 unconsumed. One section follows.

## Lore track — none (solo cycle)

No lore item this cycle, per the Structure-smith's declaration. Nothing to spec, nothing to build,
nothing to judge. The Validator issues one verdict.

---

## Structure track — BACKLOG-495

**Item:** BACKLOG-495 `[infra]` — The fixture nobody names.

### Why this cycle

Three times now a founding constant has moved and taken a crowd of unrelated specs down with it:
cycle 135 spread the cast and reddened ~15, cycle 136 seeded the Grove's ruin and reddened 16 of
which two were about upkeep, cycle 142 found the same class hiding in a dev hook. Each was repaired
with a helper — `gatherToBowl`, `emptyGrounds`, `__seedGranaryReady` — and each helper was the right
fix and the wrong shape, because a helper answers *this* spec's question and never writes down the
question. There is still no single place in the suite that says **what founding state a spec wants**,
which means every spec that doesn't say makes an assertion nobody knows it is making, and the only
instrument that has ever surfaced one is moving the constant — the exact thing CHARTER v7 wants this
studio doing *more* of.

So this cycle gives the suite a **named founding fixture**, and then, in the same fire, **moves a
founding constant through it**. The move is not a demo. `FOUNDING_PILES` stocks exactly one ground,
so of the three drawn heap steps a fresh park has ever shown one, and `pile_3` has never existed on
a new save at all — CHARTER v7's corollary, in a rig the studio drew and then calibrated out of reach.

### What ships

**1. The seam — `foundingState(page, name)` in `tests/e2e/helpers.ts`.**

Four declared fixtures, each a `{ why, apply, verify }` record in one exported table:

| name | means | replaces |
|---|---|---|
| `'as-shipped'` | the founding state production actually ships — applies nothing, **verifies** the shipping facts | the assumption nobody writes down |
| `'all-bowl'` | the whole cast co-located in the bowl, every other ground empty of dinos | `gatherToBowl` |
| `'empty-grounds'` | no founding ruin, no founding piles, no founding bank ledger | `emptyGrounds` |
| `'bare'` | the pre-v7 park: `'all-bowl'` + `'empty-grounds'` | the two called together |

`apply` drives existing dev hooks only (`__migrate`, `__homeZone`, `__dinoPositions`,
`__clearFounding`). `verify` reads production state back through dev hooks and **throws by fixture
name** when the postcondition does not hold — `founding fixture 'all-bowl' did not hold: Bramble is
on grove`. A fixture that silently fails to apply is the failure mode this item exists to end, so
every `apply` is followed by its own `verify` inside `foundingState`.

`gatherToBowl` and `emptyGrounds` stay exported and become one-line aliases onto the seam, so all
~30 existing callers move onto it in this commit without a single spec edit. They are marked
deprecated in their doc comment, not deleted — deleting them is 30 spec edits for no behavior.

**2. The constant moves — `FOUNDING_PILES` stocks three grounds instead of one.**

```
bowl    { branch: 1 }              -> total 1 -> pile_1
grove   { stone: 2 }   (unchanged) -> total 2 -> pile_2
ridge   { obsidian: 3, stone: 1 }  -> total 4 -> pile_3
```

Every drawn step of the heap exists on a fresh save. The Grove is untouched above `REPAIR_COST`, so
BACKLOG-488's mend beat is unchanged. The frontier (`saltpan`) stays bare — BACKLOG-505's unsettled
read is about residents and founders, and nothing here may make the frontier look lived on. Totals
stay under `STOCKPILE_SOFT_CAP` (7). The Ridge's stock is mostly obsidian because obsidian is the
Ridge's exclusive kind (BACKLOG-503) — the ground's heap should be made of the thing that ground is
for.

**3. The move gets a claim — a new `REACHABILITY_REGISTER` entry.**

`'BACKLOG-495/504'` — *every step of the banked heap the studio has drawn exists on a fresh save* —
holding when the set of `bankStep(pile)` values over `FOUNDING_PILES` covers `1..PILE_STEPS.length`.
Derived from the production tables, so a later tuning pass that quietly re-flattens the founding
piles reddens the build naming this item, rather than going unnoticed for months.

### Acceptance criteria

- [ ] `foundingState(page, name)` is exported from `tests/e2e/helpers.ts` and accepts exactly the four
      names `'as-shipped' | 'all-bowl' | 'empty-grounds' | 'bare'` (a union type; an unknown name is a
      type error and a runtime throw).
- [ ] Each fixture's `verify` throws an `Error` whose message contains the fixture name and a concrete
      reason when its postcondition does not hold.
- [ ] `foundingState(page, 'all-bowl')` leaves `__homeZone(d.name) === 'bowl'` for every dino in
      `__dinoPositions()`.
- [ ] `foundingState(page, 'empty-grounds')` leaves every ground's pile empty and the founding cairn
      absent from the scene's cairns.
- [ ] `foundingState(page, 'bare')` satisfies both of the two criteria above in one call.
- [ ] `foundingState(page, 'as-shipped')` passes on a freshly booted park and is exercised by at least
      one e2e spec.
- [ ] `gatherToBowl(page)` and `emptyGrounds(page)` still exist, are still exported, and now delegate
      to `foundingState`; no existing spec file changes its call sites for this reason alone.
- [ ] `FOUNDING_PILES` stocks `bowl`, `grove` and `ridge`; `saltpan` and `hollow` are absent from it.
- [ ] `bankStep(FOUNDING_PILES[z])` over the stocked grounds yields the set `{1, 2, 3}` — every drawn
      step present exactly once.
- [ ] `pileTotal(FOUNDING_PILES[GROVE_ID]) >= REPAIR_COST` still holds (BACKLOG-488 unchanged).
- [ ] Every `pileTotal(FOUNDING_PILES[z])` is `< STOCKPILE_SOFT_CAP`.
- [ ] The new `BACKLOG-495/504` register entry exists and `darkEntries()` is empty.
- [ ] An e2e spec walks a fresh park from the bowl to the Ridge and observes a heap sprite visible on
      each of the three stocked grounds, and none on the frontier.
- [ ] `npm run build` clean, `npx vitest run` green, `npx playwright test` green.

### Out of scope

- **The unit suite's own founding assumptions.** This seam is for the e2e suite, whose specs boot a
  real park. `__seedGranaryReady`'s hardcoded recipe mirror (the cycle-142 sighting) is the same class
  but a different surface; it stays queued.
- **Deleting `gatherToBowl` / `emptyGrounds`.** Aliases now, deprecated in comment. Deleting them is
  thirty spec edits that change no behavior.
- **A lint that forces every spec to name a fixture.** The seam has to exist and be used before a rule
  that everything use it is anything but noise. Note it for a later cycle if the seam holds.
- **New art.** BACKLOG-532 and BACKLOG-518 belong to the Artist.

### Constraints

- No file overlap with a lore track — there is none this cycle.
- `__clearFounding` already iterates `Object.keys(FOUNDING_PILES)`, so the three-ground move must not
  hardcode a ground anywhere; the clear must keep working by derivation.
- Additive save changes only. `FOUNDING_PILES` seeds on the `!save` branch only; a restored save must
  still seed nothing.
- `@mlc-ai/web-llm` stays imported only under `game/src/ai/` (untouched this cycle).
- Do not raise the Grove's pile, do not stock the frontier, do not exceed `STOCKPILE_SOFT_CAP`.
- Expect e2e fallout from the pile move. That fallout is the point: repair it **by naming a fixture**,
  never by re-flattening the constant or by adding a twelfth ad-hoc helper.
