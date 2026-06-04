# Cycle 31 — Verdict

**Verdict:** APPROVED
**Item:** BACKLOG-120 [emergent] Jealous nuzzle.

## Rationale
All 9 acceptance criteria PASS. `npm --prefix game run build` is clean; **193 unit** green (+8 in
the new `jealous nuzzle (BACKLOG-120)` describe) and **63 e2e** green — the only red on the full
parallel run was the documented boot flake, which this cycle landed on `cycle-003-save.spec.ts`
(3 reds); re-run isolated it was **5/5**, and both new `cycle-031-jealous` specs passed in the
parallel run itself. The feature is the smallest possible second mind on last cycle's homecoming:
when your closest dino gets its 👋, a *near-tied* runner-up (within one heart's worth — 10 points)
throws a `Hmph. 😒` and files a faint "the keeper fussed over <closest>" memory. If the runner-up
is clearly further back, or there's no second befriended dino, nothing extra happens — only a
genuine near-rival sulks.

The cut is clean. The decision lives entirely in pure, Node-tested `world/homecoming.ts`: the old
`closest` scan was generalized into a single skip-aware `topBy(friendship, exclude?)` so the
homecomer and the runner-up share one alphabetical tie-break (no drift between two near-duplicate
selectors), and the jealous beat is an **additive** `jealous` field on the existing `Homecoming`
object — every one of the 8 prior homecoming unit cases and both cycle-030 e2e specs stay green.
WorldScene does glue only: `playHomecoming` floats the second bubble, and the two-line memory fold
was factored into one `applyHomecomingMemory` reused on both the restore path and the `__catchUp`
hook.

No CHARTER trouble. The `@mlc-ai/web-llm` boundary holds (grep outside `game/src/ai/` is empty;
`homecoming.ts` imports only `friendship.ts`). Additive save — no `SAVE_VERSION` bump, no new
fields; the sulk memory rides the existing store, and an old save with no `savedAt` stages neither
homecoming nor jealousy. By design the beat changes **no** friendship points, so every hearts AC
from prior cycles is untouched. Touch count was exactly the 4 planned files; no scope creep, no new
dependencies.

## Notes for the record
- `reworkCount[BACKLOG-120]` was empty — clean first-pass approval.
- Deliberate edge: an *exact* top tie (two dinos same points) resolves with the alpha-smallest as
  homecomer and the other as the jealous one (gap 0 ≤ threshold) — the truest near-rival case, and
  it's pinned by a unit test.
- The new `__bubbleTexts` dev hook (live bubble strings) is the seam the e2e uses to prove the sulk
  actually rendered, not just that the data said it should.
- This is the keystone for the rest of the cycle-31 cluster: 123 (sulk shakeoff — the 😒 needs to
  clear), 125 (greet the runner-up to repair it), 126 (low-friendship onlooker envy), all seeded
  this cycle. 124 (homecoming chorus) and 127 (inner-circle ladder in the book) round it out.
