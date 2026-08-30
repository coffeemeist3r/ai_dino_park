# Cycle 145 — Design

Two tracks. The lore track pays a wording debt that 512 made visible on frame one of every save; the
structure track builds the instrument that would have caught the class of defect 512 was.

---

## Lore track — BACKLOG-516

**Item:** BACKLOG-516 [core] The founding standing says "first across" about a dino that never crossed.

### Why this cycle

Last night `foundingPioneers()` gave five grounds a recorded founder, and `pioneerLine` rendered every
one of them through a sentence 343 wrote for an *arrival*. The book now says **"first across into the
Grove"** under Bramble, and Bramble has never crossed anything. It is true in the sense the record cares
about — nobody was there before — and false in the sense the sentence makes. The debt was named out of
scope in 512's own design *on purpose*, because 512 was already making one decision; 512 then put the
wrong sentence on the first frame of every save, which is the reachability bar's argument for paying it
tonight rather than filing it forward.

And the fix is not a reword. It is the park learning to hold a distinction it has never held: **a place
you were born and a place you walked to**. One is inheritance, the other is a choice somebody made, and
by the end of this cycle the player's own book tells them apart.

### What ships

A founding now has a **kind** as well as a holder.

- **`born`** — the ground was founded by the dino the roster wakes there. Reads:
  *"has been in the Grove since the first morning"*.
- **`crossed`** — somebody walked in and was the first ever to do it. Keeps 343's sentence:
  *"first across into the Saltpan"*.

Derived, never stored — the doctrine `standings.ts` states in its own header. `foundingPioneers()`
already holds the complete list of spawn-foundings; a founding is `born` exactly when the recorded
pioneer for a ground is the one the founding roster names for it, and `crossed` otherwise. **No save
field is added and no save is migrated**, which also means an old save reinterprets correctly rather
than carrying a stale flag.

What the player does: open the collection book on the first frame of a new save. Five founding lines
render, and all five now say *since the first morning*. Then walk east past the Hollow into the
**Saltpan** — the one ground in the park nobody has founded — and the ticker posts 343's flag beat
unchanged, and that dino's book block says **"first across into the Saltpan"**, the only line of its
kind in the park. Two sentences where there was one, and the difference between them is a thing the
player did.

### Acceptance criteria

- [ ] `pioneerLine` takes a founding kind and returns the *since the first morning* wording for `born`
      and the unchanged *first across into …* wording for `crossed`.
