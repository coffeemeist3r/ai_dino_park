# Cycle 101 — QA

**Build:** `npm run build` clean, `tsc --noEmit` clean. **Unit:** `npx vitest run` → **1141/1141 (127 files)**,
including the +11 new (foodweb chaseCount/fearsHunter ×6, lenses zoneWant/model ×5).

## BACKLOG-442 — the hunter's reputation

- **AC1 (chaseCount)** PASS unit — counts only the given hunter's `slipped X's hunt` memories; 0 for an
  unseen hunter / empty / non-hunt store.
- **AC2 (fearsHunter threshold + constants)** PASS unit — true at `WARY_CHASES=2`, false at 1; explicit
  threshold honoured; `WARY_RANGE === STALK_RANGE`, `WARY_CHASES ≥ 2`.
- **AC3 (independent hunters)** PASS unit — a dino chased twice by Twitch, once by Rex, fears Twitch not Rex.
- **AC4 (wariness pass wiring)** PASS review — after `lastStalk` is built, a herbivore with no active
  `fleeFrom` gets `fleeFrom[h] = ` the nearest in-view carnivore within `WARY_RANGE` it `fearsHunter`; the
  existing 367 flee branch (unchanged) then drives the bolt + `fleeing` glyph. `__fleeFrom` exposes the map.
- **AC5 (no false fear)** PASS unit+review — a carnivore under threshold or beyond `WARY_RANGE` is skipped.
- **AC6 (deathless / no save)** PASS review — the pass mutates only `fleeFrom`; roster/needs/memory untouched;
  no save-schema change (fear reads the existing 367 memory).
- **AC7 (build/boundary)** PASS — build+tsc clean; WebLLM stays `ai/`-only (foodweb + WorldScene only).

## BACKLOG-438 — a zone wants what it can't grow

- **AC1 (null until surplus)** PASS unit — `zoneWant(z, {})` and all-zero harvests → null.
- **AC2 (productive-farmer lean)** PASS unit — the grove requests from whichever neighbour (bowl/Fernreach)
  has the greater harvest output.
- **AC3 (tie → link order)** PASS unit — equal output → the first neighbour in `zoneNeighbors` (grove→bowl).
- **AC4 (fields)** PASS unit — `food`/`glyph`/`from`/`fromName` match `cropOf(from)` + `zoneById(from)`.
- **AC5 (model + render)** PASS unit+review — `zoneMapModel` attaches `want` per entry; 3-arg call → all null;
  `drawZoneMap` appends `wants <glyph>◂<neighbour>` only when set (`boxH` 64→78 for the line).
- **AC6 (additive / no save)** PASS review — reads the existing `harvestedByZone`; no schema change; older
  `zoneMapModel` callers stay valid (no hand-built `ZoneMapEntry` literals in the repo).
- **AC7 (build/boundary)** PASS — build+tsc clean; WebLLM `ai/`-only.

## e2e

`npx --yes kill-port 5173` then Playwright. First cold run of the lens specs (091-zone-map / 021-lenses)
hit the **documented cold-boot timeout** (helpers.ts boot) on 5 specs; a warm re-run is **6/6 green**. The
tick/needs siblings that exercise 442's flee/deathless path are green warm too: **cycle-080-needs 3/3**
(incl. the deathless-population pin — the invariant 442's wariness pass must not violate) and
**cycle-097-hunger-voice 3/3** (440's compose twin). No bespoke 442/438 e2e — both would need a test-only
memory/harvest injection hook; the mechanisms (flee branch, zone-map render) are sibling-proven and the pure
logic is unit-pinned, so I flag the absence rather than add a mutation hook (same call as cycle 100).

**Recommend APPROVE both.** phase → validator-pending.
