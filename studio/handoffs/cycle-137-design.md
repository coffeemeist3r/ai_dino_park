# Cycle 137 — Design

Two tracks. The lore track prices a climb that 420 built and then threw away; the structure track
gives a ballot something to answer to, and gives the park a founding council that can actually hold
one. Both are judged against CHARTER v7's reachability bar, and both name their answer below.

---

## Lore track — BACKLOG-422: Warmed by the catch

### The problem

420 shipped three registers — *pleased*, *teasing*, *fondly resigned* — that climb across one
unbroken stretch of solitude, and the climb changes exactly one thing: which string is printed. Close
the dialog box and the park is bit-identical to a park where the player never walked over. The
milestone's arc says *being found is a conversation, not a lookup*; a conversation that moves nothing
is a lookup with better prose.

### The design

**The register is the price.** Being found warms the bond, and how much it warms it is the register
the catch reached — so the escalation 420 built is now the *mechanism* rather than the decoration.

```
bashful  -> 0
pleased  -> 2
teasing  -> 3
resigned -> 4
```

`bashful = 0` is load-bearing and must not be "fixed" into a small positive number. 420's own header
states the rule: the unfond reading does not climb, *and that flatness is the tell that this dino
likes you*. A dino that barely knows you gains nothing from being found, however often you find it.
Warmth is the same statement in a second register.

**Two caps, and the second one is the interesting one.**

- `CATCH_WARMTH_PER_STRETCH = 9` — exactly `2 + 3 + 4`. **One solitary stretch is worth exactly one
  full climb.** The first catch pays 2, the second 3, the third 4, and the fourth (also *resigned*,
  also nominally worth 4) pays nothing. A player standing on top of a ticcing dino mashing the greet
  key gets one climb's worth and then a lot of nice sentences.
- `CATCH_WARMTH_LIFETIME = 36` — four full climbs, **persisted**. This is the cycle-133 freshness-gate
  lesson applied to a bond: a warmth with no lifetime ceiling is a farm, and a ceiling that lives only
  in memory is a farm with a reload button. It goes in the save.

`catchWarmth(register, earnedThisStretch, earnedLifetime)` returns what is *actually* granted —
`min(price, stretchRoom, lifetimeRoom)`, floored at 0 — so both caps are one expression and neither
can be applied at a call site and forgotten at another.

**The beat.** A grant that crosses a whole-heart boundary lands one ticker line
(`catchWarmedLine`). Sub-heart grants are silent: the ticker reports things the player can see, and
a heart is what the player can see.

### Files

- `game/src/world/tic.ts` — `CATCH_WARMTH`, the two caps, `catchWarmth()`, `catchWarmedLine()`.
- `game/src/scenes/WorldScene.ts` — per-stretch tally (transient, cleared by `resetTic` with the rest
  of the stretch state), lifetime tally (persisted), the grant at the existing catch site beside the
  `caughtRegisterMemory` filing, one dev hook.
- `game/src/world/saveGame.ts` — one optional additive field.
- Tests: `game/src/world/cycle-137-warmth.test.ts` (unit), `tests/e2e/cycle-137-warmth.spec.ts`.

### Acceptance criteria (lore)

1. `catchWarmth('bashful', 0, 0) === 0` — the unfond catch never warms.
2. A full climb in one stretch grants 2, then 3, then 4.
3. A fourth catch in the same stretch grants **0** (per-stretch cap), while still printing its
   *resigned* opener — the sentence is not gated on the warmth.
4. A dino at the lifetime ceiling grants 0 on a first catch of a fresh stretch.
5. A partial-room case is clamped, not overshot: with 8 already earned this stretch, a *teasing*
   catch grants 1.
6. In-game: a fond dino's affinity points rise by exactly the register's price on a catch, and the
   per-stretch tally clears when `resetTic` ends the stretch.
7. The lifetime tally round-trips a save/reload; a reloaded save at the ceiling still grants 0.
8. A whole-heart crossing logs one ticker line; a sub-heart grant logs none.

### Reachability (CHARTER v7)

*In a fresh save, watched for ten minutes, what does the player see that they could not see before?*
**A dino's hearts go up for having been found.** Befriend one dino to the 8-heart fond floor (the
413 gate this rides), walk away until it falls into its ritual (~20 solitary steps, 60s at
`WANDER_STEP_MS`), then greet it three times without breaking the stretch: the affinity points move
on each of the three, by 2, 3 and 4, and the heart crossing lands in the ticker. Before this cycle
those same three greets printed three sentences and changed nothing in the save file.

