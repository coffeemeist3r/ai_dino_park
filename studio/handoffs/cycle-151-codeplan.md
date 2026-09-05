# Cycle 151 — Code Plan

> Solo cycle (CHARTER v8). One track. No lore section.

## Structure track — BACKLOG-495

### Prior art (reuse, do not reinvent)

Everything this item needs already exists; the whole point is that it exists in twelve places instead
of one.

| Need | Already there |
|---|---|
| clear the founding ruin/piles/ledger | `window.__clearFounding()` — already derives from `Object.keys(FOUNDING_PILES)` |
| move a dino between grounds | `window.__migrate(name, zone)` |
| who is where | `window.__dinoPositions()`, `window.__homeZone(name)` |
| a ground's pile | `window.__pilesByZone()`, `window.__zoneStockpile(z)` |
| the heap on a ground's bank tile | `window.__bank(z)` -> `{ tile, step, total, visible }` (BACKLOG-504) |
| the founding cairn | `window.__cairns()` |
| cross the keeper to a ground | `window.__setZone(id)` |
| step thresholds | `bankStep` / `pileStep` / `PILE_STEPS` in `game/src/world/bank.ts` |
| totals + cap | `pileTotal`, `STOCKPILE_SOFT_CAP` in `game/src/world/resource.ts` |
| the founding state | `game/src/world/founding.ts` |
| the claim register | `REACHABILITY_REGISTER` / `darkEntries()` in `game/src/world/reachability.ts` |

**No new dev hook is needed.** `__bank(z)` takes an optional zone and already reports `step`, `total`
and `visible`, which is every read the new spec makes. Adding a hook here would be the twelfth
instalment this item exists to stop.

### Files

Seven files. Well inside the ~15 the charter allows, because the seam's value is in *removing*
scattered knowledge, not adding modules.

1. **`tests/e2e/helpers.ts`** (edit, the bulk of the work)
   - `export type FoundingFixtureName = 'as-shipped' | 'all-bowl' | 'empty-grounds' | 'bare';`
   - `const FOUNDING_FIXTURES: Record<FoundingFixtureName, { why: string; apply(page): Promise<void>; verify(page): Promise<string | null> }>`
     — `verify` returns a **reason string or null**, so the throw site is one place and every message
     is shaped identically.
   - `export async function foundingState(page, name)` — `apply` then `verify`, throwing
     `` `founding fixture '${name}' did not hold: ${reason}` `` on a non-null reason.
   - `gatherToBowl` -> `foundingState(page, 'all-bowl')`; `emptyGrounds` -> `foundingState(page, 'empty-grounds')`.
     Both keep their doc comments, gain a `@deprecated` line pointing at the seam. **No spec edits.**
   - Fixture bodies, all through existing hooks:
     - `as-shipped`: apply = no-op. verify = the founding cairn is present, and every ground in
       `FOUNDING_PILE_ZONES` (see 3) has a non-empty pile with the expected step.
     - `all-bowl`: apply = migrate everyone not on `bowl` to `bowl`. verify = no dino has a
       `__homeZone` other than `bowl`; the reason names the first offender and its ground.
     - `empty-grounds`: apply = `__clearFounding()`. verify = every entry of `__pilesByZone()` is
       empty and `__cairns()` holds no cairn at the founding ruin's tile; the reason names the ground
       or the tile.
     - `bare`: apply = the other two in order. verify = both reasons, first non-null wins.
   - The three shipping-fixture facts the e2e side needs (which grounds are stocked, and to what step)
     must **not** be retyped here. They are read at runtime from a tiny hook-free source: a new
     exported constant in the game (item 3) that the e2e imports directly — `tests/e2e` already
     type-checks against `game/src` (see existing spec imports), so this is a plain import, not a hook.

2. **`game/src/world/founding.ts`** (edit)
   - `FOUNDING_PILES` gains `bowl` and `ridge`:
     `{ [BOWL_ID]: { branch: 1 }, [GROVE_ID]: { stone: 2 }, [RIDGE_ID]: { obsidian: 3, stone: 1 } }`
   - Import `BOWL_ID` / `RIDGE_ID` from `./zones` (BOWL_ID is already imported).
   - Rewrite the constant's doc comment: it currently argues *why only the Grove is stocked*, which is
     now false. The new comment states the reachability claim (`pile_1..3` all present on a fresh save,
     the frontier deliberately bare, the Grove untouched above `REPAIR_COST`).

3. **`game/src/world/founding.ts`** — same file, new export:
   - `export const FOUNDING_PILE_STEPS: Record<string, number>` derived as
     `mapValues(FOUNDING_PILES, bankStep)`. One derived read, used by the register entry, the unit
     spec and the e2e fixture, so none of the three retypes a step number.
   - Watch the import direction: `founding.ts` -> `bank.ts` must not create a cycle. `bank.ts`
     currently imports nothing from `founding.ts`; confirm with a grep before adding the import, and
     if it does, derive in `reachability.ts` instead (which already imports both).

4. **`game/src/world/reachability.ts`** (edit)
   - New entry appended to `REACHABILITY_REGISTER`:
     ```
     id: 'BACKLOG-495/504',
     system: 'the banked heap on a ground shows every size the studio drew for it, on the first frame',
     fact: 'the founding piles stock enough grounds to reach each drawn step exactly once',
     holds: () => new Set(Object.values(FOUNDING_PILE_STEPS)).size === PILE_STEPS.length
                  && !Object.values(FOUNDING_PILE_STEPS).includes(0),
     ```
   - `PILE_STEPS` and `FOUNDING_PILES` are both already imported here or trivially importable.

