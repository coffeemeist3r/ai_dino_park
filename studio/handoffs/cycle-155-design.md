# Cycle 155 — Design

Two tracks, and this cycle they are **one seam and its first consumer**. Build the structure
track first; the lore track sits on top of it. Both are named in the same sentence of the
milestone that closes tonight: the park has learned five ways to talk about your absence and
has never once known when it began.

---

## Structure track — BACKLOG-541: The departure seam

**Item.** BACKLOG-541 [core] — the departure seam.

### Why this cycle

Milestone 18's headline is *the park knows you were gone*, and the number every one of its
shipped arcs reads from is `savedAt`. `savedAt` is written by `currentSaveData()` at
`Date.now()`, and `currentSaveData()` is reached through twenty-odd scattered
`void this.saveGame()` calls that fire on **interactions** — a greet, a feed, a gift, a mend.
Nothing fires when the keeper leaves. The park's only departure code is an inline
`visibilitychange` listener in `setupGovernor` whose entire body retunes the clock rate.

So `savedAt` means *when the keeper last did something*. Sit and watch the bowl for six
minutes without touching it, then step away for one, and the catch-up on return computes a
seven-minute absence — past `MISSED_MIN_MINUTES` (5, and `AWAY_SCALE` is 1, so in-game minutes
are real minutes) — and files missed-you traces, drift, and a digest line about a gap that did
not happen. The park counts the time you spend watching it as time you spent away from it.
That is not a rounding error; it is the milestone's subject, inverted.

### What ships

A new pure module `game/src/world/departure.ts` that owns leaving as a **two-stage fact**, and
one wiring change in `WorldScene.setupGovernor`.

The two stages are not decoration — they are the distinction the lore track needs:

| stage | what is true | can the player see the canvas? |
|---|---|---|
| `here` | focused and visible | yes |
| `leaving` | focus lost, still visible (alt-tab, click another window) | **yes — this is the stage that still paints** |
| `gone` | `document.hidden` / `pagehide` | no |

The module exports:

- `type DepartureStage = 'here' | 'leaving' | 'gone'`
- `departureStage({ focused, hidden }): DepartureStage` — `hidden` wins; otherwise `focused`
  decides. One function, no state.
- `shouldStamp(prev, next): boolean` — true on the **first** transition out of `here`, and
  not again until the keeper has been `here` since. Alt-tabbing back and forth stamps once
  per departure, not once per event.
- `SESSION_MIN_MS` — how long a session must have run before a departure counts as a real one
  (see the lore track; the same constant gates both, so the two beats can never disagree about
  whether the keeper was actually here).

`WorldScene` listens for `blur` / `focus` on `window` alongside the existing
`visibilitychange`, folds both into one `applyDeparture()` that computes the stage, and when
`shouldStamp` says so, calls `void this.saveGame()` — which stamps `savedAt` at the moment of
leaving. The existing clock-rate retune keeps working off `hidden` exactly as it does now.

A dev hook `__departure()` returns `{ stage, stamps }` so the e2e suite can assert the
transition rather than the wall clock.

### Acceptance criteria

- [ ] `departureStage({focused:true,hidden:false})` is `'here'`; `{focused:false,hidden:false}` is `'leaving'`; `{focused:true,hidden:true}` and `{focused:false,hidden:true}` are both `'gone'`.
- [ ] `shouldStamp('here','leaving')` and `shouldStamp('here','gone')` are true; `shouldStamp('leaving','gone')` is false; `shouldStamp('leaving','here')` and `shouldStamp('gone','here')` are false.
- [ ] A `blur` on `window` moves `__departure().stage` to `'leaving'` and increments `__departure().stamps` by exactly 1.
- [ ] A `visibilitychange` to hidden immediately after that blur leaves `stamps` unchanged (one departure, one stamp).
- [ ] A `focus` returns the stage to `'here'`; a subsequent `blur` increments `stamps` to 2.
- [ ] After a blur, the persisted save's `savedAt` advances past the value it held before the blur (the stamp really happened at the departure).
- [ ] `departure.ts` imports nothing from Phaser and nothing from `../ai/` (pure, Node-testable).
- [ ] The existing hidden-tab clock retune still happens: `__governor().hidden` is true after the visibility change.

### Out of scope

- BACKLOG-542 (session length as a persisted record). 541 only knows *that* a session ended.
- Any change to what the catch-up computes. The numbers are already right; only their input was wrong.
- `beforeunload`. It is unreliable, it cannot await an IndexedDB write, and `pagehide` covers the case that matters.

### Constraints

- **Order of work: this track first.** The lore track imports from `departure.ts`.
- `savedAt`'s meaning changes for saves written after this cycle and not before — this is
  additive and old saves are unaffected (an old `savedAt` is still a valid duration input).
- Phaser's own visibility handling must not be disturbed. Verify the game loop still runs on
  window blur; if Phaser pauses it, the lore track's glance must be drawn before the pause
  takes effect, and say so in the codeplan rather than working around it silently.
- Do not route departure through the `NPCBrain` boundary or import `@mlc-ai/web-llm`.

### The bar — *what does a player see in a fresh ten-minute save?*

Open a fresh park and watch it without touching anything for six minutes. Step away for one
minute and come back. **Before this item** the digest reads *"The bowl ran on for 7 minutes"*
and dinos come back wearing missed-you thoughts about an absence that never happened.
**After it** the digest reads *"Barely long enough to notice."* — because it was. The park
stops mistaking your attention for your absence.

