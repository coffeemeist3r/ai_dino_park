# Cycle 89 — Lore Handoff

**Theme:** The same moment, two dinos. Cycle 88 taught the keeper to catch a dino mid-ritual (408)
— and every dino went bashful the same way. That's a sameness bug in a "living minds" game: the
whole point of the tic was distinctness. This cycle the *catch itself* forks on the individual —
a dino that loves you isn't embarrassed to be seen, it's delighted. One event, opposite readings,
decided by the bond you've built with that particular dino.

**Suggested next-up:** **BACKLOG-413 [social] Fond of being caught** — a dino caught mid-tic (408)
that already loves the keeper (hearts ≥ the close-friend floor `FOND_MIN`, the same threshold the
fond greeting 272 uses) reacts *pleased* (😊) not bashful (😳), its opener warm and its filed memory
glad rather than sheepish. It reuses the entire 408 catch path — only the glyph, the deterministic
opener, and the memory text fork on bond — so it's a tiny, model-free, testable-without-a-brain
diff that turns a uniform reaction into five distinct ones. Slots cleanly beside the structure pick
(413 lives in tic.ts + the greet methods; 384 lives in resource spawn) with no file collision.

**Added to BACKLOG:**
- BACKLOG-419 [art] Frond pixel prop — a PROP_RIG twin of branch/stone for the 🌾 frond (400); the cycle-88 Artist flagged it as the one renderable-now art the frond opened up. (deliberately seeded so the Artist has real work next fire, per the stash-ahead deferral's own escape clause)
- BACKLOG-420 [social] Caught again — a fond mid-tic dino greeted twice in one stretch turns from pleased to playful teasing.
- BACKLOG-421 [emergent] The ritual drifts — a tic's anchor slowly wanders the zone over many stretches.
- BACKLOG-422 [social] Warmed by the catch — being caught *fond* leaves a small lasting affinity trace.
- BACKLOG-423 [ai] Tic-flavored voice — a caught dino's reply is prompt-nudged by which ritual it was at (enrichment on top; frame unchanged under fallback).
- BACKLOG-424 [emergent] Traces of your pacing — the re-shape of the unbuildable 407 (a dino finds *memory-filed traces* of another's tic, not a live-watch).

**Note on 407:** last cycle flagged 407 (shared tic) as unbuildable as written — company breaks the tic
before a friend could watch it. Seeded **BACKLOG-424** as its viable re-shape (a lately-vacated tic
spot leaves a memory trace an arriving dino can find), so the idea survives without fighting 405's
mechanics. 407 stays open but should be closed-as-superseded by 424 when 424 ships.

**Idea Box:** one open entry — the **stash-ahead art policy**, still **deferred**. Its escape clause
("revisit only if an art fire would otherwise no-op with nothing but terrain-blocked work left") is
answered *without* changing the rule this cycle: seeding BACKLOG-419 gives the Artist genuinely
renderable-now work (a standalone prop rig), so the next fire has a real subject and the stash-ahead
question doesn't need to bite. No call to make.

**Cycle:** bumped 88 → 89 (both prior tracks APPROVED). Lore track not under rework — fresh pick (413).
