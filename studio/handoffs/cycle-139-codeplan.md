# Cycle 139 — Code Plan

Order: **lore track first, structure track second.** The lore track is the larger diff and it is the
one that touches `WorldScene` in two places; the structure track's whole point is that it touches
`WorldScene` in *none*, so landing it second keeps that claim honest — if the Coder finds itself adding
a call site for 497, the seam is wrong and the plan says so.

Two rules written down before a line of code:

1. **The beat fires before the teardown, and the teardown is unconditional.** `resetTic` already clears
   nine fields; the 411 beat must not become a fourth thing that can leave a stretch half-ended. New
   private `breakTic(d)` = "file the beat if it earned one" → `resetTic(name)`, always.
2. **`founding.ts` stays the only place the founding governance claim lives.** No second copy of
   `zoneCouncil`'s arithmetic, and no new `WorldScene` call site — the two existing
   `Object.entries(FOUNDING_BANKED)` / `Object.keys(FOUNDING_BANKED)` loops must pick the bowl tallies
   up for free. If they don't, that's the finding, not a reason to add a loop.

---

## Lore track

**Item:** BACKLOG-411 — glad of the company.

### Files to create

- `tests/unit/cycle-139-glad.test.ts` — the pure suite for every new `tic.ts` export.
- `tests/e2e/cycle-139-glad.spec.ts` — the beat and the greeting lead, from a fresh save.

### Files to modify

- `game/src/world/tic.ts`
  - `export const COMPANY_GLYPH = '🙂'` — the float. Must be disjoint from the tic glyphs
    (`🔎 🔁 ...`), the caught marks (`😳 😊`) and the feeding/mood marks. **Grep before choosing**;
    if `🙂` is taken anywhere, pick another and say which in the commit.
  - `export const COMPANY_TRACE_FADES_AFTER_STEPS = 24` — the same window
    `STING_FADES_AFTER_STEPS` uses, and for the same reason: a warm note that outlives the walk back
    to the dino is a note the player cannot connect to anything they saw. Reuse the value by naming
    it, not by importing it — they are two separate claims that happen to agree today.
  - `export function companyTraceIsFresh(stepsSince: number): boolean` — `stingIsFresh`'s twin.
  - `export function foundByCompany(wasTiccing: boolean, hasPressingNeed: boolean): boolean` —
    `wasTiccing && !hasPressingNeed`. One line, and it is the whole ordering rule: the beat is for a
    stretch a *body* ended, not one a need ended. Keeping it here rather than inline in the scene is
    what lets the unit suite state the rule.
  - `export function gladOfCompanyMemory(label: string, friend: string): string` — in the register
    `ticMemory` / `griefTicMemory` / `soothingTicMemory` already use.
  - `export function gladOfCompanyLine(name: string, friend: string, glyph: string): string` — the
    ticker beat, in `echoedLine` / `kinshipLine` / `hauntDriftedLine`'s shape.
  - `export function gladOpener(friend: string): string` — the deterministic greeting frame. Sibling
    to `bashfulOpener` / `fondOpener` / `teaseOpener`; a *constant* string with the friend's name in
    it, no register, no escalation (out of scope this cycle).
