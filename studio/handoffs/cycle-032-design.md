# Cycle 32 — Design

## Item
BACKLOG-125 [social] Greeting the runner-up — greeting the jealous runner-up right after a
homecoming gives an outsized affinity bump and flips 😒 → 😊 ("you noticed me"); jealousy is
repairable through attention. Builds on 120.

## Why this cycle
Cycle 31 (BACKLOG-120) gave the bowl jealousy: come home after a long absence and a near-tied
runner-up sulks (`Hmph. 😒`) while your closest dino gets its welcome-back. But the slight just
*hangs there* — the dino files "the keeper fussed over <rival>" and nothing ever heals it. That's
half a feeling. This cycle closes the loop: the keeper can make it right by simply walking over to
the overlooked dino and saying hello. Doing so right after a homecoming gives an **outsized**
affinity bump (bigger than a normal greet) and flips the mood (😒 → 😊, `You noticed me!`). It's
the smallest possible interactive repair — distinctness through a relationship you can *hurt and
then heal*, no model required — and it unblocks the "repair learns trust" thread (128/129).

## What ships
- After a homecoming beat fires with a jealous runner-up (the existing BACKLOG-120 path), that
  runner-up is marked as **pending repair** (a transient, in-session flag — no save change).
- When the player greets that same dino (the existing **E**/Z interact, or a dino-to-dino greet
  via the dev hook), instead of the normal small greet bump the dino receives an **outsized**
  affinity gain, a floating `<name>: You noticed me! 😊` bubble, and a "the keeper made it up to
  me" memory. The pending-repair flag is then cleared (one-shot — a second greet is just a normal
  greet).
- If the player never greets the slighted dino, nothing changes (the sulk memory from 120 stays as
  it was). If a *new* homecoming fires, the pending repair retargets to whoever is freshly jealous.
- Observable: walk in after a long away, see Sunny get 👋 and Glade sulk 😒; walk to Glade, press
  E; Glade's hearts jump more than a normal hello would give, a 😊 "You noticed me!" floats, and
  the sulk is settled.

## Acceptance criteria
- [ ] After `__catchUp` produces a homecoming with a jealous runner-up, a `__pendingRepair()` dev hook returns that runner-up's name.
- [ ] With no jealous runner-up (lone favorite or clear gap), `__pendingRepair()` returns null.
- [ ] Greeting the pending-repair dino raises its friendship points by **more** than a normal greet of the same dino would (outsized bump), verified against `greetGain` for the same traits.
- [ ] Greeting the pending-repair dino floats a bubble containing that dino's name and `😊` (visible via `__bubbleTexts()`).
- [ ] Greeting the pending-repair dino writes a distinct "made it up"/"noticed" memory for that dino (not the plain "stopped by to say hello"), verifiable via the memory recall hook.
- [ ] After a successful repair greet, `__pendingRepair()` returns null and a second greet of the same dino gives only the normal `greetGain` (one-shot).
- [ ] Greeting a dino that is **not** the pending-repair target gives the normal `greetGain` and leaves `__pendingRepair()` unchanged.
- [ ] Pure repair logic lives in a Node-testable module (`game/src/world/repair.ts`) with no Phaser/WebLLM import; `repairGain(traits) > greetGain(traits)` for representative traits.
- [ ] `npm --prefix game run build` clean; `npx vitest run` green; `npx playwright test` green.

## Out of scope
- Persisting the pending-repair flag across reloads (it's transient — repair is a same-session
  beat; a reload simply clears it). No `SAVE_VERSION` bump.
- "Repair learns trust" / softening future sulks (BACKLOG-128) — separate cycle.
- Bond decay for a never-repaired slight (BACKLOG-129) — separate cycle.
- Any change to the homecoming/jealousy *selection* logic in `homecoming.ts` (120 stays as-is;
  this cycle only consumes its `jealous` output).
- Touching dialog text / brain prompts — the repair bubble is a pure floating string, like the
  jealous bubble.

## Constraints
- **Additive save only.** No new persisted fields, no `SAVE_VERSION` change. The pending-repair
  flag is in-memory scene state.
- Reuse the existing greet path (`recordGreet`, `bumpPoints`, `greetGain`, `remember`) and the
  existing `showBubble` / `liveBubbles` / `__bubbleTexts` machinery from 120 — do not reinvent.
- Keep the `@mlc-ai/web-llm` boundary: nothing outside `game/src/ai/` imports it. `repair.ts`
  imports only `friendship.ts` (for `greetGain`) and the personality type.
- Must not break the existing E-to-greet flow, the jealous bubble (120), or any prior hearts AC.
- The outsized bump is real friendship points (repair *does* change points, unlike the jealous
  sulk which doesn't) — that's the intended reward for noticing.
