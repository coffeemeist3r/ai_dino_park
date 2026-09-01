# Cycle 147 — Design

Two tracks. **Lore: BACKLOG-307** — a sleeping dino still sounds like itself. **Structure: BACKLOG-521** —
the constants whose comments describe relationships they no longer have.

---

## Lore track — BACKLOG-307 (Sleep murmur, tied to who the dino is)

### Item

BACKLOG-307 `[emergent]` — *a huddling/sleeping dino occasionally mutters a one-word dream tied to its
strongest trait or a recent memory, so even sleep carries a personality tell.* Builds on 041 / 011 / 181.

### Why this cycle

Milestone 17's second lore arc is *the park at rest has tells you can name*. Cycle 146 put the park at rest
in two shifts; nothing was added about what being at rest *is*. Tracing the existing murmur before writing
these criteria — the discipline cycle 146 adopted, and the reason it caught its own item shipping a
delivery instead of a climb — turned up two facts that decide the whole shape of this item:

1. **`maybeMurmur` gates on `isHuddling`, and `isHuddling` is `inHuddleWindow(hour, season) && nearDen(d)`.**
   Nothing about a dino's own hours. BACKLOG-109 introduced `isResting` — per-dino, chronotype-shaped — and
   the two do not overlap for an owl: the one dino this park ships asleep on frame one, Rex, is asleep at
   08:00, out in the open, hours outside the spring huddle window (21→05) and nowhere near the den. **It
   cannot murmur.** The murmur is currently unreachable in the first twelve real minutes of a fresh save.
2. **A dino with no memories dreams `💭 …zzz…`** — `murmurLine(null)`. On a fresh save no dino has a
   memory, so the murmur's founding state is one string, identical for all five. That is the sameness the
   CHARTER names a defect, sitting in the exact feature whose stated purpose is a personality tell.

So this is not "add a dream word to a working feature". It is: the feature has a founding state in which it
does not fire, and if it did fire it would say the same thing about everybody.

### What ships

Open the game. Rex — the roster's first dino, in the ground the save opens on — is asleep at eight in the
morning with a 💤 over it. Within the first minute or so of watching, a 💭 bubble floats off it, and it is
not `…zzz…`: it is a single word drawn from the axis Rex is furthest from neutral on. Wait by Mossback,
Sunny, Twitch or Glade through nightfall (or open the book now) and each of them dreams a *different* word,
because each has a different signature axis. The dream is stable per dino — the same dino dreams the same
word every night until it has a memory to dream about instead.

Open the collection book (frame one, no waiting, no model): each dino's dossier carries one new line under
its quirk and hours — `💭 dreams of <word>`. Five dinos, five different dreams, on the opening frame.

Once a dino *has* had a day — it ate, it crossed, it was greeted — the murmur goes back to being about that,
exactly as BACKLOG-181 shipped it. The trait dream is what a dino has to say when it has nothing else, which
is what makes it the character read rather than a decoration.

### Acceptance criteria

- [ ] `dreamWord(traits)` is a pure exported function in `game/src/world/murmur.ts` returning one lowercase
      word, deterministic from a `Personality`, with no Phaser and no `@mlc-ai/web-llm` import.
- [ ] The signature axis is picked by **reusing** the existing furthest-from-0.5 rule rather than a second
      copy of it — `fidget.ts`'s `fidget()` / `tic.ts`'s `signatureAxis()` already implement it; the
      Code-planner names which one is reused and `murmur.ts` imports it.
- [ ] Ten distinct dream words exist — one per pole of the five `AXES` — and `dreamWord` returns the high
      pole at/above 0.5 and the low pole below it, matching `fidget()`'s convention exactly.
- [ ] `murmurLine(memory, traits)` returns the 181 memory fragment unchanged when a memory is present
      (every existing `cycle-073-murmur` assertion still passes untouched), and `💭 …<dreamWord>…` when the
      memory is null. `traits` is optional; omitted with a null memory it still returns `💭 …zzz…`, so no
      existing caller or spec changes behaviour it did not ask to change.
- [ ] `maybeMurmur`/`pickMurmurer` select from dinos that are **asleep** — `isResting(d) || isHuddling(d)`,
      still `inView`. An awake, in-view dino never murmurs (the existing e2e assertion holds).
- [ ] On a fresh save at the opening hour, `__forceMurmur('Rex')` returns a non-null 💭 line. (Today it
      returns `null`; this is the reachability criterion and it must be asserted at the opening hour, not at
      an hour the spec sets.)
