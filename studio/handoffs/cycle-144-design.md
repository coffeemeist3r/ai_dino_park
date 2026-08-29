# Cycle 144 — Design

Two tracks. They meet in `zones.ts` and nowhere else: the lore track works on `ZONES[].name`
(how a ground is *said*), the structure track on records keyed by `ZONES[].id` (who *founded* it).
Names and ids do not touch. Sequencing note for the Coder at the bottom of each section.

---

## Lore track — BACKLOG-499

**Item:** BACKLOG-499 [core] The ground with two articles.

### Why this cycle

Milestone 16's lore arcs are all closed, so the lore track is off-milestone by necessity, and this
is the item that best answers CHARTER v7's question without a single new system: it is a defect a
player reads *in the first step of a fresh save*. `ZONES` carries the article inside four of the six
display names (`The Grove`, `The Hollow`, `The Sunward Ridge`, `The Saltpan`), and eight templates
prepend another, so the park announces **"the The Grove's council calls it"**. Since 488 and 492 a
fresh park calls a council and posts an upkeep bill within the first minute, so this is not a rare
line — it is the park's normal speaking voice.

The other half is quieter and is why this needs a seam rather than a patch. A second family of
templates *dodged* the bug by dropping the article entirely — `foodstore.ts` and `brain.ts` each
carry a source comment warning the next author off a prepended article — so those lines read
"**The Grove**'s stores fed Sunny" with a capital article buried mid-sentence. Two files know about
this hazard in prose and neither of them fixed it. Eight lines say it wrong and ten say it stiffly
because there is no one place that answers *how do I name a ground inside a sentence*.

### The decision (make it once)

**The display names keep their articles.** `The Grove` is the ground's proper name; the lens header,
the zone title and every standalone mention keep the capital. What changes is that **every sentence
that embeds a ground goes through one seam**:

```ts
// game/src/world/zones.ts
export function theZone(name: string): string;
```

- name already opens with an article (`The Grove`) → `the Grove`
- name does not (`Pocket Cretaceous`) → `the Pocket Cretaceous`

That is the whole rule, and it is deliberately the *only* rule: no per-site `slice`, no second
helper for the capitalised case, no article stored as a separate `ZONES` field. Prepending a second
article is how this bug was born, and a helper that some sites use and others hand-roll is how it
would come back.

### What ships

A player on a fresh save sees, in the ticker and the book:

- `🗳️ the Grove's council calls it: …` (was `the The Grove's`)
- `🔨 the Hollow turns to gathering — its own walls are coming down` (was `the The Hollow`)
- `🗳️ the Sunward Ridge's council turns over: …` (was `the The Sunward Ridge's`)
- `🔄 Sunny and Murk bartered at the Grove–Hollow edge` (was `the The Grove–The Hollow edge`)
- `🥩 the Grove's stores fed Sunny` (was `The Grove's stores fed Sunny`)
- `🚩 Sunny is the first ever to set foot in the Saltpan` (was `in The Saltpan`)

and the zone lens still reads `The Grove` as a heading, because a heading is a name, not a sentence.

### Acceptance criteria

- [ ] `theZone` is exported from `game/src/world/zones.ts` and unit-tested against all six shipping
      names: the four article-carrying ones return a lowercase article and no duplicate, and
      `Pocket Cretaceous` returns `the Pocket Cretaceous`.
- [ ] `theZone` is idempotent: applying it to its own output changes nothing, for all six names.
- [ ] No source file under `game/src/` (tests excluded) prepends a bare `the ` to an interpolated
      zone name — a repo-wide test greps for the pattern and fails, so the next author cannot
      re-introduce it at a ninth site.
- [ ] The eight doubled-article sites route through `theZone`: `billCallLine`
      (`governance.ts:285`), both `term.ts` council-turnover lines (95, 96), both council-call lines
      in `WorldScene` (871, 887), the two barter memories (4928, 4929) and the barter event line
      (4930, which names **two** grounds in one sentence and must fix both).
- [ ] The mid-sentence bare-name family routes through the same seam and the two source comments
      that warn about the hazard are replaced by the seam itself:
      `foodstore.ts` (`storesFedLine`, `storesFedMemory`, `carriedMemory`, both harvest lines),
      `discontent.ts:52`, `handover.ts:53`, `pioneer.ts` (`pioneerLine`, `pioneerEvent`),
      `frontier.ts` (`settleMemory`, `settleEvent`) and `brain.ts` `providerAside` (all three
      trait branches) + the `webllmBrain` provider-context string.
- [ ] Standalone display is untouched: the zone-map lens entry heading and any place a ground is
      named as a bare label still render `The Grove`, capital and all — pinned by a test so a later
      tidy-up does not lowercase a heading.
