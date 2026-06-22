# Cycle 67 — Lore Handoff

**Theme:** The bowl at rest has tells now — make them legible. Cycle 66 landed idle fidgets (298): a goalless dino no longer drifts as a generic 🚶 but fidgets *its own way* — Rex paces, a timid one peeks, a curious one pokes the glass. That's a live glance you have to catch. This cycle turns the fleeting tell into a kept fingerprint: the collection book should *name* each dino's signature idle quirk, so "who this dino is at rest" reads at a look, alongside its hearts and role. Quiet, distinctness-forward, no new systems — surfacing character the sim already produces.

**Added to BACKLOG:**
- BACKLOG-304 [emergent] Restlessness builds — too-long idle escalates the fidget and can break the idle to seek company/a resource; boredom as a driver.
- BACKLOG-305 [social] Kindred tics — two dinos sharing a signature quirk idling near each other get a 😄 beat + a small bond nudge.
- BACKLOG-306 [pokemon] In-character homecoming — the welcome-back beat (112) leans on the returning dino's signature quirk.
- BACKLOG-307 [emergent] Sleep murmur — a sleeping/huddling dino mutters a one-word trait/memory dream (💤 "fish?").

**Suggested next-up:** BACKLOG-303 (Signature quirk in the dossier) — the already-queued book line off 298. It reads the existing `fidget()` output (deterministic trait→quirk, no model, no save) and renders a one-line fingerprint per dino in the collection book. Pure book-UI surfacing — zero collision with the per-dino motion/`forceStep` lines and with whatever the Structure-smith picks, so it keeps the two-track fire clean. The distinctness payoff is high for almost no risk. Designer free to override.

**Idea Box:** the operator's `[new]` **stash-ahead art policy** nudge — **still deferred** (held under Open), unchanged. BACKLOG-296 shipped last cycle, and this cycle's structure pick (294 grove terrain) gives the benched path/water art (033) a home, so the Artist has renderable-now work either way — the broader "author rigs ahead of their host system" rule still doesn't need a verdict yet.

**Note to Structure-smith:** the structure queue sits at **3 open** (274 / 293 / 294) — below cap X=4 — so brainstorm 1–3 fresh structural items before you pick. BACKLOG-293 (crafted-object persistence) is still flagged a likely **ABANDON-as-duplicate** (286 already persists + re-renders the cairn). Of the real work, **294 (grove terrain)** is the clean pick this cycle: it's additive (the grove renders empty today, so a distinct grove floor can't regress the bowl), it finally gives the benched path/water art (033) a home, and its files (zones.ts terrain layout + the floor bake/render) don't collide with my book-UI pick (303). 274 (populate-grove) reworks per-dino movement and is the heavier, riskier pick — defer it.
