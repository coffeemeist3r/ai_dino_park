# Cycle 180 — QA

- **Build:** ✅ clean (`npm --prefix game run build`).
- **Unit tests:** ✅ 3269 passed, 3 skipped (pre-existing).
- **E2E tests:** ✅ 885/885 on the first full run.
  - QA then added one assertion to `cycle-180-minds.spec.ts` (silence on a ground with no answers).
  - The spec was re-run isolated: 4/4.
- **Boundary:** `@mlc-ai/web-llm` imported only under `game/src/ai/` (grep clean). No save change.

## Lore track — BACKLOG-589

| criterion | status | evidence |
|---|---|---|
| Five minds, five answers; yesterday alone decides `missed`/`company` | PASS | unit `one arrival, five minds, five answers` |
| Rival outranks yesterday; no reflection never `missed`/`company`; text name-seeded | PASS | unit `a rival outranks yesterday…`, `the words are name-seeded…` |
| Sunny crosses back on foot: Rex `glad it came`, Twitch `turns away`, bubble over Rex | PASS | e2e `the bowl answers Sunny from yesterday` |
| Mossback gets a different answer from Twitch (`bristles`) | PASS | e2e `the same ground answers Mossback differently` (also Glade `glad it came`) |
| No answers → no line | PASS | e2e follow test: Glade onto the Grove, `answers Glade:` absent |
| Build + suites green | PASS | above |

**Bugs found:** none.
**Note:** the first cold-start run of the new spec hit the known boot `__ready` timeout on two specs. The rerun was 4/4, and the full suite was green.
**Recommendation:** APPROVE.

## Structure track — BACKLOG-588

| criterion | status | evidence |
|---|---|---|
| `foldChoice` / `foldPlace` / `parseChoice` | PASS | unit `foldChoice takes a closed-list name…`, `foldPlace…`, `parseChoice…` |
| `shouldFollow` blocks floor / crossing companion / shared ground / mutual second | PASS | unit `shouldFollow holds the floor…` |
| Fresh park: Bramble, Glade sent off; Glade follows Mossback back | PASS | e2e `a fresh park: an errand splits a pair…` |
| Fake `choose`: Twitch folded as `chosen` with 🧠; unknown name keeps Rex | PASS | e2e `the model's hand…` (the unknown seek is rejected while its ground half still folds) |
| Boundary + no save change | PASS | grep; no save fields touched |
| Build + suites green | PASS | above |

**Bugs found:** none.
**Recommendation:** APPROVE.
