# Cycle 109 — QA

**Environment:** `npm run build` clean (type-check passes). `npx vitest run` (root) **1278/1278** green
(+10 new: scarcity 8, greenerground 2). `npx --yes kill-port 5173` then `npx playwright test` **372/372**
green (+4 new: cycle-109-scarcity). Full-suite run, no flake — cycle-076-news-pull and cycle-078-grove-pull
both green **unmodified**, and the standing `mobile-minds` "long dialogs page" red passed this run too. `grep`
confirms `@mlc-ai/web-llm` only under `game/src/ai/`.

---

## Structure track — BACKLOG-450 (Scarcity moves the herd): 8/8 PASS

1. **PASS** — `zoneAppeal(p,f) = p + f` (weight 1), monotonic in both inputs. `scarcity.test.ts`.
2. **PASS** — `richestNeighbor` picks highest appeal, ties resolve to input order, `[]`→null. `scarcity.test.ts` (3 cases incl. the tie-order flip proving determinism).
3. **PASS** — `poorestResidents` returns the min-appeal subset / all-on-tie / passthrough for ≤1. `scarcity.test.ts`.
4. **PASS** — destination tracks appeal, not adjacency order: with everyone in the Fernreach, a grove dino's `__scarcityDest` is `fernreach` (the *east*/second link), not `bowl` (the primary/first link); pulling everyone to the bowl flips it to `bowl`. `cycle-109-scarcity.spec.ts:34`.
5. **PASS** — `__zoneAppeal('grove')` strictly rises after `__setZoneFoodPile('grove',{berries:6})`. `cycle-109-scarcity.spec.ts:50`.
6. **PASS** — the poorest occupied zone empties first: Rex alone in the grove (strictly poorest) is the deterministic `__maybeMigrate` pick over the richer-bowl residents. `cycle-109-scarcity.spec.ts:58`.
7. **PASS** — cycle-076-news-pull (`Mossback`) and cycle-078-grove-pull (`Sunny`) green **unmodified** in the full run; the grove-pull `told`/`curious` identity picks are untouched (the change is fallback-tier only).
8. **PASS** — build clean; the full migration/crossing e2e set (073/074/076/078/085/095/106/107) green in the 372/372 run.

---

## Lore track — BACKLOG-457 (Left for greener ground): 5/5 PASS

1. **PASS** — `greenerGroundMemory('The Fernreach')` names the zone, reads as the reason, no double article; `greenerGroundLine()` is `🍃`. `greenerground.test.ts`.
2. **PASS** — a scarcity-tagged crossing (Rex grove→bowl, bowl richer) files `The Grove's pantry ran dry, so you went where the food is`, present in Rex's `__memory`. `cycle-109-scarcity.spec.ts:66`.
3. **PASS** — a plain crossing files no greener-ground memory (control: Twitch via `__startMigration`, `reason` unset → no memory). Homesick/homecoming are covered by construction: `tryHomesick` and the homecoming path never set `reason: 'scarcity'`, and the beat is additionally guarded `&& !homecoming`. `cycle-109-scarcity.spec.ts:66` (control half).
4. **PASS** — the `🍃 Rex left The Grove for greener ground in Pocket Cretaceous` ticker names the dino, the zone left, and the zone entered. `cycle-109-scarcity.spec.ts:66` (event assertion).
5. **PASS** — end-to-end: richer-neighbour crossing shows the memory + ticker line; the equal/plain control shows neither.

---

**No screenshots** (no failures). **Verdict input:** both tracks pass every criterion on automated evidence.
Recommend APPROVED on both; this closes Milestone 6 (450 was its last arc) and opens Milestone 7 (457 its
first). phase → validator-pending.
