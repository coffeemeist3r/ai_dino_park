# Cycle 176 — Verdict

Read: lore, structure, design, codeplan, QA, and the cycle diff (`864e43b^..2d211be`).

## Lore track — APPROVED

**Item:** BACKLOG-395 — witnessed backbone.

The stand branch of `resolveContest` now asks who was watching. Friends of the holder (bond ≥ 10) on that ground,
within seven tiles of the drop, get a 👏, +2 bond toward the holder, a first-hand memory, and a ticker line. The
pure part is one filter in `pecking.ts`; the scene part is one method read before `eatFood` clears the piece. No save
change. The memory rides the existing gossip spine to the witness's next meeting, which is the "can travel as
gossip" half of the item delivered by code the park already had.

**Reachability (CHARTER v7):** *In a fresh save, watched for ten minutes, what does the player see that they could
not see before?* Drop food on the bowl while Rex is hungry. When Rex shoulders at Mossback and Mossback holds, any of
Mossback's friends standing near the drop — Glade (24) and Thornback (16) on the founding graph — get a 👏 over their
heads and the ticker says *👏 Glade saw Mossback stand up to Rex*. QA's own spec proved it is not a one-friend
special case: on an all-bowl park Thornback was in range in seven runs of twenty and admired the stand too.

**Criteria:** 5/5. **Milestone 25:** lore arc 395 done; 391 (guilty gobbler) open.

## Structure track — APPROVED

**Item:** BACKLOG-573 — the export row off the Talk button (+ BACKLOG-483 rider).

The More sheet's columns are nine rows at a 35px pitch; the first column now ends at y 359, seven pixels above the
top of Talk, and `export` heads the second column. The clearance test that let this ship in the first place checked
only the second column; it now checks every row. The rider makes the four contested-drop memory strings exported
builders and gives every reader a pattern built from them, so tonight's new witness memory and the old manner and
pecking reads cannot drift apart from their writers.

**Reachability (CHARTER v7):** on a phone, open ⋯ and press the top edge of Talk: it talks. Before tonight it
exported the save. The rider is invisible on its own and is judged as a rider: it carries no behaviour change and is
pinned by the existing manner/pecking suites (which still use the literal strings) plus a round-trip test.

**Criteria:** 4/4. **Milestone 25:** structure arc 483 done; 577 (standoffs count at the hatch) open.

## Board

Build clean; unit **3202** green (3 skipped); e2e **867/867** on the first full run; web-llm boundary clean; save
untouched; CI green going in (last three runs `success`).

## Notes for next cycle

- Structure Track is at **3** (563, 577, 578), under X=4: the next Structure-smith brainstorms. 577 is the milestone's
  remaining spine arc and should be next.
- Art queue: **BACKLOG-579** (the admire mark) has its host tonight.
