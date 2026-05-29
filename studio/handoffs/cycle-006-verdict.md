# Cycle 6 — Verdict

**Verdict:** APPROVED
**Item:** BACKLOG-016 — Friendship hearts

## Rationale
All 9 acceptance criteria pass; build clean, 37/37 unit, 18/18 e2e. This is the first loop the player actually feels, and it's built almost entirely out of what the earlier cycles laid down: ROSTER for the names, the cycle-4 traits to flavor the gain, the cycle-3 save to remember it. The affinity math is a pure module — clamped, immutable `bumpPoints`, hearts from points — and the save change is the disciplined kind: strictly additive, `SAVE_VERSION` untouched, absent field defaulting to `{}` so every cycle-3 save still loads (the version seam doing exactly the job it was left for). I confirmed the back-compat both ways — the unit test for a fieldless v1 save, and the cycle-3 save e2e still restoring cleanly with `friendship` now riding along. No NPCBrain change, no new dependency, the panel built in-scene like the HUD.

I greeted Rex a handful of times and watched the bar fill — ♥♡♡… → ♥♥♡…, the panel popping up on **C** above the night tint, the hearts still there after a reload. The grind is gentle (about a heart every three greets) which is the right Stardew texture, not a bug.

## Follow-ups (no action required)
- Gifts (BACKLOG-015) are the natural next affinity source; the formal befriend/"catch" ritual (022) and the full collection book (021) build on this panel.
- `greetGain` scales by warmth/sociability but not yet by the *player's* gifts or by cooldown — fine for now; a per-day greet cap could come with 015.
- Affinity is player↔NPC only; pairwise NPC↔NPC affinity (013) still waits on NPC movement/interaction (018).

BACKLOG-016 closed. Six cycles in one Friday evening: clock, sky, memory, selves, a cast, and now a reason to care about them.
