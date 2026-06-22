# Cycle 68 — Structure Handoff

**Intent:** Make the grove an inhabited place. Cycle 59 gave the bowl a walkable second zone (143), and cycle 67 gave that zone its own ground — a tinted clearing with a worn path and a NE pond (294). But the grove stands **empty**: every dino spawns in the bowl and never leaves it, so the new terrain is a pretty room nobody lives in. The render-filter half of populate-grove already shipped (operator 2026-06-20: `dinoZones` home-zone map + an `inView` gate so off-zone dinos aren't drawn). This cycle completes the spine: assign some of the cast a grove home so the second zone actually has residents, and gate **proximity interaction** (greet / scan / feed-rush) on sharing the keeper's active zone, so a grove-dwelling dino can't be talked to or fed through the zone switch from the bowl. That turns "two zones the keeper walks between" into "two zones that are genuinely separate places with their own inhabitants" — the foundation the per-zone-world-object work (308) and any future zone content builds on.

**Added to Structure Track:** none — drained from queue (4 open ≥ X=4; cap rule says pick, don't invent).

**Chosen this cycle:** BACKLOG-274 — Populate the grove (assign home zones + cross-zone proximity-interaction filter; the render filter already shipped).

**Note:** BACKLOG-293 (crafted-object persistence) is still a confirmed ABANDON-as-duplicate — 286's additive `cairns` save already persists + re-renders the cairn. Three verdicts have now flagged it; recommending the Validator formally close it `[a]` this cycle so the queue stops carrying dead debt. (Not picked as this cycle's build item — 274 is the real work.)
