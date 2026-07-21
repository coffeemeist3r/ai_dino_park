# Cycle 107 — Structure Handoff

**Intent:** Milestone 6's third arc, and the one the rest of the milestone's *voice* waits on. The park
has had emergent roles since cycle 20 (gossip / homebody / socialite / wanderer, made durable by 032), but
every one of them reads the **social** graph — meetings, rumors, bonds. Nothing in the role system has ever
looked at the economy, so the dino that actually keeps a zone fed is anonymous. **448 puts a job in the
park:** a per-dino food-bank tally, and a persistent `provider` role for whoever fills the pantry most.
It's the standing lore arc 453 ("the Fernreach eats because of Sunny") cannot exist without, and it's the
first role derived from what a dino *does for the place it lives in* rather than who it talks to.

**The honest-source problem (flagged by the Lore-smith, and the reason this is arc-sized, not a one-liner):**
today the only dino-attributable banking event in the whole sim is the 447 courier carry. The keeper's
harvest banks its share with nobody's hands on it (`harvest()` is a P-press), so a tally fed by couriering
alone would make `provider` a synonym for "crosses zones a lot" — a wanderer by another name. So this item
ships the tally *with a second, honest source*: the harvest share is credited to the resident who hauls it,
the nearest dino in that zone at the moment the crop is banked. That's the "banks the most harvest into its
zone's food store" the item literally asks for, and it makes the role emerge inside a single-zone session.

**Complements the lore pick:** 452 (homecoming) and 448 both touch `crossDino`, but at different lines —
452 adds the arrival beat, 448 adds one `+1` on the existing 447 carry block. Sequence 448's tally first,
then 452's beat, and they don't collide. Flagged for the Code-planner.

**Added to Structure Track:** BACKLOG-454 (the granary — building raises a zone's food cap, first contact
between the resource economy and the food economy), BACKLOG-455 (a pantry that spoils — banked food decays
at glut so the flows can't deadlock). Queue was at 3 open (< X=4), so the cap rule says brainstorm; both are
spine items the milestone's own mechanics exposed as gaps.

**Chosen this cycle:** BACKLOG-448 — the provider role (per-dino food-bank tally → durable `provider` tag).

**Note carried forward (Idea Box routing, cycle 106):** when **450** is built, weigh the operator's harder
framing — genuinely zone-exclusive resources so a body must go fetch what its home can't supply. Still open.
