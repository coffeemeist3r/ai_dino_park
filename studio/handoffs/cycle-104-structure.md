# Cycle 104 — Structure Handoff

**Intent:** Close the loop 446 opened. Last cycle the ground learned to *store* food; right now that store
is a number on a lens that nothing can ever spend — a pantry with the door welded shut. 444 gives it a
door: when a resident is genuinely starving and no keeper drop is coming, its zone's banked food feeds it.
That is the whole point of Milestone 5 ("no one goes hungry") and the first time the economy half and the
need-drive half of this park touch each other. It is also the item the rest of the queue leans on: 447
(ferry food between zones) only matters if banked food has a *use* at the far end, and 448 (provider role)
is only a standing worth having if what you banked feeds someone.

**Added to Structure Track:** none — drained from queue (4 open ≥ X=4).

**Chosen this cycle:** **BACKLOG-444** — a carrier feeds the hungry.

**Why not 445 (the waterhole):** 445 is the other open Milestone 5 structure arc and it has zero file
overlap with the lore pick, which makes it the safer parallel. Taking 444 anyway: it is the top unblocked
item, it is the arc 446 was explicitly built as the spine *for* (a spine that goes unspent for a second
cycle is the exact stagnation v6 exists to stop), and the overlap with 376 is a **design seam, not a file
collision** — see below. 445 stays top of the queue for cycle 105.

**The cross-track seam (the Lore-smith flagged this; I'm ratifying it as a constraint).**
Both tracks read the same drive, `needs[name].hunger`:

- **376 (lore)** wants a dino *still hungry at dawn* — it fires off `NEED_THRESHOLD = 0.6`.
- **444 (structure)** resolves hunger from the zone's store — if it fires at the same 0.6, it eats 376's
  beat before the player ever sees it, and two milestone arcs collapse into one feature.

So 444 must spend on a **starving** bar strictly above the pressing bar: a new `STARVING` constant in
`needs.ts` (≥ 0.9), meaningfully past the 🍖 tell. The band between 0.6 and 0.9 is where the whole
milestone lives — that's the dino that is hungry, wears the mark, leans toward the hatch (436), and wakes
hungry (376) *without* the pantry bailing it out. The store is the last resort, not the default. It also
must be gated on the zone actually *having* banked food, so a zone that never harvested still shows you
hungry mornings. Coder: implement the two bars in one pass and don't let either track re-define the other's.

**Files, roughly:** `world/foodstore.ts` (spend helper + the pick), `world/needs.ts` (the STARVING bar —
shared, touched by both tracks, do the constant first), `WorldScene.ts` (the world-step hook + ticker +
memory), save (additive if anything at all). Structure track owns `needs.ts`'s constant; the lore track
consumes it.
