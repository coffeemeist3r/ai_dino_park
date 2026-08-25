# Cycle 140 — Design

Two tracks. The lore track closes the last open arc in Milestone 15; the structure track makes a
sentence in the constitution true.

---

## Lore track — BACKLOG-423

**Item:** BACKLOG-423 [ai] Tic-flavored voice — a caught dino's reply is coloured by which ritual it was
interrupted at.

### Why this cycle

Milestone 15's last unchecked arc reads "the ritual colours the voice." Everything the studio has built
around the tic since cycle 405 is about the ritual's *body* — what starts it, where it drifts, who catches
it, what the catch costs, who learns it. The catch itself now has four registers (bashful, pleased,
teasing, resigned), a warmth price, a memory per register, and a friend-left trace. Not one of them looks
at **what the dino was actually doing**. Catch a pacer and catch a fusser and the words are byte-identical.
The park has three rituals and one voice for being caught at any of them.

### The one design call, made explicitly

The backlog text says "enrichment-on-top with the deterministic bashful/fond frame (408/413) unchanged
under stub/fallback." Taken literally that ships a cycle that is **bit-identical without a model** — which
is exactly what CHARTER v7's reachability bar calls a REWORK, and the model is optional by charter (the
player may decline the download; headless CI has no WebGPU). So the item ships in **two layers**, and the
sentence is honoured in the strict sense that matters: the 408/413/420 opener *strings* are unchanged.

1. **Deterministic layer (ships to every device).** A new per-kind clause — the *tic aside* — sits between
   the opener and the reply: the physical business of stopping what you were doing. A pacer has not quite
   stopped moving; a circler finishes its turn; a fusser puts the thing down and then picks at it again.
   Three kinds, three distinct asides, no model involved.
2. **Enrichment layer (where a model is present).** `NPCContext` gains an `interrupted` field carrying the
   ritual's kind and label, and the WebLLM prompt asks for a line that sounds like it — restless,
   dizzy-slow, distracted. The brain boundary is untouched: the model is *told what happened*, never asked
   to author the frame, and a null/absent field produces today's prompt exactly.

### What ships

Walk up to a dino that is mid-ritual and press Z.

- The line still opens with the register's opener (bashful / pleased / teasing / resigned — unchanged text).
- It then carries a short **tic aside** that differs by ritual kind. Catching Rex at a `pace` and catching
  Rex at a `fuss` now produce visibly different sentences on the same register.
- Where the model is loaded, the reply itself leans that way too.
- Nothing else about the catch changes: the register escalation (420), the warmth grant (422), the memory
  filing, the company trace (411) and the ordering between them are all as they were.

### Acceptance criteria

- [ ] `ticAside(kind)` exists in `game/src/world/tic.ts` and returns a non-empty string for each of the
      three `TicKind` values, and the three strings are **pairwise distinct**.
- [ ] The composed greet line for a caught dino is `<opener> <aside> <reply>` in that order, with exactly
      one space between parts and no double spaces.
- [ ] `bashfulOpener()`, `fondOpener()`, `teaseOpener()`, `resignedOpener()` and `caughtOpener()` return
      byte-identical strings to before this cycle (a unit test pins at least `bashfulOpener` and
      `fondOpener` against their literal text).
- [ ] A dino greeted while **not** mid-ritual gets **no** aside — the glad-of-company path (411) and the
      plain greet are unchanged.
- [ ] Each of the three asides is distinguishable by a substring a test can assert (e.g. the pace aside
      mentions feet/moving, the circle aside mentions the turn, the fuss aside mentions the thing it was
      fiddling with).
- [ ] `NPCContext` gains an optional `interrupted?: { kind: TicKind; label: string }`; the WebLLM prompt
      builder emits a ritual-flavour line when it is set and emits a prompt **identical to today's** when
      it is absent (unit test on the prompt builder, both branches).
- [ ] `WorldScene` sets `interrupted` only when `this.caughtTic === target.name`, using the same
      `this.ticFor(target)` the memory filing already uses — so the aside, the memory and the prompt can
      never name three different rituals.
- [ ] The stub/canned brain path produces the full line (opener + aside + canned reply) with no model
      present — asserted by an e2e that runs with no WebGPU.
- [ ] `@mlc-ai/web-llm` still appears nowhere outside `game/src/ai/` (grep).
- [ ] Save format unchanged (this feature persists nothing new).
- [ ] `npm run build` clean, `npx vitest run` green, `npx playwright test` green.

### Out of scope

- Per-dino variants of the aside (the distinctness already comes from *which* ritual is that dino's
  signature tic, which is name-seeded).
- Changing any opener text, register threshold, warmth number, or memory string.
- Colouring any voice other than the caught greet — not the ticker lines, not the book, not the
  glad-of-company opener.

### Constraints

- The 408/413/420 opener strings are frozen. Add beside them; do not edit them.
- The aside is a pure function of `TicKind` in `tic.ts` — no Phaser, Node-testable, no `Math.random()`.
- The model is enrichment only: with the stub brain, everything above still happens.
- **File overlap with the structure track: none.** This track touches `game/src/world/tic.ts`,
  `game/src/ai/brain.ts`, `game/src/ai/webllmBrain.ts` and one block of
  `game/src/scenes/WorldScene.ts` (the greet path, around lines 6455–6480).

---

## Structure track — BACKLOG-500

**Item:** BACKLOG-500 [infra] The grounds nobody lives on — a residency invariant, and the residents to
satisfy it.

### Why this cycle

