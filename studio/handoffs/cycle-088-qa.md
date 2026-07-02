# Cycle 88 — QA

**Build:** ✅ `npm --prefix game run build` clean (type-check passed).
**Unit tests:** ✅ `npm run test:unit` → **928 passed** (+11: 3 caught-tic + 8 third-zone-bias).
**E2E tests:** ✅ **277 passed**, 2 failed in the parallel run (`cycle-028-realtime`,
`cycle-074-arrival`) — both **green when re-run isolated** (3/3), the catalogued cold-boot /
parallel-load flake. Neither touches this diff (realtime clock + grove arrival vs tic/greet +
resource bias). New specs `cycle-088-caught-mid-tic` (1/1) and `cycle-088-third-zone-bias` (1/1)
passed in the full run.

---

## Lore track — BACKLOG-408 Caught mid-tic

| Criterion | Status | Evidence |
|---|---|---|
| Greeting a mid-tic dino floats a 😳 startle as the greet opens | PASS | `openToneMenu` flashes 😳 when `ticInvented.has(target)`; e2e drives `__inventTic` then greets |
| After a tone pick, the reply begins with a deterministic bashful opener (stub, no model) | PASS | e2e asserts the returned line contains `caught mid-fidget`; runs headless on StubBrain |
| A non-mid-tic dino greets with no opener and no 😳 (byte-identical) | PASS | e2e greets a second dino, asserts the line does **not** contain the opener |
| Being caught files a one-time memory naming the ritual; no re-file within the same stretch | PASS | `pickTone` guards on `ticCaughtFiled`; e2e asserts `the keeper caught you mid-ritual` in `__memory` |
| The catch changes neither the tone affinity delta nor bonds | PASS | `recordTone` runs unchanged before the catch logic; catch only prefixes text + files a memory (no bond/friendship call added) |
| A dev hook drives it deterministically | PASS | `__inventTic(name)` forces mid-tic; `__pickTone` returns the shown line |

**Bugs found:** none. `caughtTic` is cleared on `closeToneMenu` (cancel) and in `resetTic` (stretch
end), so the bashful frame can't leak into a later greet. Unit test `cycle-088-caught-tic` pins the
frame + label weave.

**Recommendation:** **APPROVE.**

---

## Structure track — BACKLOG-400 Third-zone resource bias

| Criterion | Status | Evidence |
|---|---|---|
| `pickKind(rng, fernreach)` leans frond ≈ BIAS_WEIGHT, off-kind is branch/stone | PASS | unit: frond share ≈ 0.75 over 4000 seeded draws, frond>0, off-kind>0 |
| Bowl leans stone / grove leans branch, exact pre-400 distribution; frond never in bowl/grove | PASS | unit: bowl.stone≈0.75, grove.branch≈0.75, frond===0 for bowl/grove; e2e: `__biasKind('bowl',r)` never frond across r |
| `pickKind()` no-zone stays uniform 50/50 branch/stone, never frond | PASS | unit: branch/stone ≈0.5 each, frond===0 |
| A banked frond shows in the Fernreach Stores line as `🌾 N` in glyph order | PASS | unit `stockpileLine`; e2e `__setZonePile('fernreach',{frond:2})` → Stores shows `🌾 2` + `Fernreach` |
| `pickCarry` ferries frond as a spare; `directedCarry` doesn't pull it for the cairn recipe | PASS | unit: `pickCarry` → frond; `directedCarry(...,CRAFT_RECIPE)` → spare frond, but `branch` wins when present |
| `barterSwap` treats frond as a normal kind (spare fallback) | PASS | unit: frond-heavy pile hands over frond, empty side gives null |
| Old save with no frond loads unchanged (no version bump); frond persists | PASS | `saveGame` validates `stockpileByZone` with no kind whitelist; additive key, `SAVE_VERSION` untouched |
| `zoneStructure`/`structureRecipe(fernreach)` resolve validly (frond→cairn) | PASS | unit: `zoneStructure(fernreach)==='cairn'`, `structureRecipe===CRAFT_RECIPE`; `STRUCTURE_BY_BIAS` type-complete (build enforced) |

**Bugs found:** none. The cycle-078 bias-parity behaviour holds (frond-exclusion assertions are the
pin). No exhaustive `ResourceKind` switch exists; `PROP_RIGS` is string-keyed so the missing frond
pixel rig cleanly falls back to the 🌾 emoji glyph (rectangle-fallback discipline).

**Recommendation:** **APPROVE.**

---

`@mlc-ai/web-llm` boundary clean (no import outside `game/src/ai/`). No save-format change either track.
