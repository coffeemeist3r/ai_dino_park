# Cycle 189 — QA

**Build:** ✅ clean.
**Unit tests:** ✅ 3386 passed (329 files, 3 pre-existing skips).
**E2E tests:** ✅ 916/918 on the full run; the two reds were both `controls-help` specs timing out in `boot()`
waiting for `__ready` (helpers.ts:125) — the known cold-boot flake. Re-run isolated: 3/3 passed in 4.3s.
Boundary: `@mlc-ai/web-llm` only under `game/src/ai/` (grep clean).

**Test fixed (QA's lane, carried over from the interrupted fire):** `cycle-067-dossier` asserted every book row's
quirk equals that dino's own live fidget label. On a fresh save Pip's row now reads `copies Bramble — …` — which is
this cycle's feature, not a regression. The spec now expects the copy line for a dino with a guardian
(`__guardian`) and the dino's own label otherwise.

## Structure track — BACKLOG-607

| criterion | status | evidence |
|---|---|---|
| S1 `guardianOf` precedence / ground / self / none | PASS | `cycle-189-guardian.test.ts` test 1 |
| S2 `tetherStep` beyond / within / hold | PASS | `cycle-189-guardian.test.ts` test 2 |
| S3 fresh save `__guardian('Pip') === 'Bramble'` | PASS | `cycle-189-guardian.spec` test 1 |
| S4 60 steps after Pip wakes (13:01): on every `wandering` step Pip is within the leash or closing on it | PASS | test 1 loop; asserts on the rule (distance on the idle branch), not a rolled tile |
| S5 after the molt `__guardian('Pip')` is null | PASS | test 1 tail |

**Bugs found:** none. Note: Pip is an owl, so its *waking* youth is only 13:00–14:00 — the leash is visible for
about a real minute on a fresh save. Deliberate (see codeplan); worth the next smiths knowing.
**Recommendation:** APPROVE.

## Lore track — BACKLOG-320

| criterion | status | evidence |
|---|---|---|
| L1 youngster with a guardian shows the guardian's glyph; without, its own | PASS | unit (copy strings + differing founding quirks) + e2e mark check; no-guardian path is the unchanged `moodFidget` branch |
| L2 book `copies Bramble — …`; Pip's own quirk differs | PASS | unit test 3 + `cycle-189-guardian.spec` test 2 |
| L3 before 14:00 Pip's rendered idle mark = Bramble's glyph | PASS | test 2, polled `__activityMark` |
| L4 after the molt: ticker, memory, own book quirk, flourish | PASS | test 2 tail (`__ticker`, `__memory`, `__lifted`, `__bookRows`) |
| L5 adults unchanged | PASS | `cycle-067-dossier` (every non-youngster row = own fidget label) + the fidget/sulk/lift specs (cycles 165/175) green |

**Bugs found:** none.
**Recommendation:** APPROVE.
