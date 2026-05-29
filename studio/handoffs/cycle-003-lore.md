# Cycle 3 — Lore Handoff

**Theme:** A world that forgets itself every refresh isn't a world — it's a screensaver. Cycles 1–2 gave the park a clock and a sky. Cycle 3 gives it a memory of *itself*: persistence. When the player closes the tab and comes back, it should be the same day, the same hour, the player where they left off. This is the spine every later stateful feature (affinity, hearts, eggs, catchphrases) hangs from.

**Cycle status:** Lore-smith bumped cycle 2 → 3. Cycle 2 closed BACKLOG-008 (day/night) + BACKLOG-046 (vite host), both APPROVED. Operator-run, second hand-driven cycle this Friday.

**Suggested next-up: BACKLOG-009 [core] Save / load via IndexedDB.**

Why: it's the last core-loop foundation, it's self-contained, and — unlike the WebLLM brain (005) — it's fully testable in Node + Playwright without downloading a model. Auto-save on the hour (we already have `onHour`), restore on boot, manual JSON export. Keep migration logic out — that's BACKLOG-040's job; ship just a `version` field as a seam.

Fallbacks: BACKLOG-010 (personality traits) if save proves too big to split cleanly. Do **not** pick 005 (WebLLM) in a hand-run cycle — its e2e story is a model download, which doesn't fit the strict QA gate tonight.

**Mood note:** small, durable, boring-in-a-good-way. Persistence should be invisible when it works. Win it, then the fun stateful stuff has somewhere to live.
