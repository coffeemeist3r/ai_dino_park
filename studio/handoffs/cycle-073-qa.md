# Cycle 73 — QA

**Build:** ✅ clean (`npm --prefix game run build`, tsc passes).
**Unit tests:** ✅ 734/734 (77 files; 722 prior + 12 new across the two cycle-073 files).
**E2E tests:** ✅ 233/234 in the full run; the lone fail was `cycle-028-realtime.spec.ts:25`
(the T-toggle clock-HUD scale spec — unrelated to either track), which passed **2/2
isolated** on re-run → the catalogued parallel-load cold-boot flake, not a regression.
Both new spec files (4 tests) green in the full run.

---

## Structure track — BACKLOG-334 (visible zone crossing)

| Criterion | Status | Evidence |
|---|---|---|
| Pure edge math unit-tested (bowl→east col / grove→west col; entry one in from opposite edge; row preserved) | PASS | `cycle-073-migration-crossing.test.ts` 7/7 |
| A dino put into crossing stays in its origin zone immediately (no flip until the edge) | PASS | `cycle-073-crossing.spec.ts` — after `__startMigration('Rex')`, `__migrating()` has Rex and he's still drawn in the bowl |
| Stepping walks the migrant monotonically toward its edge (no teleport) | PASS | crossing spec asserts Rex's x is non-decreasing each step until he crosses |
| On reaching the edge: home zone flipped, at the far entry edge, no longer crossing | PASS | crossing spec — after the loop Rex is gone from bowl view, visible in grove, x<96 (≈col 1), `__migrating()` clear |
| `__migrate` still relocates instantly; cycle-068/069/071 unaffected | PASS | parity test (zone='grove', not in `__migrating`, hidden in bowl); cycle-068/069/071 specs green in full run |
| `__migrating()` reports the in-flight set | PASS | used throughout the crossing spec |
| No save-format change; in-flight walk is transient | PASS | `SAVE_VERSION` untouched; `migrating` is a transient Set, never serialized |
| Build + full suite green | PASS | see header |

**Bugs found:** none. The migrant correctly stays visible while walking its origin zone and
"leaves" (hides) on crossing when the keeper stays behind — the intended watchable journey.

**Recommendation:** APPROVE.

---

## Lore track — BACKLOG-181 (sleep murmurs)

| Criterion | Status | Evidence |
|---|---|---|
| `pickMurmurMemory` returns most-recent / null; `murmurLine` formats 💭 line / zzz | PASS | `cycle-073-murmur.test.ts` |
| `murmurLine` strips the leading event glyph (fragment, not a log line) | PASS | unit: `murmurLine('🍖 ate its favorite')` is 💭-prefixed, contains "ate its favorite", excludes 🍖 |
| `__murmur(name)` returns the deterministic per-dino line; two memories → two lines | PASS | unit distinctness test + e2e `__murmur('Rex')` returns a 💭 line |
| Forcing a murmur floats a 💭 bubble on a huddling, in-view dino | PASS | `cycle-073-murmur.spec.ts` — `__forceMurmur('Rex')` line is in `__bubbleTexts()` |
| A non-huddling/out-of-view dino never murmurs | PASS | murmur spec — `__forceMurmur('Rex')` at noon (nobody huddling) returns null |
| No model loaded → deterministic line, no error; `NPCBrain` boundary holds | PASS | CI runs the stub; murmur is deterministic; grep confirms `@mlc-ai/web-llm` only under `game/src/ai/` |
| No save-format change; murmurs ephemeral | PASS | nothing persisted; a bubble only |
| Build + full suite green | PASS | see header |

**Bugs found:** none. LLM-colour was deferred per the codeplan — no AC requires it and the
boundary/fallback (the charter-relevant parts) are fully met.

**Recommendation:** APPROVE.
