# Cycle 81 — QA

**Build:** ✅ `npm run build` clean (tsc + vite).
**Unit tests:** ✅ **838 passed** (88 files; +11 this cycle — 5 loner-friend, 6 directed-carry).
**E2E tests:** ✅ **255/256** — the lone failure is `cycle-069-zone-objects:58` (resource gatherable-only-in-own-zone), the catalogued rotating parallel-load flake: **green isolated 3/3** under `--workers=1`. It lives in the zone-gate `checkGather` path, untouched by this diff (the change is in `crossDino` carry + the loner meet-site). Both new specs green in the full run (`cycle-081-loner-friend`, `cycle-081-directed-carry`).

## Lore track — BACKLOG-369 (The loner finds a friend)

| Criterion | Status | Evidence |
|---|---|---|
| Fresh bowl: `__isLoner('Rex')` true before bonding | PASS | e2e `cycle-081-loner-friend:19` asserts `isLoner(Rex)===true` at boot |
| After `__bondPair` to ≥ floor, `__isLoner('Rex')` false | PASS | same spec — after `__bondPair('Rex','Mossback',10)`, `isLoner` false |
| Transition files exactly one loner-friend memory | PASS | same spec — `friendNotes(memory(Rex))` length 1 (text contains "not so alone") |
| One-shot — a 2nd peer adds no further entry | PASS | same spec — after `__bondPair('Rex','Sunny',10)`, count stays 1 |
| Never-a-loner dino gets no loner-friend memory on a bond rise | PASS | e2e `cycle-081-loner-friend:40` — Glade's count unchanged on a 2nd bump |
| `loner.ts` stays pure (no Phaser/WebLLM) | PASS | imports only `bonds`/`movement`; unit `cycle-081-loner-friend` runs in Node; build clean |
| No save-format change (transient guard) | PASS | `lonerFriended` is a transient `Set` (no save field, no `SAVE_VERSION` bump); the memory is the persistent record |

**Bugs found:** none.
**Recommendation:** **APPROVE.**

## Structure track — BACKLOG-356 (Directed carry)

| Criterion | Status | Evidence |
|---|---|---|
| Picks largest craft-deficit kind src can supply & dest accepts (`{stone:2,branch:1}`→`{}` ⇒ `branch`) | PASS | unit `cycle-081-directed-carry` #1 (and asserts `pickCarry` differs → `stone`, proving it's directed) |
| Dest fully stocked → falls back to `pickCarry` | PASS | unit #2 (`directedCarry === pickCarry`, returns the spare `stone`) |
| Respects dest cap — capped kind skipped | PASS | unit #4 (branch at cap → carries stone) |
| Empty src → `null` | PASS | unit #5 |
| Deficit tie deterministic (branch before stone) | PASS | unit #6 |
| E2E: bowl `{stone:2,branch:1}`, grove empty, cross ⇒ grove gains **branch**, not stone | PASS | e2e `cycle-081-directed-carry:36` — grove.branch 1, grove.stone 0 |
| Carry conserved/lossless (`takeResource`/`bankResource`) | PASS | same e2e — bowl.branch 0 (−1), bowl.stone 2 untouched; cycle-077 conservation spec still green |

**Bugs found:** none. cycle-077-carry (the 329 conservation spec) remains green — directed carry is a smarter *choice* on the same transfer path.
**Recommendation:** **APPROVE.**

Both tracks → APPROVE. phase → validator-pending.