5. **`tests/unit/cycle-151-founding-piles.test.ts`** (new)
   - `bankStep` over the stocked grounds is exactly `{1, 2, 3}`.
   - `saltpan` and `hollow` are absent from `FOUNDING_PILES`.
   - `pileTotal(FOUNDING_PILES[GROVE_ID]) >= REPAIR_COST` (BACKLOG-488 unchanged).
   - every `pileTotal < STOCKPILE_SOFT_CAP`.
   - the Ridge's stock includes the Ridge's own exclusive kind (`quarryKind()`).
   - `darkEntries()` is empty and the register contains `BACKLOG-495/504`.

6. **`tests/e2e/cycle-151-founding-fixture.spec.ts`** (new) — the seam and the reachable half, one file.
   - `foundingState(page, 'as-shipped')` passes on a fresh boot.
   - `foundingState(page, 'all-bowl')` then every `__homeZone` is `bowl`.
   - `foundingState(page, 'empty-grounds')` then every pile in `__pilesByZone()` is empty and no cairn
     sits on the founding ruin tile.
   - `foundingState(page, 'bare')` satisfies both.
   - **the reachable half:** boot fresh, then for each of `bowl`, `grove`, `ridge` — `__setZone(z)`,
     `settle(page)`, and assert `__bank(z)` reports `visible === true` with the expected `step`; then
     `__setZone('saltpan')` and assert `visible === false`. Steps come from `FOUNDING_PILE_STEPS`,
     not typed out.
   - a negative test for the throw: after `__setZone` / `__migrate` puts a dino back on the grove,
     `foundingState(page, 'all-bowl')`'s verify is re-run directly and the message contains
     `'all-bowl'` and the dino's name. (Drive this through the exported fixture table rather than by
     breaking the game.)

7. **`BACKLOG.md`** — Validator's, not the Coder's. Listed so nobody else edits it.

### Expected fallout (this is the work, not a surprise)

Moving `FOUNDING_PILES` is exactly the operation that reddened 16 specs in cycle 136. Grounds `bowl`
and `ridge` now boot with a non-empty pile, so any spec that assumed an empty bowl stockpile —
carry, craft, stockpile, prosperity, capacity, spend-lens — may fail.

**The repair, in priority order, and no other:**
1. If the spec's subject is *not* the founding state -> add `await foundingState(page, 'empty-grounds')`
   (or `'bare'`) after `boot`. That is the item shipping.
2. If the spec's subject *is* the founding state -> update its expectation to the new one and say so
   in a comment naming BACKLOG-495.
3. **Never** re-flatten `FOUNDING_PILES` to make a spec green, and **never** add a twelfth ad-hoc
   helper. If a spec needs a founding shape none of the four names covers, that is a fifth name in
   the table, with a `why` line — which is the seam working.

### Test plan

- `npm run build`
- `npx vitest run` (from repo root — the root config covers `tests/unit` **and** `game/src`; running
  from `game/` finds only ~70 of them)
- `npx --yes kill-port 5173 && npx playwright test`
- Grep gate: `@mlc-ai/web-llm` imported only under `game/src/ai/`.

### Blockers

None known at plan time.

---

## Shipped

Nine files (seven planned + two the fallout named), all green.

- `game/src/world/founding.ts` — `FOUNDING_PILES` stocks bowl/grove/ridge; new derived
  `FOUNDING_PILE_STEPS`; the constant's doc comment rewritten to state the reachability claim.
- `game/src/world/reachability.ts` — new `BACKLOG-495/504` register entry.
- `tests/e2e/helpers.ts` — `FoundingFixtureName`, `FOUNDING_FIXTURES`, `foundingState(page, name)`;
  `gatherToBowl` / `emptyGrounds` now one-line aliases, deprecated in comment, **zero call-site edits**.
- `tests/unit/cycle-151-founding-piles.test.ts` (new) — 8 pins on the pile move + the register.
- `tests/e2e/cycle-151-founding-fixture.spec.ts` (new) — 6 specs: four fixture names, the throw, and
  the walk across three grounds.

**Fallout, repaired by the plan's own priority order and no other way:**
- `tests/unit/cycle-136-founding.test.ts` — *subject is the founding state* -> expectation updated
  ("stocks only the ruin's ground" -> "stays modest"), amendment reasoning in the comment.
- `tests/unit/cycle-141-bank.test.ts` — *subject is the founding state* -> "leaves the bowl bare"
  became "leaves room for the first gathered unit to show", which is the reason the old test gave.
- `tests/e2e/cycle-141-bank.spec.ts` — one test's subject is the founding state (expectation grew:
  three grounds, three sizes, bare frontier); the other's is the step machinery -> named
  `foundingState(page, 'empty-grounds')`.
- `tests/e2e/cycle-065-gather-grace.spec.ts` — subject is the grace window -> named the fixture.

`FOUNDING_PILES` was never re-flattened and no twelfth ad-hoc helper was written.

### Deviation from plan, noted

Plan item 1 said the e2e side would import the shipping steps "directly, since `tests/e2e` already
type-checks against `game/src`". It does, and it works — `helpers.ts` imports `FOUNDING_PILE_STEPS`
and `FOUNDING_RUIN` and passes them into `page.evaluate` as serializable arguments. Worth writing down
because it is the mechanism that makes `'as-shipped'` self-updating: the fixture does not know any
founding number, it asks the game.

### Gates

- `npm run build` — clean
- `npx vitest run` (root) — **2458 passed**, 3 skipped, 236 files
- `npx playwright test` — first run 4 failed / 661 passed; three were the pile move (repaired above)
  and `cycle-011-movement` passed isolated and again on the full re-run — the known parallel-load
  flake, noted not chased. Final full run: **665/665 passed**.
- `@mlc-ai/web-llm` imported only by `game/src/ai/webllm.worker.ts` and `game/src/ai/webllmBrain.ts`.

### Blockers

None.
