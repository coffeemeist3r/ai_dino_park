# Cycle 137 — Code Plan

Reuse check done before planning either track. Nothing new is invented that the park already owns:
the warmth rides `bumpPoints`/`heartsFromPoints` (friendship.ts) and the existing `resetTic` stretch
teardown; the ballot rides `providerPriority`/`providerWorkPriority` (governance.ts) and the existing
`councilFor`/`providerFor`/`shortsByZone`/`foodBanked`/`needs` reads in `WorldScene`. No new registry,
no second comparator, no new save version.

---

## Lore track — BACKLOG-422

### `game/src/world/tic.ts` (append, beside the 420 block)

```ts
export const CATCH_WARMTH: Record<CaughtRegister, number> = {
  bashful: 0, pleased: 2, teasing: 3, resigned: 4,
};
export const CATCH_WARMTH_PER_STRETCH = 9;   // 2 + 3 + 4 — one stretch is one full climb
export const CATCH_WARMTH_LIFETIME = 36;     // four climbs, persisted

export function catchWarmth(register: CaughtRegister, earnedThisStretch: number, earnedLifetime: number): number;
export function catchWarmedLine(name: string): string;
```

`catchWarmth` = `Math.max(0, Math.min(CATCH_WARMTH[register], stretchRoom, lifeRoom))` with both rooms
floored at 0. One expression, both caps.

`catchWarmedLine(name)` returns `` `\u{1F49B} ${name} warms to you a little, for being found` `` — a
yellow heart, disjoint from the pink `♥` the friendship bar already draws and from every existing
ticker glyph in this file (🔎 🐾 🍃 🔁 🌀 🌑).

### `game/src/scenes/WorldScene.ts`

1. Import the four new symbols on the existing `../world/tic` line; import `bumpPoints` (already
   imported? verify — if not, add it to the existing `../social/friendship` import).
2. Two fields beside `ticCatches` (line ~427):
   - `private ticWarmthStretch: Record<string, number> = {};` — transient, per stretch.
   - `private catchWarmthTotal: Record<string, number> = {};` — persisted lifetime tally.
3. `resetTic` (line ~3869): `delete this.ticWarmthStretch[name];` beside `delete this.ticCatches[name]`.
   The lifetime tally is **not** touched here — that is the whole difference between the two fields,
   and it is the 409 `ticsFormed` precedent (a per-stretch flag beside a lifetime fact).
4. The catch site (line ~6290), immediately after the `caughtRegisterMemory` filing block and before
   `this.caughtTic = null`:

```ts
// BACKLOG-422: the register is the price. Granting *after* the memory filing so the two read the same
// register, and inside the `caught` guard so an ordinary greet is untouched.
if (caught) {
  const gain = catchWarmth(register, this.ticWarmthStretch[target.name] ?? 0, this.catchWarmthTotal[target.name] ?? 0);
  if (gain > 0) {
    this.ticWarmthStretch[target.name] = (this.ticWarmthStretch[target.name] ?? 0) + gain;
    this.catchWarmthTotal[target.name] = (this.catchWarmthTotal[target.name] ?? 0) + gain;
    const before = heartsFromPoints(this.friendship[target.name] ?? 0);
    this.friendship = bumpPoints(this.friendship, target.name, gain);
    if (heartsFromPoints(this.friendship[target.name] ?? 0) > before) this.logEvent(catchWarmedLine(target.name));
  }
}
```

   Note the ordering constraint: `fond` is computed from `this.friendship` **earlier** in the same
   function (line ~6285), so a grant here cannot retroactively change the register of the catch that
   earned it. That is correct and must stay — the register is decided by the bond you arrived with.

5. Dev hooks beside the 420 one (line ~1315):
   `(window as any).__catchWarmth = (name: string) => ({ stretch: this.ticWarmthStretch[name] ?? 0, life: this.catchWarmthTotal[name] ?? 0 });`
6. Save: write `catchWarmth: this.catchWarmthTotal` in the save object (beside `foodBanked`,
   line ~7008) and restore `this.catchWarmthTotal = save.catchWarmth ?? {}` (beside line ~7104).

### `game/src/world/saveGame.ts`

`catchWarmth?: Record<string, number>;` beside `ticEchoFrom` (line ~118). Optional ⇒ additive ⇒ no
version bump, and an old save loads with `{}`.

### Tests

`game/src/world/cycle-137-warmth.test.ts` — criteria 1–5, pure.
`tests/e2e/cycle-137-warmth.spec.ts` — criteria 6–8 through the dev hooks: set friendship above the
fond floor, drive a dino into its tic, greet three times, assert the points deltas are 2/3/4, assert
a fourth grants 0, assert `resetTic` (drive company back) clears the stretch tally while the lifetime
one holds, assert the ticker line on a heart crossing.

---

## Structure track — BACKLOG-492

### `game/src/world/ballot.ts` (new, pure)