---

## Structure track — BACKLOG-492: A vote that answers to a history

### The problem, and the bigger problem underneath it

Since 487 a ground's **both** calls are the council's, and every seat votes a hard threshold on a
single **name-seeded** axis: `providerPriority` reads `agreeableness >= 0.5`, `providerWorkPriority`
reads `energy >= 0.5`. Those numbers are fixed at the instant the dino was named and are touched by
none of the ledgers this park keeps. A ground can starve for a season, watch its granary come down
and reseat three times, and its politics are the arithmetic of five birth-numbers. 484's term is a
calendar over a constant; 485's bill has to **override** the vote precisely because it cannot
**persuade** it.

Underneath that sits a worse fact, found while scoping: **on a fresh save no ground seats a council at
all.** `zoneCouncil` requires `foodBanked >= COUNCIL_MIN_BANKS` and the founding cast has banked
nothing, so seven cycles of governance — two votes, a term, a turnover beat, a bill lean, two lens
glyphs — are unreachable from boot. That is `TILES_PER_HEAD` with a ballot box, and CHARTER v7's
corollary names it a defect rather than a compatibility win. **Both halves ship this cycle or neither
does.**

### The design — half 1: the lived ballot

A new pure module `game/src/world/ballot.ts`. A seat votes its temperament **shaded by what it has
lived on the ground it sits for**, as a bounded nudge across the line rather than a replacement for
the trait — the `043`/`187` capped-drift shape, applied to a decision instead of a personality.

```ts
export interface SeatExperience {
  hunger: number;      // 0..1 — this seat's own (371)
  heldShort: boolean;  // its ground has held mouths short under the bank reserve (471)
  share: number;       // 0..1 — its banked units as a fraction of its ground's banked total (448)
}
```

**Weights and the cap:**

```
LIVED_NUDGE_CAP = 0.2     // the whole shift a life can be worth, either way
HUNGER_WEIGHT   = 0.3
SHORT_WEIGHT    = 0.15
SHARE_WEIGHT    = 0.2
```

The cap is the design. 0.2 is enough to carry a seat sitting near the threshold across it and not
nearly enough to turn a decided temperament: Bramble votes warm at 0.87 and Rex votes prickly at
0.019 no matter what either of them lives through. **A seat's temperament stays the floor.**

**Pantry ballot** (shades `agreeableness`; higher = `feed`):
`+HUNGER_WEIGHT*hunger  +SHORT_WEIGHT*(heldShort)  -SHARE_WEIGHT*share`, clamped to +/-cap.
A seat that is itself hungry, or sits for a ground the reserve has refused, leans to feeding. A seat
that put most of the pile there leans to protecting it.

**Labour ballot** (shades `energy`; higher = `build`):
`-HUNGER_WEIGHT*hunger  +SHARE_WEIGHT*share`, clamped to +/-cap.
A hungry seat wants backs on the gathering; the seat that filled the pile wants the pile to become
something.

**The derelict term is deliberately absent, and this is a finding, not an omission.** The item's own
text asks for "whether it stood in a zone whose landmark came down (480)" to shade the vote. It
cannot: 485's `calledWork` already replaces the labour call outright with `'gather'` for as long as
anything on that ground is derelict, so a derelict term in the labour ballot could only ever fire in
the exact states where its result is guaranteed to be discarded. Adding it would have been a weight
with a unit test and no reachable effect — the thing this charter now calls a defect. Recorded in the
module header so the next cycle does not "restore" it.

**API:**

```ts
export function livedShift(lived: SeatExperience | undefined, call: 'pantry' | 'labour'): number
export function votedSpend(traits: Personality | undefined, lived?: SeatExperience): SpendPriority
export function votedWork(traits: Personality | undefined, lived?: SeatExperience): WorkPriority
```

