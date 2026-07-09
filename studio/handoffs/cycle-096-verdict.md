# Cycle 96 — Verdict

## Lore track

**Verdict:** APPROVED
**Item:** BACKLOG-410 — Homesick sooner

**Rationale:** Build clean, 1060/1060 unit, 316/316 e2e (one save/reload spec flaked under parallel
load and passed isolated — the catalogued IndexedDB flake, untouched by this diff). The belonging
milestone taught a dino *where* home is (settle 341, grief-edge 414, homesick 340); 410 turns the
mirror to what a *strange* zone feels like — a dino not yet settled (341) with no bonded friend
(≥ the 8-pt `GRIEF_BOND_FLOOR`, the same friend floor 414/340 use) residing in its current zone falls
into its signature tic (405) at `TIC_AFTER_STEPS_HOMESICK` (12) instead of the plain 20. The two
onset shorteners compose by `Math.min`, so a 393 solitary-day still wins when lower; the read is a
pure `aloneInStrangeZone(settled, hasFriendInZone)` + a `zoneMates` helper feeding the existing
`closestFriend`, so nothing new is derived and the 414 grief aim path is byte-identical.

**Honest scope (the Coder's cut, upheld):** the design planned a distinct `strangeZoneTicMemory`. It
was **cut** during coding, correctly. 410's gate fires for *any* fresh friendless-in-zone lone dino —
which is exactly the plain-405 lone dino the shipped `cycle-087` spec pins to its "a little ritual of
your own" memory — so a new memory would have *replaced* it (a 405 regression, and the full run caught
it). Worse, the strange-memory case can never coexist with the 414 grief memory: a dino with a friend
*elsewhere* always grieves (grief keeps priority), and a dino with no friend at all isn't homesick —
so the strange line was unreachable dead text. 410 ships as the **onset shortening only**, which is
precisely the item's ask ("falls into its tic *faster*"); the ritual and its memory are untouched. A
smaller, cleaner 410 than specced, and 405 stays intact. Off-milestone (the milestone's lore checklist
was already complete) but squarely in the belonging theme. Ships.

## Structure track

**Verdict:** APPROVED
**Item:** BACKLOG-428 — Zone prosperity index

**Rationale:** All six criteria pass. Each zone's four live signals — banked resources (328), built
landmarks (286/315/417), resident heads (316), and crops harvested from its plot — fold through a new
pure `world/prosperity.ts` (`zoneProsperity` = `structures*3 + heads*2 + harvested + stockpile`, a
non-negative monotonic sum) into a three-step tier (`quiet ○ / growing ◐ / thriving ●`), surfaced as a
third line on each map-lens box (425) and a `__zoneProsperity` hook. "Which zone is thriving" is now a
glance instead of four lookups — and the foundation the deferred governance/festival items (031/026)
can read instead of re-deriving. To give the farming term an *honest* per-zone value (the global
`harvested` counter isn't split yet), 428 adds a minimal `harvestedByZone` counter at the single
harvest site, round-tripped additively through the save (old saves → `{}`, malformed → reject). That
lightly overlaps BACKLOG-433, whose residual scope is now *surfacing* per-zone farming as its own
map/book line, not producing the counter. Additive save, no WebLLM, `harvested` global untouched for
existing readers.

## Milestone bookkeeping — MILESTONE 2 SHIPPED 🎉

428 was Milestone 2 "Places to belong"'s **last open arc** (structure arc 3 of 3). With it `[x]`, all
six arcs are done (lore 341/414/340 ✓, structure 417/418/428 ✓) — **Milestone 2 ships** (see the
chronicle entry). The next cycle's smiths draft Milestone 3 (no ACTIVE milestone → the Lore-smith's
milestone duty fires).

## Housekeeping

- Closed 410 + 428 moved from BACKLOG.md to BACKLOG-archive.md.
- Structure Track now 3 open (429/432/433) < X=4 → next cycle's Structure-smith refills.
- Milestone 2 moved to MILESTONE.md's "Shipped milestones"; Current milestone left empty for the next draft.
