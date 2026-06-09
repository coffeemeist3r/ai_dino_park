# Cycle 37 — Verdict

**Verdict:** APPROVED
**Item:** BACKLOG-155 [core] Selectable keeper — character-select spine + persisted choice + affinity-fit ability

## Rationale
The operator's loudest standing signal — give the faceless keeper an identity the player *chooses* —
lands clean and complete. There is now a roster of three time-traveling robot observers
(AETHER-1 "Aki", VANTA-9 "Vix", LUMEN-3 "Lux"), each with its own era, backstory, and a distinct
ability; the player picks one with `K`, the choice persists across reloads, and it genuinely touches
play. All 12 acceptance criteria pass; build, full unit (263/263), and full e2e (87/87) are green.

The judgment lives where it should: a pure, Node-tested `keeper/keepers.ts` that mirrors `tones.ts`
(an `appeal` over personality axes, scored the same way), and `WorldScene` carries only thin glue —
a picker overlay modeled on the existing tone menu, a number-key dispatcher, and the bonus added at
the three affinity-gain seams. The ability is the right first one: a personality **fit**, so *which*
observer you are quietly decides *which dinos* warm to you fastest — emergence-flavoured, not a flat
stat, and it reads differently against each distinct mind (the CHARTER "Living minds" lens). The save
change is additive (`keeperId?`, no `SAVE_VERSION` bump; old saves and fresh games default to the
first observer), no new dependency landed, and the NPCBrain boundary never came up
(`keepers.ts` imports only the `Personality` type; web-llm stays under `ai/`).

Two judgment calls worth recording, both sound. First, the picker is **not** a modal character-select
screen on boot — it's an in-world `K` overlay plus a non-blocking fading invite on a fresh game. That
was a deliberate scope call to keep the boot path (and the ~20 e2e specs that press keys at boot)
byte-for-byte unchanged; the operator's "choose at the start" is honoured by the invite + the always-
available picker, and the heavier select-screen can come with the avatars (158) once the art direction
settles. Second, QA earned its keep: the first full run failed the cycle-035 tones spec, and for the
right reason — the keeper bonus correctly colors the tone-pick path, which *is* the in-game greet since
BACKLOG-142, so the observed delta is now `tone delta + keeper bonus`. That's a real behavior change,
not a defect; the fix offsets the test's expected set by the live `__keeperBonus`, keeping the four
tone outcomes pinned. Re-verified green.

This is the spine the rest of the arc stands on. No scope creep, no regressions left in the diff.

## Follow-ups (already seeded, not blocking)
- BACKLOG-156 — per-keeper persona authored from lore (the static backstories become LLM-authored, procedural fallback).
- BACKLOG-157 — the other distinct abilities (stat-scan, bond-graph sight, sky-nudge), one per cycle.
- BACKLOG-158 — keeper avatars (vector rigs per observer; supersedes the single-avatar framing of 035).
- The declined GBA-pixel-style nudge remains an open question for the **operator**: it needs a human-approved CHARTER + STYLE-GUIDE amendment (CHARTER v2 retired the Gen3-pixel mandate), not a routine flip.
