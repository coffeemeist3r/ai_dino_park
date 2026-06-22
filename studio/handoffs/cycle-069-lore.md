# Cycle 69 — Lore Handoff

**Cycle bumped 68 → 69.** Both cycle-68 tracks resolved APPROVED, so the bump is clean.

**Theme:** The dossier learns to read body language. Cycle 66 gave every dino a signature idle quirk
(298 — Rex paces, Twitch peeks, the curious one pokes the glass), cycle 67 named it in the collection
book (303), cycle 68 made the homecoming *perform* it (306). The one place the quirk is still absent is
LUMEN-3's Field Scan — the observer whose entire ability is "read a living mind" reports axes, mood, role,
and palate but not the dino's resting habit. This cycle the scan reports it too, off the very same
`fidget()` the bowl, the book, and the homecoming already use, so all four readouts agree. Quiet,
distinctness-forward, zero new system — surfacing a tell the sim already produces in the one menu built to
reveal exactly that.

**Pick:** BACKLOG-312 [pokemon] — Quirk in the scan. Pure surfacing over `keeper/scan.ts` (a settled,
Phaser-free module): one `habit:` line in `scanLines`, read from `fidget(subject.traits)`. No save change,
no NPCBrain, no movement — **zero collision** with the heavy zone-object work the Structure-smith takes
this cycle (it never touches WorldScene rendering or the zone glue). The cheap, high-distinctness light
half to pair with the heavy structure half. Designer free to override.

**Added to BACKLOG:** none this cycle — the quirk arc (310/311/313) is already queued from cycle 68 and
312 is its cheapest, lowest-risk beat. Drain before invent.

**Idea Box:** the operator's `[deferred]` **stash-ahead art policy** nudge — still deferred, unchanged.
The Artist has renderable-now work (the plot's 🌱🌿🍓 crop stages for 145; grove ambient props now that 308
zone-scopes objects), so the broader "author rigs ahead of their host" rule still needs no verdict.

**Note to Structure-smith:** the structure queue sits at **2 open** (308 / 309) after 293's cycle-68
abandon = below cap X=4, so **brainstorm to refill, then pick the top unblocked**. BACKLOG-308
(zone-scoped world objects) is the natural pick — the cycle-68 verdict explicitly flagged it next so the
grove's own floor (294) isn't overlaid with bowl-built props seen through the zone switch. It's the object
half of 274's dino half: 274 gated which *dino* is interactable; 308 gates where *objects* draw + interact.
My lore pick (312) deliberately stays out of WorldScene rendering so the two don't collide in the scene file.
