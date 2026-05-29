# Cycle 4 — Lore Handoff

**Theme:** The park has a clock, a sky, and a memory — but Rex is a coin-flip of canned lines. Before the real WebLLM brain (005) lands, the dinos need *selves*: stable personalities that make one dino different from the next and that the brain can read. Cycle 4 seeds personality. Cycle 5 (next, by operator plan) spawns a cast to wear those personalities.

**Cycle status:** Lore-smith bumped cycle 3 → 4. Cycle 3 closed BACKLOG-009 (save/load), APPROVED. Fourth hand-driven cycle this Friday.

**Suggested next-up: BACKLOG-010 [core/ai] NPC personality traits.**

Why: it's small, pure (a seed → 5 numbers → a prompt phrase), and it's the input the brain has been waiting for. Seed traits deterministically from the dino's name so they're stable across reloads without bloating the save. Feed them into the `NPCBrain` context and let even the stub *show* them (mood). When 005 arrives, the prompt slot is already there.

Fallback: BACKLOG-017 (spawn 5 NPCs) if traits prove too thin alone — but they pair: 010 then 017 is the plan.

Do **not** pick 005 (WebLLM) in a hand-run cycle — model download, ugly headless e2e.

**Mood note:** five axes, two poles each, no astrology. Curious↔cautious, social↔solitary, calm↔energetic, warm↔prickly, bold↔timid. Make it deterministic and testable.
