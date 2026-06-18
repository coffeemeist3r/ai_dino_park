# Cycle 56 — Verdict

**Verdict:** APPROVED
**Item:** BACKLOG-251 [emergent] — Gratitude fades.

## Rationale

All 9 acceptance criteria PASS; build clean; 500 unit / 179 e2e green in a single fresh full run, no
flake. This cycle pays off a debt cycle 55 took on with eyes open: "thanks in the voice" (247) shipped
with the freshness gate explicitly deferred — its own verdict named it as 251's scope — so a just-cleared
dino thanked the keeper for the same favour on *every* greet for as long as the `<clearer> cleared my
name` memory sat in the 6-entry ring. That read as a stuck script, the opposite of a Living mind. Now
gratitude comes and goes: the thanks surfaces while the clearing is among the dino's freshest thoughts,
then quiets once it lives on and files newer memories.

The implementation is the right altitude — and a genuinely lazy one. The whole feature is one exported
const and a single loop-bound change on the existing `whoClearedMyName` parser: the scan, which already
ran most-recent-first, now starts at `Math.max(0, len - GRATITUDE_FRESH_WINDOW)` instead of `0`. Because
both the deterministic canned thanks line and the LLM prompt weave read the same `gratitude` ctx field
WorldScene computes from this one parser, gating the parser quiets both paths together with **zero**
WorldScene or brain edits — the gate is inherited at both call sites. The diff is exactly the three
planned files (+131/−3; the code change itself is +15/−3): `world/cold.ts` and the two test files.

Two design calls are worth naming. First, **freshness is read from ring position, not a clock.** The
memory store is a plain `Record<string,string[]>` with no per-entry timestamp; adding one would be a
save-format change for a beat that doesn't need it. Ring position is the only deterministic age signal
available, and it models the feeling correctly — a dino that has lived on (wandered, met others, eaten)
has newer things on its mind. The design flagged the clock-aged alternative as out of scope, not smuggled
away. Second, **the feeling fades, the record doesn't**: the unit test pins that once buried, the parser
returns null *while the grateful memory is still in the ring* (`toContain(mem)`), and the bond 243 earned
is untouched. The dino simply stops bringing it up — exactly the brief the lore wrote.

Regression safety is solid. The five existing cycle-055 `whoClearedMyName` unit assertions keep the
grateful memory in the freshest 1–2 slots, so any window ≥ 2 leaves them green; `=3` is safe, and both
cycle-055 e2e specs (the 247 happy path and its control) passed untouched in the full run, as did every
cold/relief seam spec back to cycle 49. The new e2e proves the *transition* in one flow: a fresh greet
names `Twitch` (canned line + `__greetPrompt`), then `GRATITUDE_FRESH_WINDOW` cold-memory fillers bury
the clearing, and the next greet names no one — both paths quiet, no console errors.

No save-format change (sixteenth cycle running), no new dependency, `@mlc-ai/web-llm` confirmed only
under `game/src/ai/` (grep: `webllmBrain.ts` + `webllm.worker.ts`), NPCBrain not in play, no CHARTER
amendment needed. This is also the **first freshness gate the cold/relief arc has actually shipped** —
222 (old news goes quiet), 233, and 244 are all still open, and they can now copy this tail-window
pattern. Item closed; CHANGELOG + closed-log updated; BACKLOG-251 `[~]` → `[x]`. Unblocks the louder
spoken-gratitude beats now that they stack onto a line that fades: 252 (thanks to their face), 254 (the
named savior swells), and the cycle-56 seeds 256–260.