---

## Lore track — BACKLOG-119: Goodbye glance

**Item.** BACKLOG-119 [emergent] — the goodbye glance. The last unchecked lore arc of
Milestone 18.

### Why this cycle

Five arcs have taught this park to say something about the keeper's absence, and every one of
them fires on the **return**. This is the bookend: the park noticing you go.

The Lore-smith's warning is adopted in full and is the design's central decision. The item's
own text has named `visibilitychange` to hidden as the trigger since cycle 30, and that is
precisely the one moment in this feature at which the canvas is, by definition, not being
looked at. A glance drawn on a hidden tab is the reachability bar's failure mode in its
purest form, and it has been sitting in the item's text for a hundred and twenty-five cycles
without anyone reading it out loud. **The glance fires on `leaving` — the stage that still
paints.** `gone` is the fallback that keeps state honest, and draws nothing, because there is
nothing to draw to.

### What ships

A pure `game/src/world/parting.ts`:

- `partingGlance(friendship, present: string[], sessionMs): Parting | null` — picks the
  closest dino among those currently in view (highest player-friendship, ties broken by
  lexicographically smallest name — **reuse `homecoming.ts`'s `topBy`**, exported for this;
  do not write a second tie-break), and returns `{ name, hearts, line }`. Returns `null` when
  nobody has any friendship yet, when no candidate is in view, or when `sessionMs` is under
  `SESSION_MIN_MS` (imported from `departure.ts`), so the accidental blur two seconds after
  boot is not a goodbye.
- The line is heart-graded like the homecoming's, contains the dino's name and the eyes glyph,
  and is short — this is a look, not a speech.

In `WorldScene`: a `glanceMarks` family alongside the five existing hour-marks, keyed
`GLANCE_ART_KEY = 'glance'` with `GLANCE_GLYPH`, built through the existing `makeHourMark` and
refreshed through the existing precedence chain. Its place in that order: **top**. Every other
mark is a fact about the dino's own hour or its own thoughts; this one is about the keeper, it
lasts a couple of seconds, and it is the only mark in the family with a deadline. A sleeping
dino does not throw the glance at all (it is not a candidate), so the precedence question the
doze mark would raise never arises.

The glance is held for `GLANCE_MS` and then cleared, and it fires on the `leaving`
transition — the same `shouldStamp` edge the structure track defines, so the goodbye and the
save stamp are the same moment by construction rather than by coincidence.

`__marks()` (the cycle-154 hook) gains the glance so the suite can read it, and
`worldPlacedProps()` in `reachability.ts` counts `GLANCE_ART_KEY` so BACKLOG-540 can be drawn
without reddening the register.

### Acceptance criteria

- [ ] `partingGlance` returns `null` when `sessionMs` is under `SESSION_MIN_MS`, when `friendship` is empty, and when `present` is empty.
- [ ] `partingGlance` picks the highest-friendship name among `present` only — a higher-friendship dino that is not in `present` is not picked.
- [ ] Ties in friendship resolve to the lexicographically smaller name, and the resolution comes from `homecoming.ts`'s `topBy` (one tie-break in the codebase, asserted by both modules' specs).
- [ ] The returned line contains the dino's name and the eyes glyph and is under 60 characters.
- [ ] E2E: on a booted park, once `SESSION_MIN_MS` has elapsed, dispatching `blur` on `window` puts exactly one name in `__marks().glance` within 500ms.
- [ ] E2E: the glance clears within `GLANCE_MS` plus 500ms and `__marks().glance` is empty again.
- [ ] E2E: a `blur` dispatched **before** `SESSION_MIN_MS` produces no glance — asserted as the silence, not skipped.
- [ ] E2E: a visibility change to hidden with no prior blur produces no visible mark (nothing is drawn to a hidden tab) and does not throw.
- [ ] A sleeping dino is never the glancer.
- [ ] `worldPlacedProps()` includes `GLANCE_ART_KEY`, and the reachability register is green.

### Out of scope

- BACKLOG-124's homecoming chorus and any multi-dino goodbye. One look, one dino.
- Any sound. The voicebox exists; a parting chirp is a separate beat and would need its own
  autoplay-policy thought.
- Drawing the rig. That is BACKLOG-540, the Artist's, and it renders as the glyph until then.

### Constraints

- **File overlap with the structure track:** `WorldScene.setupGovernor` (the listener) and
  `departure.ts` (imported for `SESSION_MIN_MS` and the transition edge). Build 541 first and
  wire 119 into the edge it already publishes — do **not** add a second `blur` listener.
- Reuse `makeHourMark` and the existing refresh chain. A sixth parallel array is the pattern
  this file already uses five times; do not refactor the family this cycle.
- Reuse `topBy` from `homecoming.ts` by exporting it. A second implementation of the same
  tie-break is exactly the defect BACKLOG-483 is filed over.
- No inference. The line is deterministic and heart-graded; a device with no model gets the
  same goodbye.

### The bar — *what does a player see in a fresh ten-minute save?*

Open a fresh park, let it run half a minute, then click another window. Before it goes quiet,
the dino that likes you best looks up and throws you a glance with a short line. Nothing in
this park has ever reacted to the player leaving; the only thing it has ever noticed is the
player arriving.