- [ ] On a fresh save, `__murmur` for the five founding dinos yields **at least three distinct** dream
      words — the anti-sameness check, not five-of-five, so a later roster tweak that lands two dinos on one
      axis does not redden the build for a non-defect.
- [ ] `BookRow` gains an optional `dream?: string`; `bookLines` renders it as `  💭 dreams of <word>` in the
      slot after `hours`, and omits the line entirely when `dream` is undefined (older `BookRow` literals in
      tests stay valid — the same additive discipline `quirk`/`hours` used).
- [ ] The live `bookRows()` sets `dream` for every dino from its traits, so the book read is present on
      frame one with no model and no memory.
- [ ] Unit tests: `dreamWord` determinism, both poles, the ten words distinct, `murmurLine`'s two branches,
      and the book line's present/absent cases.
- [ ] One e2e spec covering the frame-one read: at the opening hour a resting-not-huddling dino murmurs a
      non-`zzz` 💭 line, and the book shows a `dreams of` line for it.

### Out of scope

- Any LLM-coloured murmur (still the 181 follow-up; the `NPCBrain` boundary is untouched this cycle).
- The dream reacting to *which* memory, mood, season, or need — the trait dream is the memoryless case only.
- BACKLOG-121 (the keeper-shaped routine), the arc's other half. It has no ten-minute read and stays queued.
- Changing what `isResting`/`isHuddling` mean, the huddle window, or any 109 constant.
- Art. The sleeping *pose* is BACKLOG-522, seeded this cycle for the Artist, not the chain.

### Constraints

- Additive save changes only — the dream is derived from name-seeded traits and is written to no save, the
  same discipline `fidget()` and `chronotypeOf()` already follow.
- Do not weaken any existing `cycle-073-murmur` assertion. If one goes red, the change is wrong, not the
  spec — the memory branch is meant to be byte-identical.
- `MURMUR_CHANCE` stays where it is. Widening the gate already increases how often a murmur fires; do not
  compound it with a rate change in the same cycle (and do not tune it *down* to compensate — that is the
  v7 corollary in miniature).
- File overlap with the structure track: none. Watch only that `world/tic.ts` may be touched by 521 for
  `TIC_AFTER_STEPS`; the murmur reuses `signatureAxis` from it as a **read**, so land 307 first.

---

## Structure track — BACKLOG-521 (The constants that describe relationships they no longer have)

### Item

BACKLOG-521 `[infra]` — the sweep. Every numeric constant under `game/src/world/` whose name or comment
asserts a relationship to another constant either gets **derived** from the thing it is defined against, or
stays a literal with a **test that pins the relation**, so moving either end reddens the build instead of
quietly retiring a feature.

### Why this cycle

Three weeks ago `WORK_BUILD_FLOOR = 6` sat under a comment saying it was set *above the cairn recipe and
below the granary's, so a gather-first ground visibly banks a while and still builds*. BACKLOG-509 raised a
cairn from 5 to 6. From that instant no affordable pile could be below the floor, so a gather-first ground
never deferred a build again, and the stores-before-walls work policy — a governance choice with a lens
glyph and a persisted setting — was dormant. Build clean, 2310 unit tests green, nothing red for a whole
cycle. The only thing that eventually noticed was an e2e spec that happened to *use* the deferral, and it
surfaced as a confusing off-by-one about cairn counts.

That is CHARTER v7's failure mode arriving by a route v7 did not describe. v7 catches a constant *tuned* to
be dormant. This is a constant *made* dormant by a change on the other side of the park, in a system that
had nothing to do with it. There is no bar a verdict can apply to catch it, because the claim that went
false is written in a comment, and comments do not fail.

### What ships

A relation register, in the shape BACKLOG-501 established for the reachability bar and for the same reason:
a claim that lives in prose cannot break, and a claim that lives in a predicate can.

`game/src/world/relations.ts` holds one entry per relation the park's constants assert about each other —
an id, the claim in the register's own words, and a `holds()` that reads **both ends through the modules
that own them**, never restating a value. `cycle-147-relations.test.ts` walks the list and fails naming the
claim, so a tuning pass that breaks one reads *"`TRACE_FRESH_STEPS` no longer covers two solitary stretches
— the window a mark stays worth noticing is shorter than the solitude it took to make it"* rather than an
assertion diff four modules away.

