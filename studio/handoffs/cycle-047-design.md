# Cycle 47 — Design Handoff

**Item** — BACKLOG-184 [social] Keeper's warmth — greeting or feeding a shivering dino (179) clears the 🥶 early and files a "the keeper warmed me" memory, so the cold night becomes a thing the keeper can mend (the greet-repair shape, like 125).

## Why this cycle

The cold arc has spent two shipped cycles making a dino's bad night legible — the 🥶 shiver (43) and the cry a friend turns toward (46) — and in both the keeper could only watch. This is the missing half of the loop the jealousy arc already proved: hurt the player can see, then heal the player can *do* (125's repair greet). It gives the keeper agency in the park's most affecting beat, it lands a memory that colours tomorrow's greeting (the park's native currency), and all five items seeded this cycle extend it. Per the lore handoff; the audio thread rests a beat.

## What ships

**The cold funk.** When the winter morning resolves (the existing `resolveColdMorning` edge), every cold sleeper now enters a visible **cold funk**: a persistent 🥶 mark hangs over it (the sleep-marks convention) and the dino is tracked as warmable. The funk is transient day-state — it is **not** saved (exactly like the 125 pending-repair and the sulk before it), and it lasts until **dusk**: when the next night's huddle window opens, any unwarmed funk silently thaws (mark gone, no memory — the "nobody came" note is 208's, later).

**The mend, by hand.** While a dino is funked, the keeper can warm it two ways:
- **Greet it** (plain greet or any tone pick): the greet earns an outsized warm gain — a normal personality-scaled greet **plus a warm bonus**, the exact repair shape — the dino stops shivering on the spot (`<name> stops shivering 😊` bubble, mark removed), and it files **"the keeper warmed me after a cold night"** into the persisted store, where the next greeting context will surface it.
- **Feed it**: if a funked dino is the one that snaps up a hatch drop, the meal warms it the same way — the food's normal gain plus the warm bonus, the bubble, the memory, the funk cleared.

**Nothing else moves.** A non-funked dino greets, tones, and feeds at exactly today's numbers. The 125 repair seam is untouched and **wins** if a greet would be both a repair and a warming (one outsized gain, not two; both flags clear). The cold cry (194), the shiver bubble, and the cold memory all fire exactly as cycle 46 left them — the funk is layered beside them, not into them. Warm seasons never produce a funk.

Dev hooks: `__coldPending()` → names still funked.

## Acceptance criteria

- [ ] Pure: `warmGain(traits) === greetGain(traits) + WARM_BONUS` across trait corners; `warmLine(name)`/`warmMemory()` carry the name / the "keeper warmed me" phrasing; `WARM_BONUS ≥ 6` (at least the repair bonus).
- [ ] Winter cold morning (cycle-043 staging): every `__coldSleepers` name is in `__coldPending` and a 🥶 mark renders over it; a summer morning leaves `__coldPending` empty.
- [ ] Greeting a funked dino raises its friendship by exactly `warmGain` (strictly more than the same dino's normal greet), shows the stops-shivering bubble, files the warm memory (visible in `__memory` and the greet prompt), and removes it from `__coldPending` + the mark from the canvas.
- [ ] The tone path warms too: a tone pick on a funked dino earns `warmGain` (not the tone delta) and clears the funk.
- [ ] A funked dino that eats a hatch drop gains the food's normal reaction **plus** `WARM_BONUS`, files the warm memory, and the funk clears.
- [ ] A non-funked dino's greet/tone/feed gains are byte-identical to today (cycle-006 hearts, cycle-035 tones, cycle-027 favorites specs green unmodified).
- [ ] An unwarmed funk thaws silently when the next huddle window opens: `__coldPending` empties, no warm memory appears.
- [ ] The 125 repair seam is unchanged (cycle-032 spec green unmodified); a greet that is both repair and warming applies the repair gain once and clears both flags.
- [ ] The cycle-043 cold spec and cycle-046 distress spec pass unmodified (shiver, cold memory, cold cry all undisturbed).
- [ ] No save-format change (funk transient by design); no new deps; `@mlc-ai/web-llm` only under `ai/`; full suite green.

## Out of scope

- 207 (hopeful shiver), 208 (nobody-came memory), 209 (book tally), 210 (grateful voice), 211 (pass the warmth).
- Persisting the funk across reload (transient like every pending-beat before it).
- Any change to distress (194), the shiver/memory (179), huddle gates (171), or chirp synthesis.

## Constraints

- Pure logic extends `world/cold.ts` (the warm trio mirrors `repair.ts` exactly); WorldScene glue thin.
- The greet/tone seams are `recordGreet`/`recordTone` — the same functions 125 lives in; the feed seam is `eatFood`. No new input paths.
- The 🥶 marks follow the existing persistent-mark convention (`refreshSleepMarks` pattern) — no new rendering machinery.
- Expiry rides the existing `wasInHuddleWindow` tracker (the same edge 179 resolves on) — no new clock listeners.
- Don't break: 032 repair, 035 tones, 027 favorites, 043 cold, 046 distress, 018 huddle.
