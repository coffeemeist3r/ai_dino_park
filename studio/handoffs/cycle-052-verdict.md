# Cycle 52 — Verdict

**Verdict:** APPROVED
**Item:** BACKLOG-234 — The bowl self-corrects

## Rationale

All 9 acceptance criteria PASS; build clean; 471 unit / 172 e2e green in a fresh full run with no flake. CHARTER respected: additive only (no `SAVE_VERSION` bump, twelfth cycle running), no new dependency, NPCBrain untouched, boundary grep clean (no `@mlc-ai/web-llm` outside `game/src/ai/`). The diff is six files; the only new production code is a four-function block in `cold.ts`, a one-line `forget` in `memory.ts`, and a seam branch — and the sympathy-visit block it now nests beside is the same code moved verbatim into the `else`, which the cycle-050 pin staying green proves. No regressions.

This is the cold-rumor arc's keystone, and it earns the slot. Cycle 49 taught the bowl to carry the cold, 50 turned the word into a deed, 51 let the warmth travel too — but every one of those made the channel *grow*. Nothing it ever said could be taken back. A dino that heard Mossback slept cold would pity Mossback forever, even after the keeper thawed it and it's plainly fine. Tonight the rumor mill learns to be wrong out loud: a carrier that meets the dino it was worried about and finds it recovered drops the worry with relief — "Oh — you're alright now, Mossback! 😌" — and the stale rumor is gone from its head for good. A mill that can retract a false alarm is the first one in this bowl that feels true to life.

What makes it more than an add-on is that it *refines* a shipped beat instead of bolting beside it. Before tonight, a carrier meeting a recovered sufferer still threw the cycle-50 pity visit and a sympathy bond-bump — a sad little anachronism, comforting someone who no longer needs it. The fix is a precedence: check `selfCorrect` first, on the very same pre-meeting snapshot the sympathy visit reads, and when it fires the pity visit is suppressed. Relief replaces pity, and the bond is left exactly where it was. The recovered-vs-control e2e pair pins precisely this — same setup, the only difference whether the sufferer was warmed, and the bowl either gives the all-clear or the hug accordingly.

The craft is in the reuse. The carrier→sufferer link is `heardColdWordAbout` (217) unchanged; "did the sufferer recover" is the *exact* predicate `spreadWarmWord` uses, kept textually identical so the two can't drift; the string dropped is the exact `coldWordLine(sufferer)` that was planted, so the one genuinely new primitive — `forget` — is a strict-equality filter with no substring guesswork. Nothing was reinvented, nothing speculative was added, and the only new memory primitive is four lines with its own unit test.

## Notes

- This is correction-by-*sight* only — a carrier must actually meet the recovered sufferer. Correction-by-*time* (a rumor going stale on its own) is BACKLOG-238/222, still deferred; relief travelling as its own bright rumor is 235. Both correctly out of scope.
- One transient e2e red on the first full run (`cycle-044-sound`, a chirp-pitch assertion) was the catalogued parallel-load/audio-timing flake — green isolated 5/5 and green on the fresh full run; it sits outside this cycle's touch (the change is in `converse`, not the greet path).
- No CHARTER amendment needed.