And the second copies come out. A comment that says *below `STOCKPILE_SOFT_CAP` (6)* is the exact defect
BACKLOG-519 is about, half-shipped: the relation is named **and** the value is written down again beside it,
so the comment can go stale on its own without either constant moving. Every restated `(6)` / `(8)` in a
relation comment is deleted; the register carries the relation instead.

### Acceptance criteria

- [ ] `game/src/world/relations.ts` exports a `RELATION_REGISTER` of entries `{ id, claim, holds() }` and a
      `brokenRelations()` returning those that fail — mirroring `reachability.ts`'s `darkEntries()`, pure
      TypeScript, no Phaser.
- [ ] `holds()` for every entry reads both ends by **importing the owning module's export**. No entry
      contains a numeric literal that is a copy of a constant defined elsewhere. (A literal that is the
      relation's own tuning knob — a multiplier, a margin — is allowed and must be commented as such.)
- [ ] **At least eight** relations are registered, and these six are among them, each already sighted:
      - `WORK_BUILD_FLOOR` above the default structure recipe's total (the cycle-146 repair, now pinned).
      - `PILE_STEPS[2]` strictly below `STOCKPILE_SOFT_CAP` — *"a well-gathered ground reaches its full heap"*.
      - `FETCH_BOND_FLOOR` strictly below `LONER_FLOOR` — the relation `fetch.ts`'s module note calls
        *"the whole design"*, since above it nobody could ever come for a loner.
      - `TRACE_FRESH_STEPS` at least twice `TIC_AFTER_STEPS`.
      - `TIC_AFTER_STEPS_STUNG` < `TIC_AFTER_STEPS_HOMESICK` < `TIC_AFTER_STEPS` — the shortener ladder,
        which is three constants and one claim.
      - `SPOIL_MARGIN` against `FOOD_STOCKPILE_CAP` — the *"bleeds to a floor of `cap - 2` and stops"*
        claim, which is arithmetic about two constants written as prose in a third module.
- [ ] Every relation comment under `game/src/world/` that **restates a value** it also names — the `(6)` in
      `bank.ts`, the `(8)` in `fetch.ts`, and any other found by the sweep — has that restatement removed,
      with the relation now carried by a register entry.
- [ ] `foodstore.ts`'s claim that `FOOD_STOCKPILE_CAP` *"mirrors resource.ts `STOCKPILE_CAP`"* is resolved
      one way or the other and the resolution is stated in the handoff. **The numbers are not to be changed
      to make the comment true** — 6 and 8 are live gameplay tuning and moving either is a balance change
      this item has no mandate for. Either the claim is a real relation (then register it in the form it
      actually holds) or it is a false claim (then correct the comment and say so).
- [ ] **Any relation the first walk finds broken is repaired in this same commit**, and the repair — not the
      register — is what the Validator weighs against the reachability bar. A broken relation that is
      "documented" rather than fixed fails this track.
- [ ] `brokenRelations()` is empty on the shipping tree, and the walk test asserts that, naming the id and
      claim of anything that is not.
- [ ] The register's module note carries 501's two rules in its own terms: go through the production
      function that owns the fact, and a broken entry is repaired, never deleted to make the file green.
- [ ] Full suite green; no gameplay constant's *value* changes except as a repair explicitly named in the
      QA report and the verdict.

### Out of scope

- BACKLOG-495 (the founding fixture) and BACKLOG-515 (the runner's serial/parallel split). Neither is
  touched, and 515's standing `mobile-minds` red remains a standing red.
- Constants outside `game/src/world/` — `art/`, `ui/`, `ai/`, `social/`. The sweep has a stated boundary so
  it can finish; a second pass is a follow-up item if the walk suggests one.
- Rebalancing. This item pins relationships; it does not tune them. If a relation is found broken, the
  repair is the smallest change that makes the claim true again, and it is named out loud.
- Folding these entries into `reachability.ts`. They are different questions — *can the player reach it*
  versus *is this constant still describing the truth* — and 501's file states its own discipline.

### Constraints

- Additive only where the save is concerned; nothing here should touch persisted state at all.
- Deriving a constant must not change its current value on the shipping tree unless that change **is** the
  repair. If deriving `X` from `Y` yields a different number than the literal did, that is a finding: stop,
  say so in the code plan's blocker section, and treat it as the item's discovery rather than a silent
  retune.
- `reachability.ts` is not edited by this track except, if the walk finds a dormant feature, to add the
  entry that would have caught it.
- Sequence after the lore track — 307 reads `signatureAxis` out of `tic.ts` and 521 may touch that file's
  constants; landing 307 first keeps the Coder from renumbering constants underneath a feature.