- [ ] Unit: every changed line-builder has a test asserting the exact string for an
      article-carrying ground **and** for `Pocket Cretaceous`, so the seam is proved in both branches.
- [ ] e2e: one spec (`cycle-144-articles.spec.ts`) boots a fresh save, drives a council call and an
      upkeep bill, and asserts the ticker contains no doubled article anywhere across the session log.

### Out of scope

- Renaming any ground, or moving the article into a separate `ZONES` field.
- Any grammatical case beyond the definite article (no possessive rework, no "a Grove", no plurals).
- Sentence-initial capitalisation. Every affected line opens with a glyph or a name, so the article
  is always mid-sentence today; a line that one day needs it at position zero can add that case to
  the seam when it exists, not before.
- The LLM prompt bodies beyond the one provider-context string named above.

### Constraints

- `providerAside` is a **deterministic** builder read on every device; its three trait branches are
  each asserted by existing specs. Update the assertions, do not loosen them.
- Memory strings are parsed back out by other modules (`pecking.ts`, `manner.ts` do this for the
  hatch beats; BACKLOG-483 is the standing item about it). Before changing `storesFedMemory`,
  `carriedMemory`, `settleMemory` or the barter memories, **grep for any module that matches against
  their text** and update the matcher in the same commit. A memory reword that empties a silent read
  is the exact failure 483 exists to describe; do not add a ninth instance of it.
- `settleMemory` carries a documented no-other-system's-token rule (`frontier.ts`) — the reworded
  string must still contain no plenty/grove token.
- File overlap with the structure track: **`zones.ts`** (this track adds `theZone`; the other track
  adds nothing there), **`pioneer.ts`** and **`frontier.ts`** (this track rewords their strings; the
  other track changes their logic). Land the structure track's logic first, then this track's
  wording, so the string edits apply to final code.

---

## Structure track — BACKLOG-512

**Item:** BACKLOG-512 [core] The frontier read calls lived-in ground unlived-in.

### Why this cycle

`isUnsettled(heads, pioneer, isOrigin)` is "nobody lives here **and** nobody ever has", and its
second clause is answered by the pioneer record, which 343 writes only on **arrival**. The bowl
therefore has no pioneer and gets a hardcoded `isOrigin` exemption naming one id. That was sound
while the bowl was the only ground anybody woke on.

It is not sound now. CHARTER v7's spread cast and BACKLOG-500 put Bramble and Pip in the Grove,
Thornback in the Fernreach, Murk in the Hollow and Ember on the Ridge — **five grounds with
residents from the first frame and not one pioneer between them.** The moment any of them empties,
`isUnsettled` returns true and the park declares ground its cast has lived on since frame zero to
be a place nobody has ever seen: the frontier badge lights on it, and `unsettledNeighbor` aims a
migrant at it *over an inhabited neighbour*. `cycle-143-saltpan.spec.ts` already pins the behaviour
out loud — walk the Saltpan's founder back out and the Hollow starts reading unsettled.

The honest fix is the one the item names: **record a founding as a founding.** Not another special
case; the deletion of the one that exists.

### What ships

**1. Every ground the roster wakes on has a founder, from the first frame.**

A new pure export beside `foundingResidents`:

```ts
// game/src/world/founding.ts
export function foundingPioneers(): Pioneers;   // zoneId → the first roster name listed on it
```

derived from `ROSTER` in roster order (first listed on a ground founds it), covering every ground in
`foundingResidents()` that has anybody — the bowl included, which is the point. A fresh park seeds
`WorldScene.pioneers` from it at new-game.

**2. `isOrigin` is deleted.**

`isUnsettled(heads, pioneer)` becomes two clauses again. The bowl needs no exemption because it now
has a founder like everywhere else, and — the reason this is a deletion rather than a rename — the
rule stops being *which id the save calls home* and becomes *what the history records*.

**3. An emptied founded ground reads hollowed, and says whose it was.**

This is the visible half and it ships in the same cycle, not after it. Today a ground at zero heads
with a pioneer renders neither badge: `isDeclining` requires at least the floor, so it falls
through to a bare prosperity tier and reads exactly like a thriving ground with nobody drawn on it.
Add, beside `UNSETTLED_BADGE` in `frontier.ts` (its rule lives with its read, per that file's own
precedent):

```ts
export const HOLLOWED_BADGE = '· hollowed ·';
export function hollowedLine(zoneName: string, founder: string): string;
```

with the lens showing `· hollowed ·` for a founded ground at zero heads, and a one-off ticker line
the first time a founded ground empties — naming the founder, because that is the fact the record
now holds and the reason the badge can be told from the frontier's.

