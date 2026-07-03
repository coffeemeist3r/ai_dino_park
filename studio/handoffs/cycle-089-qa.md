# Cycle 89 — QA

**Build:** ✅ clean (type-check passes).
**Unit tests:** ✅ 936 passed (+8 this cycle: 3 fond-caught + 5 regrowth).
**E2E tests:** ✅ 280 passed / 1 parallel-run failure (`cycle-028-realtime` — the catalogued cold-boot flake,
green 2/2 isolated on re-run; does not touch this diff). Both new specs green in the full run:
`cycle-089-fond-caught` 1/1 + `cycle-089-regrowth` 1/1.

web-llm boundary: clean (`world/tic.ts` imports only the pure `ai/brain` interface; nothing outside `game/src/ai/`
touches web-llm). No save-format change either track.

## Lore track — BACKLOG-413 Fond of being caught

| Criterion | Status | Evidence |
|---|---|---|
| Fond (≥8) mid-tic dino shows 😊 not 😳 on menu open | PASS | `openToneMenu` picks `fond ? '😊' : '😳'` via `fondOfBeingCaught(heartsFromPoints(...))`; e2e drives `__setHearts(name,10)`+`__inventTic` (glyph path exercised alongside the opener assertion) |
| Fond caught reply prefixed with the warm `fondOpener()` | PASS | `cycle-089-fond-caught` asserts the line contains "don't mind" and NOT "caught mid-fidget" |
| Fond caught dino files a *glad* memory, once per stretch | PASS | e2e asserts memory contains "glad it was them"; `ticCaughtFiled` guard reused unchanged (one file per stretch) |
| Non-fond (<8) mid-tic dino unchanged from 408 (😳 + bashful) | PASS | e2e second dino at `__setHearts(name,0)` → line contains "caught mid-fidget", not the fond opener; `cycle-088-caught-mid-tic` still green |
| Not-mid-tic greet byte-identical to pre-413 | PASS | `caught` guard unchanged — the fork only fires when `caughtTic === target.name`; cycle-088 plain-greet assertion still green |
| No points/bond change — 413 only colours the line + files a memory | PASS | diff touches only the glyph, the opener string, and the memory text; `recordTone`/affinity path untouched |
| `fondOfBeingCaught`/`fondOpener`/`fondCaughtMemory` pure + unit-tested | PASS | `cycle-089-fond-caught.test.ts` 3/3 (boundary at FOND_MIN, opener≠bashful, glad memory≠sheepish) |

**Bugs found:** none.
**Recommendation:** APPROVE.

## Structure track — BACKLOG-384 Resource regrowth

| Criterion | Status | Evidence |
|---|---|---|
| `depleteYield` = y−DEPLETE floored at 0 | PASS | `cycle-089-regrowth.test.ts` (deplete 0.1 → 0, never negative) |
| `regrowYield` = y+REGROW capped at YIELD_MAX | PASS | unit (regrow at cap stays 1; overshoot clamped) |
| `yieldSpawnChance` = base×y; y=1→base, y=0→0, monotonic | PASS | unit (full=base, empty=0, half=base/2, monotonic) |
| A real gather thins the bowl's yield below full | PASS | `cycle-089-regrowth` spec: `__yield('bowl')` 1 → <1 and >0.6 after spawn-on-dino + one `__stepWorld` |
| A zone starts at YIELD_MAX; never exceeds it | PASS | e2e reads `__yield('bowl')===1` at boot; `regrowYield` cap covered by unit |
| Gather/bank/carry/barter/craft otherwise unchanged | PASS | yield only gates the spawn *roll* + depletes on pickup; cycle-062/063/077/078/081/087/088 resource specs all green |
| Build clean; new module unit-tested; no save bump; boundary intact | PASS | build ✅; 5 unit; `yieldByZone` is a transient in-memory field (no save/serialize change); boundary grep clean |

**Bugs found:** none. (Note: yield is transient by design — a reload restarts each zone fresh-full; this is the
spec'd behavior, not a defect.)
**Recommendation:** APPROVE.