- [ ] Both wordings go through `theZone` (BACKLOG-499's rule) — no hand-rolled article, and the repo-wide
      article grep test stays green.
- [ ] A `foundingKind(pioneers, zoneId)` read lives beside `foundingPioneers()` in `founding.ts` and
      returns `born` iff the recorded pioneer is the one the founding roster names for that ground.
- [ ] `zoneStandings` carries the kind on the pioneer standing; `standingLine` renders it. No consumer
      re-derives it.
- [ ] On a fresh save the collection book renders **five** founding lines and **none** of them contains
      the string `first across` (e2e, via the book).
- [ ] A dino that crosses into the Saltpan gets a `first across into the Saltpan` line, and the 343
      ticker flag beat is unchanged (unit test of the seam, plus `pioneerEvent` untouched).
- [ ] No new save field; a pre-145 save loads and renders the correct kind for each ground with no
      migration step.
- [ ] Build clean, unit + e2e green.

### Out of scope

- Recording *when* a crossing happened, or a third kind (a ground resettled after being hollowed still
  keeps its original founder and its original kind — first-write-wins is 343's rule and it stands).
- Any change to `pioneerEvent`, `settleZone`, or the `· unsettled ·` / `· hollowed ·` frontier reads.
- The founder's-stake props (513/514/517/518) — art, and the tile that plants them is not this item.

### Constraints

- `pioneer.ts` must **not** import `founding.ts` — `founding.ts` already imports `pioneer.ts`'s type, and
  a runtime cycle between them is a real hazard. The kind is *passed into* `pioneerLine`; the derivation
  lives in `founding.ts` and the wiring in `standings.ts` (which imports both today without a cycle).
- `standingLine`'s emission order (council, pioneer, provider) does not move.
- Overlaps the structure track at exactly one file: **`founding.ts`**. Land this track first; the
  register then takes `foundingKind` as an entry rather than re-deriving it.

---

## Structure track — BACKLOG-501

**Item:** BACKLOG-501 [infra] The reachability register.

### Why this cycle

CHARTER v7's bar — *in a fresh save, watched for ten minutes, what does the player see that they could
not see before?* — is enforced by a human writing a paragraph in a verdict. The **standing** answers,
the ones that make the shipping park worth booting, are pinned by one bespoke test each written by
whoever happened to notice: the Grove's ruin, the two bank ledgers that seat a council, the two-rate
clock, the spread cast, the Ridge's obsidian, the one frontier. Nothing lists them together, so nothing
can say when one goes dark — and going dark is *silent*, because a claim about the founding state is
only ever surfaced by moving a founding constant, which is exactly the thing v7 wants done more often.

This is Milestone 16's last arc, and it is the arc that makes the next four cycles cheaper: 509 (the
tithe) is the biggest founding-constant move on the queue and its own text records that the *milder*
version reddened thirteen specs. Build the instrument, then move the constant.

### What ships

`game/src/world/reachability.ts` — the register, and one test that walks it.

Each entry names four things:
- **`id`** — the BACKLOG item that made the claim.
- **`system`** — what the player can see, in the bar's own register ("a broken landmark, and somebody
  mending it").
- **`fact`** — the founding fact that makes it reachable ("the Grove ships a fallen cairn and enough
  stone to mend it").
- **`holds()`** — a pure predicate over the founding surface. Not a restatement of a constant: it asks
  the same question the player's experience asks, through the same functions production uses.

The entries the register opens with, one per standing claim v7 and its successors have made:

| id | system | checked through |
|---|---|---|
| 486 / 500 | every ground you can walk to has life on it | `groundsWithoutResidents()` is at most the frontier |
| 488 | a broken landmark and somebody mending it | `FOUNDING_RUIN` + `FOUNDING_PILES` vs `REPAIR_COST` |
| 492 / 497 | a vote with something to count | `foundingCouncils()` seats two somewhere |
| 493 | a day boundary a player can sit through | `ACTIVE_SCALE` gives a day inside a session |
| 503 | one thing that exists on the Ridge and nowhere else | the Ridge's exclusive resource |
| 505 | a frontier that is actually a frontier | exactly one ground reads unsettled |
| 512 | the book names who founded each ground | `foundingPioneers()` covers every inhabited ground |
| 516 | and says whether they were born there or walked in | `foundingKind` returns both kinds reachably |

`darkEntries()` returns the entries whose `holds()` is false. The walking test fails naming every dark
entry and its `fact` — so the failure message is *"the park no longer ships X, which is what made Y
reachable"* rather than an assertion diff.

**And the condition the Structure-smith set: the first walk is not allowed to be decorative.** Whatever
it finds dark ships fixed *in this cycle*. If it comes up all-green, the register must be extended until
it is making a claim nobody has checked before — an all-green register over a hand-picked list of things
that already have tests is a verdict paragraph with a `.test.ts` extension, and the Coder should report
that in the codeplan rather than declare victory.

### Acceptance criteria

- [ ] `reachability.ts` exports `REACHABILITY_REGISTER`, an entry type, and `darkEntries()`.
- [ ] Every entry has a non-empty `id`, `system` and `fact`, and ids are unique (pinned by a test).
- [ ] Every `holds()` goes through the **production** function that owns the fact — no entry restates a
      constant's literal value. (`GOVERNANCE_OBSERVABLE_AT`'s derived-never-restated discipline, applied
      to the whole register.)
- [ ] Entries cover, at minimum, the eight claims in the table above.
- [ ] A single test walks the register and fails on any dark entry, reporting `id` + `fact`.
- [ ] The test is *proven to fail*: flipping one founding constant in a scratch run reddens it. Recorded
      in the codeplan's shipped section, not left as an assurance.
- [ ] Anything the first walk finds dark is **fixed in this cycle**, or the entry is removed with the
      reason recorded — a claim quietly deleted to make a suite green is the defect this item exists to
      catch.
- [ ] Build clean, unit green, e2e green. Pure TypeScript, no Phaser import.

### Out of scope

- Surfacing the register in the game UI. It is an instrument for the studio, not a lens for the player —
  and 501's reachability answer is not "the player can read the register", it is whatever the first walk
  repairs. Say so plainly in the verdict; do not dress it up.
- BACKLOG-495's declared founding **fixture** for specs. Sibling item, still queued.
- Any change to what the founding state *is*, except a repair the register itself demands.

### Constraints

- No Phaser import; the register must be Node-testable and reachable from `vitest` with no DOM.
- Must not import `WorldScene` or anything under `scenes/`. Read the pure founding surface only.
- Land **after** the lore track, so the 516 entry checks a fact that exists.
- The register is a list of claims, not a list of tests: an entry whose `holds()` duplicates an existing
  bespoke test's assertion is fine and expected — the point is that they are in one place and countable.