**4. Old saves are repaired, not rewritten.**

On load, back-fill `foundingPioneers()` through `recordPioneer` — first-write-wins, so a ground that
already recorded an arrival keeps that arrival and only never-recorded founding grounds are filled.
Purely additive: no save field changes shape, and a save written before this cycle loads without it.

### What the player sees on a fresh save (the CHARTER v7 answer)

**The collection book names a founder for five grounds it never named before, on the first frame.**
`standings.ts` already renders `pioneerLine` on the pioneer's own block; today a new save shows that
line for nobody at all, because nobody has arrived anywhere. After this, Bramble's block reads that
it founded the Grove, Murk's the Hollow, Ember's the Ridge — five standings that need no walk, no
day boundary, no second resident and no model. And the badge that used to be a lie is now a fact:
the Saltpan is the one ground reading `· unsettled ·`, and it stays the only one.

### Acceptance criteria

- [ ] `foundingPioneers()` returns exactly one founder per ground in `foundingResidents()` that has
      residents, and no entry for a ground with none — so the Saltpan is absent.
- [ ] `foundingPioneers()` walks `zoneChain()`/`ROSTER` rather than a list of ids, so a seventh
      ground inherits the invariant the day it is added (the `groundsWithoutResidents` precedent).
- [ ] `isUnsettled` takes two arguments; the `isOrigin` parameter is gone from the signature, from
      `WorldScene`'s call site, and from `frontier.ts`'s doc comment, which is rewritten to describe
      the founding record instead.
- [ ] A fresh save has a pioneer for the bowl, the Grove, the Fernreach, the Hollow and the Ridge,
      and **no** pioneer for the Saltpan.
- [ ] On a fresh save, `isUnsettled` is true for the Saltpan and false for all five others —
      asserted by walking `zoneChain()`, not by naming ids.
- [ ] Emptying any founded ground leaves `isUnsettled` false for it and leaves the Saltpan the only
      unsettled ground. The cycle-143 spec's Hollow case flips from "starts reading unsettled" to
      "still reads settled" and is updated to assert the corrected behaviour with a comment naming
      this item.
- [ ] `unsettledNeighbor` never returns a founded-but-empty ground, so a migrant leaving a hollowed
      neighbour is not aimed back into it.
- [ ] The zone lens renders `· hollowed ·` for a founded ground at zero heads, `· unsettled ·` for
      zero heads with no founder, and the prosperity tier otherwise — three branches, one test each.
- [ ] `hollowedLine` names the founder and is posted once per emptying (re-entering and re-emptying
      may post again; the same ground emptying on consecutive ticks must not repeat).
- [ ] Loading a pre-144 save with an empty pioneer map yields the five founding pioneers; loading one
      that already records an arrival-pioneer for a ground keeps the recorded name (first-write-wins),
      pinned by a unit test with both saves.
- [ ] `saveGame.ts` is unchanged in shape — no new field, no version bump — and the existing
      round-trip specs stay green.
- [ ] e2e: one spec (`cycle-144-founders.spec.ts`) boots a fresh save and asserts (a) the book shows
      a founding standing for a Grove resident, (b) the zone lens shows `· unsettled ·` on exactly
      one ground, and (c) walking the Hollow's resident out leaves the Hollow reading hollowed and
      not unsettled.

### Out of scope

- **BACKLOG-501, the reachability register.** Deferred one cycle on purpose (see the structure
  handoff): its first entries are the standing founding claims and one of them changes tonight.
- Any change to `zoneAppeal`, the migration cadence, or the declining damp. The frontier tier stops
  aiming at founded ground; it is not otherwise retuned.
- Distinguishing *founded at spawn* from *first across* in the wording of `pioneerLine`. It is
  tempting and it is a second decision; the standing reads "first across into the Grove" for both,
  which is true of a founder as it is of an arrival. Filed as a follow-up, not built tonight.
- Mortality, and any path that empties a ground the ambient wander cannot (the zone floor stands).

### Constraints

- Additive save only. `pioneers` already exists and already tolerates absence; do not add a field,
  do not bump a version, do not back-fill anything except unrecorded founding grounds.
- `recordPioneer`'s first-write-wins guard is the back-fill's only safety. Use it; do not assign
  into the map directly.
- `pioneerEvent` fires a ticker line on every `recordPioneer` that returns true. The **back-fill and
  the new-game seed must not post six founding lines into the ticker** — seed the map, do not run
  the arrival beat. This is the sharpest trap in the item.
- File overlap with the lore track: `pioneer.ts`, `frontier.ts`. Land this track first (logic), then
  the lore track's rewording on top.
