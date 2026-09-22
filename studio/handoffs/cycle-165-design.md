# Cycle 165 — Design

Two tracks. Lore: **BACKLOG-156**, the watcher's authored self. Structure: **BACKLOG-533**, the
founding-state declaration ratchet, riding the sulk mark's host as its reachable half.

---

## Lore track — BACKLOG-156: Per-keeper persona authored from lore

### The finding this design is built on

`Keeper.backstory` has existed since cycle 155. It is one written line per observer, four of them, and
a grep tonight found **zero render sites**. The picker lists `name — ability.label: ability.desc`; the
confirmation says `You are <name>, from <era>.` and the ability again. The player has never read a
word of who any of these four things *is*. A second, richer string cached into the same silence would
be BACKLOG-156 shipped as groundwork, which CHARTER v7 calls a REWORK. So the item is designed
**render-first**: the surface comes before the pipeline, and the pipeline fills it.

### What ships

A keeper persona, authored the way a dino's is (CHARTER "Living minds"), and **read on screen**.

1. **`game/src/keeper/persona.ts`** (new, pure, Node-testable) — the keeper's mirror of `ai/persona.ts`:
   - `KEEPER_LORE` — the park from the *watcher's* side. `PARK_LORE` describes the vivarium for
     something living in it; a keeper is outside the glass and came from somewhere else, so the prompt
     needs that framing plus the time-travel premise. Built by **composing** `PARK_LORE`, not by
     re-writing it: one canon, one edit site.
   - `proceduralKeeperPersona(keeper: Keeper): KeeperPersona` — deterministic, **id-seeded** (not
     name-seeded: the name carries a nickname in quotes and a designation, and seeding off the stable
     id is what makes the fallback survive a cosmetic rename). Composed from small authored tables —
     a habit at the glass, a thing it is still working out, what it writes down — with the keeper's
     **own hand-written `backstory` kept verbatim** as the opening clause, exactly as
     `proceduralPersona` keeps a dino's roster `flavor`. Capped at `PERSONA_MAX`.
   - No new validation and no new upgrade rule: `fromPersonaDraft` and `upgradePersona` are imported
     from `ai/persona.ts` and reused as-is. `KeeperPersona` (`{text, source}`) is already
     shape-compatible with `Persona`, which is why 555 wrote it that way.

2. **The brain boundary** — `NPCBrain` gains one **optional** method,
   `authorKeeper?(ctx): Promise<string|null>`, beside `author?`. `ctx` is a **structural literal**
   (`{ name, era, backstory, ability }`), not an imported `Keeper`: `keeper/keepers.ts` imports from
   `ai/`, and `ai/brain.ts` importing back from `keeper/` is a dependency edge pointing the wrong way
   in the one file the CHARTER calls a hard boundary. The stub brain omits it; the WebLLM brain
   implements it with `buildKeeperPersonaMessages`, a sibling of `buildPersonaMessages`. No web-llm
   import moves anywhere: it stays under `game/src/ai/`.

3. **The cache** — `KeeperRecord.persona`, the slot 555 shipped empty. `ensureKeeperPersona()` in
   `WorldScene` mirrors `ensurePersona` line for line: cached → return it; else write the procedural
   one **immediately**, then fire-and-forget the authoring upgrade behind `allowAmbient`. Generate
   once, cached, persisted, never per message. A switch drops it — 555 already decided and tested that.

4. **The render (the reachability half)** — the keeper picker's confirmation dialog. Picking an
   observer today says two lines; it will now say three, the third being that observer's self:

   ```
   You are AETHER-1 "Aki", from the 41st century.
   Empath Protocol: Gentle, sociable dinos warm to you faster.
   A diplomacy unit retired after the Quiet Accord, it drifted back to watch creatures that never
   learned to argue. It keeps a tally nobody asked for.
   ```

   The dialog is one `dialog.show(...)` call and is already reachable from the keyboard (`K`, then a
   number) and from the touch sheet. The composition is pure and lives in `keeper/persona.ts` as
   `keeperIntroLines(keeper, persona)` so the scene stays glue and the text is unit-testable.

### Acceptance criteria (lore)

L1. `proceduralKeeperPersona` is deterministic: same keeper, byte-identical text, every call.
L2. Different keepers produce different persona text (all four ids pairwise distinct).
L3. Every keeper's persona contains that keeper's own hand-written `backstory` verbatim.
L4. `source` is `'procedural'` from the deterministic path; `PERSONA_MAX` is never exceeded.
L5. `proceduralKeeperPersona` is seeded off `keeper.id`: a keeper with a changed `name` and the same
    `id` produces identical text.