`votedSpend`/`votedWork` **call** `providerPriority`/`providerWorkPriority` on the shaded traits
rather than restating the threshold — the 420 compatibility seam ("the old path *is* the old
function"), which is what keeps the 463/473/481/487 specs green by construction. `lived === undefined`
=> shift 0 => the pre-492 answer to the bit.

**Wiring** (`WorldScene`): `spendPriorityFor` and `decideWork` map their seats through the voted
functions with a new private `seatExperience(name, zone)`. The tie-break — the provider's own vote —
is read *lived* too, because the provider is a seat and a tie-break that ignored its history would be
the one ballot in the room that doesn't answer to anything.

**The no-council provider fallback stays unlived, on purpose.** A ground with no seats falls through
to 463's monarchy, untouched. That branch is the live control: it is the same dino reading the same
trait the same way it did before this cycle, sitting beside the branch that changed.

### The design — half 2: the founding park seats a council

`game/src/world/founding.ts` gains:

```ts
export const FOUNDING_BANKED: Record<string, number> = { Pip: 2, Bramble: 1 };
```

Seeded on the `!save` branch beside `FOUNDING_RUIN`/`FOUNDING_PILES`, into the existing additive
`foodBanked` save field — no version bump, and a restored save seeds nothing.

Why the Grove, and why those two: it has exactly two residents, so `councilSeats(2, 2) = 1` — **one
seat, no tie to break**, the simplest possible live council. Neither reaches `PROVIDER_BANKS = 3`, so
no provider exists and the tie-break is `null`, which keeps the founding vote a genuine single ballot
rather than a council shadowed by a monarch. And Pip sits at `agreeableness = 0.522` — twenty-two
thousandths over the pantry threshold. **The founding seat is a seat whose ballot a life can actually
turn**, which is the charter's corollary stated as a spawn table rather than as a rule.

### The founding beat, traced

At boot Pip holds 2 of the Grove's 3 banked units => `share = 0.667` => pantry shift `-0.133` =>
shaded agreeableness `0.389` => the Grove calls **`bank`** (the lens reads the bank glyph), where the
unshaded park would have called `feed`. Pip's hunger then builds at `HUNGER_RATE` per step; at
`hunger >= 0.444` the shift crosses back positive and the Grove's ballot **turns** —
`checkCouncilCall` logs `the Grove's council calls it: feeds its own first` and the lens glyph flips.
That is ~45 force-steps, about two and a quarter minutes at `WANDER_STEP_MS`.

### Files

- `game/src/world/ballot.ts` — new pure module.
- `game/src/world/founding.ts` — `FOUNDING_BANKED`.
- `game/src/scenes/WorldScene.ts` — `seatExperience()`, the two vote sites, the founding seed, a dev hook.
- Tests: `game/src/world/cycle-137-ballot.test.ts`, `tests/e2e/cycle-137-ballot.spec.ts`.

### Acceptance criteria (structure)

1. `livedShift(undefined, ...) === 0`, and `votedSpend(t)` / `votedWork(t)` equal
   `providerPriority(t)` / `providerWorkPriority(t)` for every input when unlived.
2. The shift is clamped: no `SeatExperience`, however extreme, moves a vote by more than
   `LIVED_NUDGE_CAP` on either call.
3. A decided temperament never turns: Bramble (0.87) votes `feed` and Rex (0.019) votes `bank` under
   the most extreme experience in either direction.
4. A near-threshold seat *does* turn: Pip (0.522) votes `bank` at high share and `feed` at high hunger.
5. `heldShort` alone moves a `bank`-leaning near-threshold seat toward `feed`.
6. The labour ballot is the mirror: hunger -> `gather`, share -> `build`, capped identically.
7. A fresh boot seats a council on the Grove — one seat, and it is `Pip`.
8. The founding Grove reads `bank` at boot (the shaded answer), where the unshaded ballot reads `feed`.
9. Driving Pip's hunger past the crossing turns the Grove's pantry call to `feed` and logs the
   council line.
10. A ground with no council is untouched — the provider fallback answers exactly as it did pre-492.
11. `npm run build` clean, `npx vitest run` green, `npx playwright test` green.

### Reachability (CHARTER v7)

*In a fresh save, watched for ten minutes, what does the player see that they could not see before?*
**A ground holding an election, and then changing its mind.** Before this cycle a new save contained
no council on any ground — the zone-map lens showed the unset badge for every ground until somebody
banked food, which the ambient sim reaches long after a player has stopped watching. From this cycle
the Grove seats a council at boot, its pantry glyph reads bank-first from the first time the player
opens the zone map, and within about two minutes of watching, Pip gets hungry enough that its own
ballot turns and the ticker announces the Grove has changed its call. That is the first decision in
this park's life that a player can watch change for a reason that happened in front of them.
