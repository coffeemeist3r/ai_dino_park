# Cycle 66 — Structure Handoff

**Intent:** Open the build arc's other half — growing, not just gathering. The resources→stockpile→craft spine has shipped three cycles running (146/285/286), but the bowl still produces *nothing the cast eats*: food only ever falls from the keeper's hatch. The plantable plot (145) is the Stardew-flavoured counterpart — a keeper-planted crop that grows over realtime-clock days (105) and harvests into the existing food set, so the bowl finally feeds itself into the hatch/favorites loop (059/061). It's been queued since cycle 35 and never chosen — exactly the starvation the Structure-smith exists to fix.

**Cap rule:** Structure Track is at exactly **X=4** open (145 / 274 / 293 / 294) → **drain, do not invent.** No new structural items this cycle.

**Added to Structure Track:** none — drained from queue (4 open ≥ X=4).

**Chosen this cycle:** **BACKLOG-145** — Plantable plot. Top unblocked item; deps all shipped (105 realtime clock, 059 feeding hatch, 061 favorites). Picked over 274 (populate-grove) deliberately: 274 reworks per-dino movement/zones in `forceStep`, which **collides** with this cycle's lore pick (298 idle fidgets — per-dino idle motion in the same loop). 145 lives mostly in a new pure `world/plot.ts` + a plant/harvest interaction + a growth read off the clock, so the two-track Coder fire stays clean.

**⚠️ Flag for the Validator — BACKLOG-293 is already shipped.** 293 (crafted-object persistence) asks that crafted cairns persist in the save and re-render on load. That is *already done* by 286: `saveGame.ts` carries an additive `cairns?: {tileX,tileY}[]` field (validated, defaults `[]`, no version bump) and `WorldScene` restores + `drawCairn`s them on load (`WorldScene.ts:2885,2933-2934`). 293 is a clean **ABANDON-as-duplicate** — recommend the next Lore/Validator pass close it so the queue reflects reality (it would otherwise read as 4 open when only 3 are real work). Not actioned here (the Structure-smith picks, it doesn't close); left `[ ]` with this note.