CHARTER v7 says, in the constitution, "the cast ships across the map, not stacked in one zone: the roster
carries a spawn zone, and **every ground the player can walk to has life on it at boot**." The roster that
shipped with that amendment spreads eight dinos as 5 bowl / 2 grove / 1 fernreach / **0 hollow / 0 ridge**.
Two of five grounds are exactly as dead today as all four were before the amendment. `founding.ts` already
knows this and says so in a comment — `foundingCouncils()` returns the empty grounds deliberately, "the
evidence BACKLOG-500 was filed on." The evidence has been sitting in the codebase for a cycle. Cash it.

The Ridge is the sharper half: it is the park's only **branch**, the one ground reached by a decision rather
than by continuing east. A branch with nobody on either arm is a longer walk to the same nothing.

### The tension, resolved rather than papered over

The Structure-smith flagged it and the choice is made here: **grow the roster from 8 to 10 — do not
rebalance the eight.**

The bowl at five is the cast the 460 last-one floor, the huddle, the food scramble and `TILES_PER_HEAD`
(`ceil(294 / 60) = 5`, documented as booting *at* capacity) were all tuned against. Moving a body off the
bowl to fill the Hollow would silently re-tune four systems at once to pay for a spawn-table edit, and the
cycle would spend itself re-deriving numbers instead of shipping the thing. Two new residents cost two more
minds per tick and two more rows in a handful of cast-counting specs, and cost the bowl nothing.

**Species and diet:** neither new resident is a `compsognathus`. `diet.test.ts` pins the carnivore set to
exactly the compsognathus rows, and quietly adding a third hunter would change the hunting balance as a
side effect of a residency fix.

### What ships

Start a brand-new save and walk east, then north out of the Grove.

- **The Hollow** — cold, damp, the far end of the line — has a resident standing on it at boot.
- **The Sunward Ridge**, up the branch out of the Grove, has a resident standing on it at boot.
- Every ground in `zoneChain()` has at least one dino on it in a fresh park, and a test says so.
- Everything a ground can hold — a plot, a landmark, a pile, an upkeep bill, a mend errand, a council seat
  — is now *live* on all five grounds instead of three.

### Acceptance criteria

- [ ] `ROSTER` gains exactly two entries: one with `zone: 'hollow'`, one with `zone: 'ridge'`. Names are new
      and unique; species are drawn from the existing five; neither is `compsognathus`; colours are visually
      distinct from all eight existing entries.
- [ ] The five bowl entries (Rex, Mossback, Sunny, Twitch, Glade) are **unchanged** — same names, tiles,
      species, colours, and no `zone` field.
- [ ] `founding.ts` exports `foundingResidents(): Record<string, string[]>` — every ground in `zoneChain()`
      is a key (present-and-empty is a different claim from absent), values are the roster names that wake
      up there.
- [ ] `founding.ts` exports `groundsWithoutResidents(): string[]`, derived from `foundingResidents()`.
- [ ] A unit test asserts `groundsWithoutResidents()` is `[]` — the residency invariant. It must read
      `zoneChain()`, not a hard-coded list of five ids, so a sixth ground inherits the invariant on the day
      it is added.
- [ ] A unit test asserts every `ROSTER` entry's `(tileX, tileY)` is a **grass** tile in its own zone
      (`zoneTileAt(zone, x, y, cols, rows) === 'grass'`), for all ten entries — a body cannot spawn in the
      pond or the thicket.
- [ ] No ground exceeds `zoneCapacity` at boot (assert per ground against the derived capacity), so the
      crowding damp (476) is not switched on by this change.
- [ ] `foundingCouncils()` still returns an entry for every ground; the Grove's and the bowl's seats are
      **unchanged** by the two additions (the new residents bank nothing, so they are ineligible — pin it).
- [ ] An e2e asserts that after boot, each of the five zone ids reports at least one dino resident (via an
      existing occupancy hook, or a new `__zoneResidents()` hook if none fits).
- [ ] `game/src/world/founding.ts` gains a header note recording *why* the roster grew rather than
      rebalanced, naming the bowl-at-five tuning it protects.
- [ ] Save format unchanged and additive-only: the two new dinos spawn from `ROSTER` on the `!save` branch
      exactly as the other eight do; an **existing save loads without error** and without them being
      duplicated in.
- [ ] `npm run build` clean, `npx vitest run` green, `npx playwright test` green.

### Out of scope

- Giving the Ridge a reason to be chosen (BACKLOG-503) or the pile a place (BACKLOG-504) — both seeded
  this cycle, both follow-ups.
- Any retune of `TILES_PER_HEAD`, `ZONE_FLOOR`, the huddle, the last-one floor or the food scramble.
- New species, new art, new personas beyond what name-seeding already produces.
- The declared founding fixture (495) and the reachability register (501) — this cycle produces the *fact*
  those two will describe.

### Constraints

- The Coder must **check the spawn tiles against `zoneTileAt` before choosing them**, not after the specs
  go red. The Hollow and the Ridge have their own terrain rows in `ZONE_TERRAIN`.
- Expect fallout in cast-counting specs. Any spec that asserts a cast size or enumerates roster names is to
  be **updated to the new roster**, never deleted, and the update noted in the codeplan.
- `proceduralPersona` uniqueness (`cycle-091-persona.test.ts` asserts one distinct text per roster entry)
  must still hold at ten.
- **File overlap with the lore track: none.** This track touches `game/src/entities/roster.ts`,
  `game/src/world/founding.ts`, and cast-counting specs.