L6. A draft folded through `fromPersonaDraft` yields `source: 'llm'`; a too-short or null draft keeps
    the procedural persona unchanged (reuse, not re-implementation — asserted against the shared fn).
L7. `keeperIntroLines` returns the three lines above, in that order, with the persona text last.
L8. **In-game, fresh save:** press `K`, pick observer 1; the dialog shows AETHER-1's persona text, and
    it is not the empty string.
L9. **In-game:** picking observer 2 shows a *different* persona text than observer 1 did.
L10. **In-game:** the persona is cached into the save record — `__keeperRecord().persona.text` is
     non-empty after a pick and equals what the dialog showed.
L11. **In-game:** switching observers clears the cached persona rather than carrying it across
     (555's `switchTo` rule, asserted end-to-end now that something actually writes the slot).
L12. A save round-trips the keeper persona: written, serialized, reloaded, still there (additive —
     a save without it still loads).
L13. `@mlc-ai/web-llm` remains imported only under `game/src/ai/` (grep).

---

## Structure track — BACKLOG-533: The founding-state declaration ratchet (+ the sulk mark's host)

### Part A — the ratchet lint

`tests/unit/cycle-165-founding-declaration.test.ts` (new). It reads every `tests/e2e/*.spec.ts` off
disk and asserts, for each file **not in the frozen baseline**, that it calls `foundingState(`.

- The baseline is a literal exported array of filenames — the files that do not declare today.
- **The baseline's length is itself asserted.** Without that, a file leaving the list and a new
  undeclared file joining it cancel out and the ratchet silently stops ratcheting.
- A file in the baseline that *has* since started declaring **fails the test**, with a message telling
  the author to delete its line from the baseline. A ratchet that lets a fixed entry go stale is a
  list of files nobody has to maintain.
- The failure message for a new undeclared spec names the file and the four fixture names, because a
  lint whose message does not say what to do is a lint people disable.

### Part B — the sulk mark's host (the reachable half)

- `SULK_ART_KEY = 'sulk'` exported from `world/expiry.ts`, where `Funk` and `FUNK_WINDOW` already live.
- `spawnDino` pushes `this.sulkMarks.push(this.makeHourMark(SULK_ART_KEY, MOOD_GLYPH.sulk))` — the
  `mope` line, one cycle old, verbatim in shape. So `hasPropArt('sulk')` is consulted and an authored
  rig is blitted the moment one exists; until then it renders the glyph it renders today.
- `refreshSulkMarks()` hangs it over any dino `inFunk(this.funks, name)` — **both** kinds, `sulk` and
  `shoulder`, because both are the same feeling and 544 gave them one seam — at the cold/mope slot
  (`y - TILE * 1.4`), suppressed while that dino is showing the cold glyph, which is the louder fact
  and which `WorldScene` already treats as the alternate when it shades a sleeping mood.
- `worldPlacedProps()` gains `SULK_ART_KEY`, because `refreshSulkMarks` places it. That is what keeps
  the Artist's rig out of `unplacedRigs()` and the reachability register honest.
- The one-frame `flashFeed` at the funk's start **stays**. It is the sting; the mark is the state.

### Acceptance criteria (structure)

S1. The lint test exists and passes on the tree as committed.
S2. The baseline length is asserted with a literal number, and that assertion fails if the list changes.
S3. A spec file not in the baseline and not calling `foundingState` fails the lint (proven by running
    the predicate over a synthetic source string, not by adding a bad file to the suite).
S4. A baseline file that *does* call `foundingState` fails the lint (the stale-entry direction).
S5. The lint's failure message names the offending file and the legal fixture names.
S6. `SULK_ART_KEY` is exported from `world/expiry.ts` and is in `worldPlacedProps()`.
S7. `unplacedRigs()` stays empty and `cycle-145-reachability.test.ts` stays green.
S8. `sulkMarks` is built through `makeHourMark`, so it is `Text | Image` and a rig can be blitted.
S9. **In-game, fresh save:** a dino in a funk wears the mark for the length of its window, and a dino
    not in a funk does not.
S10. **In-game:** the mark clears when the funk is mended or expires.
S11. A dino showing the cold mark does not also show the sulk mark.
S12. Full suite green; build clean.
