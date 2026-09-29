# Cycle 172 — Verdict

## Lore track

**Verdict:** APPROVED
**Item:** BACKLOG-127 — the inner circle.

**Rationale.** 7/7. The ladder is `topBy` called three times, not a second ranking, so the book's #1
and the homecoming's welcomer cannot disagree — pinned by a unit over tied maps. The book change is one
optional argument; every existing literal renders byte-identical. The check runs above the dialog
return because a greet bumps friendship with the dialog open, and a restore re-seeds silently.

**Reachability.** Fresh save, `V` to the book: line two reads *♛ your inner circle: nobody yet — say
hello*. Greet Rex once: a ♛ pops over Rex where it stands, the ticker says *♛ Rex has joined your inner
circle (#1)*, and the book's line two now ranks it. Three hellos in the first minute fill the ladder.
None of this existed on any save before tonight — the keeper's friendship numbers lived in the hearts
panel one dino at a time and the homecoming's choice was never shown.

## Structure track

**Verdict:** APPROVED
**Item:** BACKLOG-570 — bonds drift.

**Rationale.** 6/6. One pure function, one call, under the existing hold gate. The resting level is the
shared floor rather than zero, deliberately: four systems read 8 as "has a friend", and letting drift
cross it would ship estrangement by accident. The rest is passed in rather than imported, because
`loner.ts` already imports `bonds.ts`.

**Reachability.** Fresh save, watched ten minutes, no hook touched (QA's measurement): the bond graph
spans 10–86 instead of piling toward 100, the founding pair Rex & Sunny cools from 30 to 18 because the
two did not keep company while Glade & Sunny climb to 86 — and the book's *🤝 close to …* lines and the
ticker's *💞 … has grown closer to …* lines re-sort accordingly (four real overtakings in the run).
Before tonight, nothing in the graph could ever go down.

**Named, not built.** Time away does not cool bonds: `away.ts` fast-forwards days with no drift. A
week-long absence should probably cost something; that is a decision about the homecoming's feel, not
arithmetic, and it is left for the milestone's close.

## Board
Build clean; unit 3128 green; e2e 846/847 on two fresh full runs, a different lone timeout each time
(`cycle-155-departure`, then `cycle-122-struck`), each green isolated — the parallel-load class, not a
regression. CI's last three runs `success`.

## Milestone 23
Lore 2/3 (open: 136, comfort is for friends). Structure 3/3. One arc from shipping.
