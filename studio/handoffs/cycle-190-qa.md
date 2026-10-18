# Cycle 190 — QA

- **Build:** ✅ clean
- **Unit tests:** ✅ 3393 passed (331 files)
- **E2E tests:** ✅ run 1: 920/921 — the one red was **real**: `cycle-138-billcall` pinned the Grove council's mend-time
  call as "fills its stores first" (Pip's gather vote). With Pip holding no standing the morning seat is Bramble's,
  whose energy votes build: "raises its walls first". A direct, intended consequence of 609 — spec updated with the
  reason. Run 2: 920/921, the lone red the known cold-boot `canvas` timeout in `cycle-014-npc-convo`, green isolated
  (×3).

## Lore track — BACKLOG-313

| criterion | status | evidence |
|---|---|---|
| keptBeat 1-in-4; keptLine wording | PASS | `cycle-190-kept.test.ts` |
| fresh save, after molt: `kept.from === 'Bramble'`, glyph = Bramble's | PASS | `cycle-190-kept.spec.ts` (BACKLOG-313) |
| idle mark shows both own and Bramble's glyph after the lift window | PASS | same spec, step loop |
| book quirk contains `and still Bramble's` | PASS | same spec; `cycle-189-guardian` updated to the full line |
| `kept` survives reload | PASS | same spec, reload + poll |
| no guardian → no `kept`; founders unchanged | PASS | code path gated on `copied`; full suite green; save validator rejects malformed `kept` (unit) |

**Bugs found:** none. **Recommendation:** APPROVE.

## Structure track — BACKLOG-609

| criterion | status | evidence |
|---|---|---|
| `standingCandidate` young/adult, no mutation | PASS | unit |
| `grownSeatLine` wording | PASS | unit |
| fresh save Grove council `['Bramble']` | PASS | `cycle-190-kept.spec.ts`, `cycle-137-ballot` |
| after molt `['Pip']` + ticker seat line | PASS | `cycle-190-kept.spec.ts` |
| 137 green with Pip molted | PASS (with hook) | the molt is `softer` (0.522 → 0.672); 137's mechanism tests restore 0.522 by `__setTrait`, commented |
| build/unit/e2e/boundary | PASS | above; web-llm only under `game/src/ai/` |

**Bugs found:** not a bug in this item, but a loss it makes total: the founding park now has **no turnable Grove
seat** (morning Bramble 0.870, afternoon grown Pip 0.672; the stake nudge is capped at −0.1 on a two-head ground).
Since cycle 187 the knife edge only lived until 14:00. Recommend a follow-up structure item.
**Recommendation:** APPROVE, with the follow-up filed.
