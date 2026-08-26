# Cycle 141 — QA

**Gates**

| Gate | Result |
|---|---|
| `npm run build` | clean |
| `npx vitest run` | **2081 passed / 2 skipped** across 208 files |
| `npx playwright test` (full, parallel) | **590 passed / 2 failed** |
| the two e2e failures, re-run isolated | **8/8 passed in 5.6s** |
| `@mlc-ai/web-llm` boundary | only `ai/webllm.worker.ts` + `ai/webllmBrain.ts` |
| save fields | none added, none changed |
| working tree | clean at each stage commit |

The two full-run failures are `cycle-110-plenty` and `cycle-123-capacity`, both of which failed at
`helpers.ts:27` waiting for the canvas — a **boot timeout under parallel load**, the catalogued flake, in
both cases on a spec nowhere near either diff (migration hearsay and terrain capacity; neither reads a pile,
an activity or a greeting). Both green on the isolated re-run. Noted, not a regression.

Worth recording positively: **BACKLOG-430's `mobile-minds` long-dialog spec was green in the full parallel
run**, and this cycle touches the greet path it lives in.

---

## Lore track — BACKLOG-300

| # | Criterion | Result |
|---|---|---|
| L1 | `wandering` → null; every other `Activity` returns a non-empty string | **PASS** — the unit spec iterates `ACTIVITY_GLYPH`'s keys, so an activity added later without a clause fails here rather than shipping silent |
| L2 | Stable per name; differs across names | **PASS** — three consecutive calls identical per name; the cast produces more than one distinct clause for `feeding` |
| L3 | The greeting carries that activity's clause and no other's | **PASS** — e2e drives the world until somebody is feeding / huddling / gathering, greets them, asserts its own clause present and the other two activities' four clauses absent |
| L4 | Caught mid-ritual → the tic aside, and no activity aside | **PASS** — e2e: `__inventTic` then greet; 423's opener/aside are there and none of the six activity clauses are. Exactly one aside |
| L5 | Composition single-spaced, no leading/trailing space | **PASS** — unit spec runs the real join over all four opener/aside combinations |
| L6 | Works with no model (headless, no WebGPU) | **PASS** — all three e2e tests run headless with no WebGPU and assert zero console errors |
| L7 | No save field added or changed | **PASS** |

**Extra check, unprompted:** the third e2e test pins the *negative* — a wandering dino's line contains none
of the six clauses. That is the claim the design leans on hardest ("the plain greet is byte-identical"), and
it is now a test rather than a sentence.

---

## Structure track — BACKLOG-504

| # | Criterion | Result |
|---|---|---|
| S1 | `pileStep` 0→0, 1→1, 2/3→2, 4+→3 | **PASS** (incl. a value at 3× `STOCKPILE_CAP`) |
| S2 | `BANK_TILE` is grass on every `zoneChain()` ground | **PASS** — asserted against `zoneTileAt`, plus a check it is not the huddle tile, the plot or the founding ruin |
| S3 | `pileArtKey` null at 0, three keys at 1/2/3 | **PASS** |
| S4 | Fresh save: Grove step **2**, bowl step **0** | **PASS** (e2e, first test) |
| S5 | Banking raises the heap and makes it visible; spending hides it | **PASS** — e2e drives `{} → {stone:1} → {stone:4} → {}` and reads step 0/1/3/0 with visibility following |
| S6 | The founding mend drops the Grove 2 → 1 | **PASS** — e2e runs the real 488 errand (`__runUpkeep`, `__stepMend` to completion), confirms the ruin is standing, then reads step 1 |
| S7 | A heap shows only on its own ground | **PASS** — from the bowl the Grove's heap is step 2 and `visible: false`; `__setZone('grove')` and it is visible |
| S8 | No save field | **PASS** — the bank derives from `stockpileByZone`, which already persists; `syncBanks()` after restore |
| S9 | Build / unit / e2e / boundary | **PASS** (see gates) |

**Extra check, unprompted — the seam is actually total.** The claim that the heap can't drift from the
number is only worth anything if no write escapes it. Verified by grep: `stockpileByZone` now appears in
exactly four places outside `setPile`/`pileFor` — the field declaration, the accessor, the save
serialization (a read), and the save-restore whole-map replace, which is immediately followed by
`syncBanks()`. Fifteen assignment sites, fifteen rewrites, zero survivors.

**One thing I looked for and did not find a problem with.** `syncBank` destroys and re-creates its sprite
when a step crosses between the glyph fallback and a baked rig. Today that branch is dormant (BACKLOG-506 is
undrawn, so every step is a glyph), which means it ships untested by the suite. It is not a defect — it is
the guard against a *partially* drawn rig set calling `setTexture` on a `Text` — but the Artist should know
that the first `pile_N` rig it lands is what first exercises that path, and the 506 fire is where a spec for
it belongs.

---

**24 / 24 acceptance criteria pass.** No blockers. Both tracks are ready for judgement.