- `game/src/scenes/WorldScene.ts`
  - New field beside the other per-stretch tic state:
    `private companyTrace: Record<string, { friend: string; at: number }> = {};`
    **Transient — never saved**, like every 405 field except `ticEchoes` / `ticsFormed` / `ticHaunts`.
    Deliberately **not** cleared by `resetTic`: the trace is what the *ended* stretch left behind, so
    clearing it in the teardown would delete it the instant it is written. It expires by
    `companyTraceIsFresh` and is consumed by the greet.
  - New private `nearestCompany(d: Dino): string | null` — the dino inside `TIC_COMPANY_RANGE` in
    `d`'s own ground, nearest first, name-tie-broken. **Reuse:** this is `companyNear`'s body with the
    name kept instead of a boolean. Refactor `companyNear` to `return this.nearestCompany(d) !== null`
    so one predicate decides both — a beat that names a dino the solitude rule did not agree was there
    is the exact class of bug this codebase keeps catching.
  - New private `breakTic(d: Dino): void`:
    - `const wasTiccing = this.ticInvented.has(d.name)`;
    - if `!this.ambientHeld && foundByCompany(wasTiccing, !!pressingNeed(this.needs[d.name]))`, and
      `nearestCompany(d)` returns a name, then: `flashFeed(d, COMPANY_GLYPH)`,
      `remember(..., gladOfCompanyMemory(this.ticFor(d).label, friend))` — `ticFor`, not
      `signatureTic`, so the memory names the ritual it *performs* (the 407 rule);
      `logEvent(gladOfCompanyLine(d.name, friend, COMPANY_GLYPH))`;
      `this.companyTrace[d.name] = { friend, at: this.worldSteps }`;
    - then `this.resetTic(d.name)` **unconditionally**.
  - Step loop (~L4475): `else this.resetTic(d.name);` → `else this.breakTic(d);`. That is the only
    line that moves; every other caller of `resetTic` (the greet cancel, the dev hook) keeps calling
    `resetTic` directly, because none of them is a stretch ended by a body walking up.
  - `pickTone` (~L6394): after `const caught = ...` and inside the existing prefix composition,
    ```
    const trace = !caught ? this.companyTrace[target.name] : undefined;
    const glad = trace && companyTraceIsFresh(this.worldSteps - trace.at) ? trace : undefined;
    if (glad) delete this.companyTrace[target.name];   // consumed by one line
    ```
    and extend the existing ternary that builds `text` so the glad opener sits **where the caught
    opener sits** — one prefix or the other or neither, never both. Do not add a second concatenation
    step: the mutual exclusion has to be structural, not two `if`s that happen not to overlap today.
    Note the `!caught` guard is doubled by the fact that a caught dino is mid-stretch (so its trace is
    from an *earlier* stretch); that redundancy is intentional and the spec asserts it.
  - Dev hooks, beside `__resetTic`:
    - `__companyTrace = (name) => this.companyTrace[name] ?? null`
    - `__breakTic = (name) => { const d = this.dinoByName(name); if (d) this.breakTic(d); return this.companyTrace[name] ?? null; }`
      — the `__resetTic` precedent: it drives **production's** `breakTic`, not a second path.
    - `__stepsNow = () => this.worldSteps` if no equivalent hook exists (grep first — the fade spec
      needs to age the trace, and aging it by faking `at` would be testing the spec's own arithmetic).
      If nothing suitable exists, prefer letting `__breakTic` take an optional backdated `at` over
      adding a clock hook.

### Test plan (lore)

**Unit (`cycle-139-glad.test.ts`)** — every criterion that is a *decision*:

- `foundByCompany` — true only for mid-ritual + no pressing need; false for each of the other three.
- `companyTraceIsFresh` — true below `COMPANY_TRACE_FADES_AFTER_STEPS`, false at and above it.
- `gladOfCompanyMemory` contains the ritual label and the friend's name.
- `gladOfCompanyLine` contains both names and the glyph.
- `gladOpener` contains the friend's name and is stable across calls (no RNG).
- `COMPANY_GLYPH` is not any of `TIC_BY_AXIS`'s glyphs — the collision the design forbids, pinned.

**E2E (`cycle-139-glad.spec.ts`)** — four specs, all through production hooks:

1. *found mid-ritual* — `__inventTic(A)`, `__placeDino(B)` inside range, `__breakTic(A)`; assert the
   memory names B and the ritual, the ticker carries exactly one matching line, and
   `__companyTrace(A)` is set.
2. *a need is not company* — same setup with A made hungry via the existing needs hook; assert no
   memory, no ticker line, `__companyTrace(A)` null.
3. *the greeting leads with it* — after spec 1's setup, `__pickTone(A, 'warm')` returns a line
   starting with the glad opener; a second `__pickTone` does not.
4. *the keeper's catch outranks* — a dino with a fresh trace that is *also* mid-ritual gets the
   408/420 opener and not the glad one.

---

## Structure track

**Item:** BACKLOG-497 — the council nobody can convene.

### Files to create

- `tests/unit/cycle-139-quorum.test.ts` — the founding-governance pins.

### Files to modify

- `game/src/world/founding.ts`
  - Imports gain `ROSTER` (`../entities/roster`), `zoneChain` + `BOWL_ID` (`./zones`), and
    `COUNCIL_MIN_BANKS`, `COUNCIL_PER_HEADS`, `zoneCouncil`, `type ProviderCandidate` (`../ai/roles`).
    Check `ai/roles.ts` imports nothing that reaches Phaser — it is a pure module today and this must
    not be the change that stops it being one.
  - `export const GOVERNANCE_OBSERVABLE_AT = { residents: COUNCIL_PER_HEADS * 2, banked: COUNCIL_MIN_BANKS }`
    — **derived, never restated.** Doc comment carries the reasoning: `councilSeats` gives one seat to
    any ground with a banker, and a one-seat council is `zoneProvider` with a different glyph; the
    majority arithmetic 487 built, the tie-break, and any call that can split all need two. So the
    number governance is *observable* at is the number that seats two.
  - `export function foundingCandidates(): ProviderCandidate[]` — `ROSTER.map` to
    `{ name, zoneId: r.zone ?? BOWL_ID, foodBanked: FOUNDING_BANKED[r.name] ?? 0 }`. Check
    `ProviderCandidate`'s exact field list first and fill it honestly; if it carries fields the
    founding state has no answer for, that is worth a line in the QA notes.
  - `export function foundingCouncils(): Record<string, string[]>` — `zoneChain()` mapped through
    `zoneCouncil(foundingCandidates(), id)`. One line; the arithmetic stays in `roles.ts`.
  - `FOUNDING_BANKED` gains `Sunny: 2, Glade: 1`, with the existing doc comment extended (not
    replaced) to explain the second ground: the Grove's single seat was the *reachable* half of 492
    and the *unreachable* half of everything 487 built on top of it, so the bowl gets a ledger that
    seats two, both under `PROVIDER_BANKS` so no provider shadows them, and split on the pantry axis
    (Sunny 0.622 / Glade 0.085) so the ground's first vote has something to count.

### Test plan (structure)

**Unit (`cycle-139-quorum.test.ts`)** — modelled on `cycle-136-founding.test.ts`, which is the
precedent for "a test that pins a founding constant against the cost it must cover":

- the shipping roster seats **at least one** council (`foundingCouncils()` has a non-empty entry);
- **at least one ground seats ≥ 2** — the reachability pin;
- every founding seat's tally is **below `PROVIDER_BANKS`** — a council, not a provider in disguise;
- the two-seat ground's seats cast **different** `votedSpend` ballots on unshaded traits;
- `councilSeats(GOVERNANCE_OBSERVABLE_AT.residents, GOVERNANCE_OBSERVABLE_AT.residents) >= 2`;
- `foundingCandidates()` has one entry per `ROSTER` dino, and every un-banked dino reads `0`;
- `foundingCouncils()` covers every ground in `zoneChain()` — including the ones that seat nobody, so
  the Hollow and the Ridge read `[]` rather than being absent (BACKLOG-500's evidence, not its fix).

### Expected fallout

Specs that assert the bowl has no council, or that `__foodBanked()` at boot is Grove-only, are
asserting the defect. Grep `__councils`, `__foodBanked`, `__seating`, `FOUNDING_BANKED` across
`tests/` before starting; update what breaks and list each one in the QA notes with why. Do **not**
weaken the new pins to keep an old assertion green.

---

## Blockers

_(none — filled by the Coder if the gates fail.)_