```ts
import type { Personality } from '../ai/personality';
import { providerPriority, providerWorkPriority, type SpendPriority, type WorkPriority } from './governance';

export interface SeatExperience { hunger: number; heldShort: boolean; share: number; }

export const LIVED_NUDGE_CAP = 0.2;
export const HUNGER_WEIGHT = 0.3;
export const SHORT_WEIGHT = 0.15;
export const SHARE_WEIGHT = 0.2;

export type BallotCall = 'pantry' | 'labour';

export function livedShift(lived: SeatExperience | undefined, call: BallotCall): number;
export function shadedTraits(traits: Personality | undefined, lived: SeatExperience | undefined, call: BallotCall): Personality | undefined;
export function votedSpend(traits?: Personality, lived?: SeatExperience): SpendPriority;
export function votedWork(traits?: Personality, lived?: SeatExperience): WorkPriority;
```

`livedShift` returns 0 for `undefined`, else clamps the weighted sum to `[-CAP, +CAP]`.
`shadedTraits` returns `undefined` for `undefined` traits (so `votedSpend(undefined)` still hits
`providerPriority(undefined)`'s documented warm/feed default rather than a synthesised 0.5 object) and
otherwise clamps the one shaded axis to `[0, 1]`.
`votedSpend`/`votedWork` are one line each: the existing threshold function over the shaded traits.

Module header records the dropped derelict term and why (design §"deliberately absent").

### `game/src/world/founding.ts`

```ts
export const FOUNDING_BANKED: Record<string, number> = { Pip: 2, Bramble: 1 };
```

With the header paragraph: the Grove's two residents, `councilSeats(2, 2) = 1`, both under
`PROVIDER_BANKS = 3` so no provider shadows the seat, and Pip's 0.522 agreeableness is what makes the
founding seat turnable. Cross-referenced to CHARTER v7's corollary.

### `game/src/scenes/WorldScene.ts`

1. New private read, beside `spendPriorityFor`:

```ts
/** What a seat has lived on the ground it sits for (BACKLOG-492). All three reads already exist. */
private seatExperience(name: string, zone: string): SeatExperience {
  const bankedHere = this.dinos
    .filter((d) => zoneOf(this.dinoZones, d.name, BOWL_ID) === zone)
    .reduce((n, d) => n + (this.foodBanked[d.name] ?? 0), 0);
  return {
    hunger: this.needs[name]?.hunger ?? 0,
    heldShort: (this.shortsByZone[zone] ?? 0) > 0,
    share: bankedHere > 0 ? (this.foodBanked[name] ?? 0) / bankedHere : 0,
  };
}
```

2. `spendPriorityFor` — `votes`/`tieBreak` become
   `votedSpend(traits, this.seatExperience(n, zone))`. The provider-fallback branch below is
   **unchanged** (`providerPriority`), and gets a one-line comment saying it is the live control.
3. `decideWork` — the same edit with `votedWork`; its provider fallback likewise unchanged.
4. `__councilVotes` (line ~3456) — the four vote arrays switch to the lived functions, because that
   hook's own comment promises "the vote itself... through the same production path". Leaving it on
   the unlived reads would make the debug hook disagree with the game.
5. `seedFounding()` — after the pile seed:
   `for (const [n, v] of Object.entries(FOUNDING_BANKED)) this.foodBanked[n] ??= v;`
   Guarded by the existing `foundingCleared` / `this.cairns.length` one-shot, so a restored save and a
   spec that cleared the founding state both seed nothing.
6. `__clearFounding` — also clear the founding tallies
   (`for (const n of Object.keys(FOUNDING_BANKED)) delete this.foodBanked[n];`), so the pre-v7
   fixture a spec asks for is genuinely the pre-v7 fixture. **This is the cycle-135/136 lesson
   (BACKLOG-495) and the most likely source of red specs this cycle:** any spec asserting an empty
   council, a `▫` lens glyph, or a null Grove policy has been leaning on "nobody has banked" as an
   unnamed fixture. Expect a batch; fix each by calling `__clearFounding()` out loud, never by
   weakening the assert.

### Tests

`game/src/world/cycle-137-ballot.test.ts` — criteria 1–6, pure, with the real name-seeded traits for
Bramble/Rex/Pip pulled from `seededPersonality` so the calibration is pinned to the actual cast rather
than to invented numbers.
`tests/e2e/cycle-137-ballot.spec.ts` — criteria 7–10: fresh boot seats Pip on the Grove; the Grove's
`spendCall` reads `bank` while the unlived read would be `feed`; driving Pip's hunger up turns it to
`feed` and lands the council line in the ticker; `__clearFounding()` restores a council-less Grove.

---

## Order of work

1. `ballot.ts` + its unit spec (pure, no scene) — cheapest thing that can fail.
2. `tic.ts` warmth + its unit spec.
3. `founding.ts` constant.
4. `WorldScene` wiring for both tracks + save field + hooks.
5. `npm run build`, `npx vitest run`.
6. `npx --yes kill-port 5173`, `npx playwright test` — then the expected founding-fixture triage pass.

## Blockers

_(none — filled by the Coder if the build or a suite cannot be made green.)_
