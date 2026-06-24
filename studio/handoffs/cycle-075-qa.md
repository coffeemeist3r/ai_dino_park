# Cycle 75 — QA

**Build:** ✅ `npm run build` clean (type-check passes).
**Unit tests:** ✅ 768 passed (80 files), incl. `groveword.test.ts` (7) + `plaque.test.ts` zone block (+5).
**E2E tests:** ✅ 238 passed (full run, ~2.8m), incl. both new cycle-075 specs. Note: the two new specs hit the known cold-boot `__ready` flake on a first cold-server run (memory: `e2e-boot-flake` — cold Vite/Phaser, not the feature); green on every warm run and in the full suite. Not a regression.

---

## Lore track — BACKLOG-342: Tell of the grove

| Criterion | Status | Evidence |
|---|---|---|
| `spreadGroveWord` pure: plants on a speaker with grove news, null without | PASS | groveword.test.ts "plants the word on the listener" / "yields null and an unchanged store" |
| `speaker===listener` → null | PASS | groveword.test.ts "does not gossip with itself" |
| News memory shareable + token; spread line carries RUMOR_MARK (1 hop) | PASS | groveword.test.ts "memory is shareable and carries the token" / "carries RUMOR_MARK" / "a heard grove rumor is not re-shared" |
| A grove→bowl return crossing files the news in the dino's ring | PASS | cycle-075-grove-word.spec.ts — `__memory().Rex` contains "pond over in the grove" after the return |
| Cascade picks grove word (rumor + 🌿 log) when no cold/warm/relief | PASS | e2e `__spreadGroveWord('Rex','Mossback')` returns the rumor, listener remembers it; cascade rung at WorldScene with the 🌿 else-if log |
| Precedence: a dino with both cold + grove news leads with cold | PASS | groveword.test.ts "cascade order… still leads with the cold" (spreadColdWord fires); rung order in WorldScene (cold before grove) |
| Outbound bowl→grove crossing files no grove news | PASS | `crossDino` gates the file on `dest === BOWL_ID`; covered implicitly (only the return adds the memory in the e2e) |
| No save change; `groveword.ts` imports no `ai/` backend; build clean | PASS | groveword imports only memory + gossip; SAVE_VERSION untouched; build ✅ |

**Bugs found:** none.
**Recommendation:** APPROVE.

---

## Structure track — BACKLOG-316: Zone indicator

| Criterion | Status | Evidence |
|---|---|---|
| `zonePopulations` pure: counts by home zone, unmapped → fallback, all ZONES ids present | PASS | plaque.test.ts "counts each name by home zone…" / "seeds an empty zone to 0" |
| `zoneTallyLine` marks only the active zone with ▸ | PASS | plaque.test.ts "marks only the active zone with ▸" (both bowl-active and grove-active asserted) |
| Plaque shows the tally as last line; default all-bowl reads `▸Pocket Cretaceous N · The Grove 0` | PASS | plaque.test.ts "appends a zones line…"; e2e initial tally matches `/▸Pocket Cretaceous \d+ · The Grove 0/` |
| After a zone switch the ▸ marker moves and re-renders | PASS | cycle-075-zone-indicator.spec.ts — `__setZone('grove')` → tally contains `▸The Grove`, not `▸Pocket Cretaceous` |
| Migrating a dino moves the population (bowl −1, grove +1) | PASS | e2e — `__migrate('Rex','grove')` → tally contains `The Grove 1`, not `The Grove 0` |
| `__plaque()` exposes the tally for e2e | PASS | `__plaque().zoneTally` read throughout the spec |
| No save change; existing plaque tests stay green | PASS | the prior population/day/generations/stores tests pass unchanged; SAVE_VERSION untouched |

**Bugs found:** none. The `▸` arrow renders fine (no tofu) — the canvas already renders emoji in this plaque.
**Recommendation:** APPROVE.
