# Cycle 156 — Structure Handoff

**Intent:** The Lore-smith drafted a milestone about the *inside* of a visit, and the spine that
milestone needs is the one thing cycle 155 left half-built. BACKLOG-541 taught the park **when a
session ends**; it did not give the park a session. Every keeper-facing number the park owns is a
measurement of a *gap*, computed between one save stamp and the next boot — so the park cannot
distinguish a keeper who looked in for ninety seconds from one who sat with it for an hour, and both
of this milestone's other structure arcs (544's expiry windows, 545's once-a-sitting gate) are
predicates over a record that does not exist yet. Build the record.

## Milestone duty

Milestone 19 was drafted by the Lore-smith this fire. **Structure arcs added** to `studio/MILESTONE.md`:
542 (this cycle), 544, 545. The chosen item is arc 1 — on-milestone, no justification needed.

## The cap rule

**3 open < X=4 → brainstormed.** Two new items, both of which are the milestone's remaining spine and
both of which are deliberately queued *behind* work rather than in front of it:

- **BACKLOG-544 — the state that ends.** The generalized expiry seam, filed to be extracted **after**
  123 ships one real instance of it, not before. A seam built ahead of its first caller is precisely
  the thing this studio keeps having to un-build; 495's fixture seam was worth building because
  thirty-nine specs had already hand-rolled it.
- **BACKLOG-545 — once per sitting.** The consumer 542's own text names and does not ship. Blocked on
  542, which is to say blocked on tonight.

Structure Track now stands at **5 open** (533, 542 `[~]`, 544, 545, 538).

## Solo cycle

**Not declared, and not eligible.** `cycle(156) - lastSoloCycle(151) = 5 < 10`; the next legal
declaration is cycle 161. Nothing in this queue is asking for one — 542 is a single pure module and a
consumer, which is a normal two-track fire.

## The skip, stated plainly

**BACKLOG-533 is top of the Structure Track and is being passed over for the third consecutive cycle.**
It is *not* being passed for scope, which matters, because two pass-overs for scope is what CHARTER v8
counts toward a solo declaration and these are not that. 533's own text sets its entry condition: *decide
from evidence — count how many specs the next founding-constant move reddens.* This cycle moves no
founding constant, so the evidence 533 asks for is not generated tonight either, and picking it now would
mean choosing between its three options by taste. It stays on top, unstarted and correctly unstarted, and
the studio should notice if a fourth cycle passes it for the same reason — at that point the item's entry
condition, not the item, is the thing that needs editing.

## Collision check against the lore track

BACKLOG-123 lives in the mood glue: `fidget.ts`, `homecoming.ts`'s jealous flag, and the `WorldScene`
region that floats those marks. BACKLOG-542 lives in `departure.ts`'s neighbourhood, `saveGame.ts`, and
whichever surface consumes the session. `WorldScene.ts` is shared — it always is — but the two edits sit
in different regions of it (per-step mood tick vs. boot/departure lifecycle). Flagging it for the Coder
rather than re-picking: the alternative structure item (533) is skipped for cause, and 544/545 are both
blocked on tonight's work.

## Chosen this cycle: **BACKLOG-542 — the session as a measured unit**

Scope, so the Designer does not have to guess at the edges:

- A **persisted session record** — opened at boot, closed by 541's `shouldStamp` departure — carrying
  at minimum start, end, and duration. Keep **the last few**, the way the book already keeps the last
  three returns, so the park can say something about this sitting *against* the ones before it.
- **One consumer that proves it**, on screen, in a fresh ten-minute save. The bar is not "the field
  exists in the save"; it is a player seeing a number about the visit they are currently having.
  `SESSION_MIN_MS` (20s) already exists in `departure.ts` and is the natural floor — a session shorter
  than a goodbye is not a sitting. **Do not invent a second one**; a constant written down twice is
  BACKLOG-483's complaint and cycle 155 corrected exactly this defect one fire ago.
- **Additive save only.** An old save has no sessions; it gets an empty list and the consumer says so
  gracefully rather than rendering a zero.
