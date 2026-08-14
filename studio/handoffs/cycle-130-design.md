# Cycle 130 — Design

Two tracks. **Lore:** BACKLOG-403 (victor's mercy). **Structure:** BACKLOG-466 (the dry season).
No file overlap — 403 is `world/pecking.ts` + `checkFeeding`; 466 is `world/seasons.ts` + `world/needs.ts`
+ `checkNeeds`. Both land in `WorldScene.ts`, in two functions that never call each other.

---

## Lore track — BACKLOG-403 — Victor's mercy

**Item:** BACKLOG-403 [emergent] Victor's mercy — a dino that stood its ground (390) and ate, later seeing
the same gobbler it denied still hungry, may let it have the *next* scrap.

**Why this cycle.** Milestone 13's lore arc 2, and the exact inverse of what shipped last night. 389 read
the **wary** end of `dispositionToward` and spent it on the *approach* — a dino that has been shouldered
aside hangs back. 403 reads the **confident** end and spends it at the *drop* — the dino that faced someone
down can now choose not to take the next one from them. The pair is the milestone's thesis: the same
per-opponent tally, read twice, producing two different characters rather than one bigger number. And it
puts the distinctness where the CHARTER wants it — bold-and-agreeable is magnanimous, bold-and-petty is
not, and both are *bold*, so bravery alone stops being the whole read on a dino at the hatch.

**What ships.**

A new pure predicate in `world/pecking.ts` and one branch in `checkFeeding`, sitting between the 375 yield
and the 387 gobble check:

- When a winner reaches a drop and the 375 friend-yield does *not* fire, the winner looks at the swarm
  around the food for a dino it holds a **`confident`** disposition toward (i.e. one it has faced down at
  the hatch before — 401's own read, not the raw score).
- If that dino is **still hungry** (hunger ≥ `GOBBLE_HUNGER` — the same bar that made it a gobbler in the
  first place), the winner is **well-fed** (hunger ≤ `WELL_FED` — it doesn't need this meal), and the
  winner is **magnanimous** (`agreeableness ≥ MERCY_AGREE`), the winner steps off the scrap and the rival
  eats.
- The winner flashes a mercy glyph, a ticker line names both dinos and *why* ("— it faced <rival> down
  before"), and both sides file a memory through **exported builders** (BACKLOG-483 discipline), not
  inline template literals.
- A petty victor (agreeableness below the bar) does nothing new: the drop resolves exactly as it does
  today, through the gobble/stand path.
- Strongest confidence wins when several qualify; ties by hunger, then lexicographic — the `topBy`
  convention the park uses everywhere.

**Ordering, and why the mercy sits *before* the gobble check.** The rival may or may not be gobbling this
drop. The BACKLOG text is "seeing the same gobbler *still hungry*", not "seeing it grab again" — the grace
is offered, not extracted. Placing the branch ahead of `gobblerAmong` means a magnanimous victor never
reaches the contest at all: the mercy pre-empts the standoff it would otherwise win again. That is the
readable version of the beat, and it keeps `resolveContest` untouched.

**The memories, and why these two are safe.** Neither new string matches any regex in `pecking.ts`'s
`WEIGHTS`, so the mercy does **not** shift either dino's disposition — the victor stays confident, the
rival stays wary. That is deliberate: a gift is not a defeat, and a beat that rewrote its own input would
make the second mercy unreachable. (389's answer to the same problem was to file nothing at all; here the
ring is the right home, because a mercy is an outcome at the hatch, and 404 will want to read it.)

**Acceptance criteria**

- [ ] `showsMercyTo` is pure, exported from `game/src/world/pecking.ts`, and unit-tested.
- [ ] `showsMercyTo` returns null when the winner's hunger > `WELL_FED`, when no candidate reads
      `confident`, when the candidate's hunger < `GOBBLE_HUNGER`, or when the winner's agreeableness <
      `MERCY_AGREE` — one unit test per gate.
- [ ] `showsMercyTo` returns null when the candidate has only **one** contested beat with the winner
      (`PECKING_MIN_BEATS`), so a single stand is not yet a history — same discipline as 389/401.
- [ ] With several qualifying rivals, `showsMercyTo` returns the one with the highest confidence score;
      exact ties resolve by hunger then lexicographically (unit-pinned).
- [ ] Two exported memory builders (victor's and rival's) live beside `slunkOffMemory`; the specs match
      against the builders, not against literals.
- [ ] Neither mercy memory is matched by any `WEIGHTS` regex — a unit test asserts `peckingRead` is
      unchanged after both memories are added to a ring.
- [ ] In game: staging a winner with a `confident` disposition toward a hungry rival in the swarm and
      dropping food makes the **rival** eat, not the winner (e2e, via the existing `__force*` hook family
      plus a new `__mercy()` read).
- [ ] The same staging with the winner's agreeableness below `MERCY_AGREE` resolves through the existing
      gobble/stand path and the winner or the gobbler eats — the mercy branch is not taken.
- [ ] The ticker (`__ticker()`) carries a line naming the victor, the rival, and the because-clause.
- [ ] A fresh park with no contested history shows no mercy beat at any drop — the whole feature is inert
      until a history exists (e2e or unit over the boot state).
- [ ] `npm run build` clean, `npx vitest run` green, `npx playwright test` green.

**Out of scope**

- The collection-book line for mercy (the book already carries 402's manner and 401's pecking order; a
  third read of the same beats is 482's problem, not tonight's).
- Any bond change between victor and rival. 403 is grace, not friendship; whether mercy warms a rivalry is
  a follow-up worth seeding, not an assumption to bake in.
- Mealtime mood in the voice (404) — the next arc, deliberately after this one.
- Retiring the three inline feeding memory literals (BACKLOG-483). This item only promises that *its own*
  two strings ship as builders.

**Constraints**

- The 375 yield keeps priority: a hungry high-bond friend is served before a rival is forgiven.
- `resolveContest` must not change — its three specs (390/394/401) stay green untouched.
- Pure logic in `pecking.ts`; `WorldScene` gets the branch and the flash only.
- Glyph must be unused elsewhere in `game/src` (the cycle-129 artist finding: 👀 was already taken).
- Additive save changes only — this feature persists nothing new (it reads the existing memory ring).

---

## Structure track — BACKLOG-466 — The dry season

**Item:** BACKLOG-466 [core] The dry season — one pure seasonal thirst/water modifier the needs and
waterhole hooks read.

**Why this cycle.** 461 gave the turning year a grip on food and the year has since reached the pantry cap,
the spoilage band, the crop yield, the night den and the daytime cluster. It has never reached a drink.
`THIRST_RATE` is the same constant in every season and a waterhole slakes identically in August and
January, so summer — the season with the strongest real-world claim on thirst — is the one season that
changes nothing about it. This is the last unpaid half of Milestone 8 and the third structure arc of
Milestone 13.

**What ships.**

Two pure additions to `world/seasons.ts`, beside `seasonGrip` and `seasonSocialBias`, and the two hooks
that read them:

1. **`seasonThirst(season): number`** — a multiplier on the trait-scaled thirst build rate. Summer > 1
   (the bowl drinks harder in the heat), winter < 1 (the cold eases it), **spring and fall exactly 1.0**.
   `advanceNeeds` gains an optional `thirstMul = 1` parameter so the default reproduces every build since
   371 byte-for-byte; `checkNeeds` passes `seasonThirst(this.currentSeason())`.
2. **`slakeFloor(season): number`** — the waterhole half. A drink in the dry season doesn't fully slake:
   thirst resets to a small floor rather than 0 in summer, and to 0 in every other season. `satisfy` gains
   an optional `to = 0` parameter; the drink hook passes `slakeFloor(season)`. This is what the deferred
   shrinking-waterhole sprite would have *meant*, done as one number instead of art.
3. **`seasonThirstLine(season)`** — the ticker line at the season turn, mirroring `seasonGripLine`: summer
   and winter announce the shift, spring and fall say nothing (no shift to announce). No silent change
   (CHARTER §Quality bar).

**Acceptance criteria**

- [ ] `seasonThirst` and `slakeFloor` are pure, exported from `world/seasons.ts`, and unit-tested for all
      four seasons.
- [ ] `seasonThirst('spring') === 1` and `seasonThirst('fall') === 1` exactly (the hinges), `summer > 1`,
      `winter < 1`.
- [ ] `advanceNeeds(...)` called without the new argument produces **identical** output to the pre-466
      behavior (a unit test pins the default path).
- [ ] Over the same number of steps, a dino in summer crosses `NEED_THRESHOLD` for thirst in strictly
      fewer steps than the same dino in winter (unit).
- [ ] `satisfy(needs, name, 'thirst')` with no `to` still returns exactly 0 (unit); with the summer floor
      it returns that floor.
- [ ] Hunger is untouched in every season — `seasonThirst` reaches thirst only (unit).
- [ ] In game: `__advanceNeeds(n)` under a forced summer day leaves a dino thirstier than the same call
      under a forced winter day (e2e, via the existing clock/day hooks).
- [ ] In game: a dino standing at its zone's water in summer ends at the floor, not 0; in spring it ends
      at 0 (e2e or unit against `checkNeeds`'s exact composition).
- [ ] The season-turn ticker carries the dry/eased line on the summer and winter turns and nothing on the
      spring and fall turns.
- [ ] `npm run build` clean, `npx vitest run` green, `npx playwright test` green.

**Out of scope**

- A visibly shrinking waterhole sprite (explicitly deferred in the item text).
- Per-zone water variation — the Fernreach's creek and the bowl's waterhole grip identically this cycle.
- Any death or spiral from thirst. The park stays deathless; thirst still only builds and resolves.
- Seasonal effects on the 436 need-pull weighting.

**Constraints**

- Both new functions are pure lookups in `seasons.ts`; **no import from `needs.ts` into `seasons.ts` or
  vice versa** — the season is threaded in as a number by `WorldScene`, which is what keeps the two pure
  modules independent.
- Defaults must keep a fresh save byte-identical (the 461/178/171 compatibility discipline).
- Additive save changes only — nothing new is persisted.
