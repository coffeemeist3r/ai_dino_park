# Cycle 91 — QA

**Build:** ✅ `npm --prefix game run build` clean (tsc + vite).
**Unit tests:** ✅ 980 passed (+17 this cycle: 11 persona + 6 zone-map).
**E2E tests:** ✅ **294 passed** on the final full run. Two earlier full runs each dropped 1–2
*different* specs (068 grove-populate; then 076 news-pull + 081 directed-carry) — every one
green 3/3 isolated and green in the final full run = the catalogued parallel-load/cold-boot
flake class, not a regression; none of the three touches this cycle's diff.

## Lore track — BACKLOG-103 Persona from lore

| Criterion | Status | Evidence |
|---|---|---|
| proceduralPersona deterministic, bounded, flavor kept | **PASS** | unit `cycle-091-persona`: byte-identical across calls; ≤ PERSONA_MAX; contains 'curious, friendly, loves rocks' |
| Five roster personas pairwise distinct | **PASS** | unit: `new Set(texts).size === 5` |
| fromPersonaDraft: null/empty/short → fallback; valid → 'llm' capped at word boundary | **PASS** | unit: both draft tests (incl. `…` ellipsis + no mid-word cut) |
| Stub-brain floor: procedural persona + working sim, zero model | **PASS** | e2e `cycle-091-persona` #1: headless (no WebGPU), `__persona('Rex').source === 'procedural'`, zero console errors |
| Generate-once + persist: in `__exportSave`, restored byte-identical on reload | **PASS** | e2e #2: save carries `personas.Rex`; post-reload text + source identical |
| 'llm' never re-authored; procedural upgrades ≤ once | **PASS** | unit `upgradePersona`: settled object returned by reference; null draft keeps floor |
| buildMessages carries the persona in the system message | **PASS** | unit: system content contains persona text; `buildPersonaMessages` contains PARK_LORE + flavor |
| web-llm only under game/src/ai/ | **PASS** | grep: `webllmBrain.ts` + `webllm.worker.ts` only |
| Full suite green | **PASS** | totals above |

**Bugs found:** none. The save-shape choice (personas undefined-when-absent) was caught at
coder time by the existing 15 round-trip pins — resolved to the stockpileByZone precedent
before commit, and a malformed-personas rejection test was added.

**Recommendation: APPROVE**

## Structure track — BACKLOG-425 Zone map lens

| Criterion | Status | Evidence |
|---|---|---|
| zoneChain() = bowl→grove→fernreach, every zone exactly once | **PASS** | unit `cycle-091-zone-map` |
| zoneMapModel mirrors zonePopulations; exactly the keeper zone flagged | **PASS** | unit: counts [4,1,0], keeper [false,true,false], names correct |
| V reaches map after ticker and wraps to off | **PASS** | e2e `cycle-091-zone-map` #1 (zero console errors) + updated `cycle-021-lenses` ring test |
| Map shows 3 zones in chain order, full roster counted, keeper on bowl at boot | **PASS** | e2e #2 (`count sum === __bookRows().length`) |
| Keeper dot follows a real crossing | **PASS** | e2e #3: `__setPlayer/__tryCross` → keeper flag [false,true,false] |
| Existing lens specs stay green | **PASS** | cycle-021 (updated for the appended ring) + full run green |

**Bugs found:** none.

**Recommendation: APPROVE**

## Notes

- No save-version bump either track; `personas` is additive-optional (old saves regenerate
  deterministically — proven by the absent-field unit test).
- The three flaky specs are all pre-existing reload/parallel-load class; catalogued in prior
  cycles' QA notes (028/074/078 same class). No new catalogue entry warranted beyond noting
  068/076/081 joined the rotation under full parallel load.
