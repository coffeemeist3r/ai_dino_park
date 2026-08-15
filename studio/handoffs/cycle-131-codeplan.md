# Cycle 131 — Code Plan

Two tracks, both closing Milestone 13. Shared file: `game/src/scenes/WorldScene.ts` — different methods.
**Order: lore track first, then structure track.** See Risks.

---

## Lore track

**Item:** BACKLOG-404 [social] Mealtime mood in the voice.

### Files to create

- `tests/unit/cycle-131-mealtime.test.ts` — the outcome reader + the twelve asides.
- `tests/e2e/cycle-131-mealtime.spec.ts` — greet a dino with a seeded hatch memory; greet a fresh one.

### Files to modify

- `game/src/world/manner.ts`
  - Export the four existing regex constants' *meaning* as a new reader, not the constants themselves:
    add `export type HatchOutcome = 'gobbled' | 'yielded' | 'stood' | 'slunk'` and
    `export function lastHatchOutcome(memories: readonly string[]): { outcome: HatchOutcome; other: string } | null`.
  - The four constants (`YIELDED`, `SNATCHED`, `STOOD`, `SLUNK`) must gain a **capture group** for the other
    dino's name so the reader can name them. `mannerTallies` uses `.test()` and is unaffected by adding a
    group. Do **not** duplicate the patterns; one table:
    `const OUTCOMES: readonly { re: RegExp; outcome: HatchOutcome }[]` built from the same four constants,
    and `mannerTallies` keeps using them too. `REPAID` (385) is **not** in `OUTCOMES` — design criterion.
  - Scan `memories` from the **end** backwards (`ai/memory.ts:remember` appends, `slice(-6)`, so the last
    element is newest) and return on the first match.

- `game/src/ai/brain.ts`
  - `NPCContext` gains one optional field:
    `mealtime?: { outcome: HatchOutcome; other: string }` (type imported from `../world/manner` — brain.ts
    already imports `Season` from `../world/seasons` and `SpendPriority` from `../world/governance`, so a
    world-type import here is the established shape, not a new dependency direction).
  - `export function mealtimeAside(outcome, other, traits?): string` — twelve lines, prickly / even / warm
    via the existing `PRICKLY_MAX` / `EFFUSIVE_MIN` constants, each leading with a space, each naming
    `other`. No traits → the even line.
  - `cannedReply`: append `if (ctx.mealtime) reply = {...reply, text: (reply.text + mealtimeAside(...)).slice(0, 460)}`
    — placed **last**, after the 469 policy aside, matching the "least urgent thing composes last" ordering
    the file already documents. Cap raised 400 → 460 for that final slice only (the twelve asides are
    ~60–110 chars); every earlier cap stays exactly as it is.

- `game/src/ai/webllmBrain.ts`
  - Add the fact to the prompt context alongside the existing season / provider / hunger lines, in whatever
    shape `buildMessages` already uses. Enrichment only — the canned floor is unchanged.

- `game/src/scenes/WorldScene.ts`
  - In `pickTone`'s `target.greet({...})` call (≈line 5706), add
    `mealtime: lastHatchOutcome(recall(this.memory, target.name)) ?? undefined,` with a one-line comment.
    `recall(this.memory, target.name)` is already computed twice in that same object literal — leave those
    alone rather than refactoring; this is a greet, not a hot loop.
  - Import `lastHatchOutcome` from `../world/manner` (the file already imports `mannerLine` from there).

### Reuse list

- `game/src/world/manner.ts` — the four memory regexes. **Mandatory**: no new copies (design constraint,
  BACKLOG-483's finding).
- `game/src/ai/brain.ts` — `PRICKLY_MAX`, `EFFUSIVE_MIN`, and the `hungryAside` / `rattledAside` /
  `seasonAside` / `policyAside` shape (leading space, three bands, no-traits default).
- `game/src/ai/memory.ts` — `recall`.
- `game/src/world/pecking.ts:mercyMemory/sparedMemory` — **do not** read these (design: out of scope).

### New dependencies

none.

### Test plan

**Unit — `tests/unit/cycle-131-mealtime.test.ts`**

1. `lastHatchOutcome([])` → `null`.
2. Each of the four strings alone → its own `{outcome, other}` with the right name parsed.
3. Newest wins: `[yield-from-A, gobble-from-B]` → `gobbled` / `B` (the reverse order gives `yielded` / `A`).
4. Non-hatch memories are ignored; a ring of only chatter → `null`.
5. `you repaid X's kindness at the hatch` (385) → `null` — not a contested outcome.
6. `mannerTallies` still counts all five beats correctly after the regexes gain capture groups (regression pin).
7. All twelve `mealtimeAside` outputs are non-empty, start with `' '`, contain the other dino's name, and are pairwise distinct (a `new Set(...).size === 12` assertion).
8. `mealtimeAside(o, name)` with no traits equals `mealtimeAside(o, name, {…agreeableness: 0.5…})` (even band).
9. `cannedReply({...})` with no `mealtime` is byte-identical to the same call before the field existed (use a fixed-affection wistful/fond register so no `Math.random` path is hit).
10. `cannedReply` with `hungry: true` **and** `mealtime` contains both asides and is ≤ 460 chars.

**E2E — `tests/e2e/cycle-131-mealtime.spec.ts`** (pattern: `cycle-097-hunger-voice.spec.ts`)

1. `__remember(Rex, 'you shouldered past Sunny and snatched the food first')` → `__pickTone(Rex,'honest')` →
   `__dialogPage().text` contains `Sunny` and matches the smug regex; also still contains the wistful
   register text (composition, not replacement). Zero console errors.
2. Fresh boot, `__pickTone(Rex,'honest')` → the reply matches none of the four outcome regexes.
3. Newest-wins in the live game: remember a stand, then a slink-off, greet — the reply reads sore, not proud.

### Risks

- **Capture groups on the shared regexes.** `mannerTallies` calls `.test()`, which is unaffected, but the
  `SLUNK` pattern is a *suffix* match (`/ wouldn't budge — you slunk off$/`) with no `^`. To capture the name
  it must become `/^(.+) wouldn't budge — you slunk off$/` — pin the tally behaviour with test 6 before
  changing it. `pecking.ts` has its **own** copies of these patterns with capture groups already (`WEIGHTS`);
  it is not being touched this cycle, but the new manner regexes must match its captures exactly or 401 and
  404 will disagree about who a dino gobbled from. Diff them by eye.
- Length cap: five asides can now stack. 460 is chosen to hold the worst case (fond + hungry + rattled +
  provider + season + policy + mealtime, all warm-band). If a unit test overflows, raise the final cap only.
- `WorldScene.ts` is shared with the structure track — do this edit first, it is one line.

### Estimated touch count

~6 files.

---

## Structure track

**Item:** BACKLOG-482 [infra] One place the standings are derived.

### Files to create

- `game/src/world/standings.ts` — the fold.
- `tests/unit/cycle-131-standings.test.ts`.
- `tests/e2e/cycle-131-standings.spec.ts`.

### Files to modify

- `game/src/ui/lenses.ts`
  - `BookRow`: replace `council?: string` and `pioneer?: string` with `standings?: string[]`.
  - `bookLines`: replace the two `if (r.council)` / `if (r.pioneer)` pushes with
    `for (const s of r.standings ?? []) out.push(\`  ${s}\`)` **at the same position** (council's slot — it
    came first), so line order is byte-identical.
  - `MapZoneRow.council: string[]` is **unchanged** (it is a lens data field, not a book line).

- `game/src/scenes/WorldScene.ts`
  - New private `standings(): Standing[]` = `zoneStandings(this.zoneCandidates(), this.pioneers)`.
  - `providerFor(zoneId)` → reads the folded result (`providerOf(this.standings(), zoneId)`), still returns
    `string | null`. Its four callers (handover 467, provider aside 453, spend policy, lens) are untouched.
  - `zoneCouncils()` → derived from the folded result; keep the method (the lens and `__councils` call it).
  - `councilFor(zoneId)` → likewise. Signatures unchanged so 481's vote path does not move.
  - `bookRows()`: delete the `council:` IIFE and the `pioneer:` IIFE; emit
    `standings: standingLines(all, d.name)`.
  - Dev hook: add `(window as any).__standings = () => this.standings();`. **Keep `__councils` exactly as
    it is** — existing specs depend on it.

### `standings.ts` — the shape

```ts
export type StandingKind = 'pioneer' | 'provider' | 'council';
export interface Standing { zone: string; kind: StandingKind; holders: readonly string[]; }

export function zoneStandings(candidates: readonly ProviderCandidate[], pioneers: Pioneers): Standing[]
export function providerOf(all: readonly Standing[], zone: string): string | null
export function councilOf(all: readonly Standing[], zone: string): string[]
export function standingsOf(all: readonly Standing[], name: string): Standing[]
export function standingLine(s: Standing, name: string): string | null
export function standingLines(all: readonly Standing[], name: string): string[]
```

- `zoneStandings` walks `zoneChain()`, and for each ground emits a `pioneer` standing when
  `pioneerOf(pioneers, z)` is set, a `provider` standing when `zoneProvider(candidates, z)` is non-null, and
  a `council` standing when `zoneCouncil(candidates, z)` is non-empty. Emission order per zone:
  **council, pioneer, provider** — matching today's book line order (council then pioneer; provider has no
  book line and `standingLine` returns `null` for it, so it renders nothing and the book is unchanged).
- `standingLine`:
  - `council` → `👥 one of ${zoneById(s.zone).name}'s ${n} voice${n===1?'':'s'}` — lifted verbatim from the
    `bookRows()` IIFE.
  - `pioneer` → `pioneerLine(s.zone)`.
  - `provider` → `null` (the provider's book presence is the 🧺 *role*, not a standing line; keeping it out
    is what makes this fold behaviour-preserving).
- `standingLines(all, name)` = `standingsOf(all, name).map((s) => standingLine(s, name)).filter(Boolean)`.

### Reuse list

- `game/src/ai/roles.ts` — `zoneProvider`, `zoneCouncil`, `councilSeats`, `ProviderCandidate`. **Compose,
  never re-implement** (design constraint: duplicating the comparator is the failure this item prevents).
  All stay exported; 481's `councilWorkPriority` path is untouched.
- `game/src/world/pioneer.ts` — `Pioneers`, `pioneerOf`, `pioneerLine`, `foundedBy`.
- `game/src/world/zones.ts` — `zoneChain`, `zoneById`.
- `WorldScene.zoneCandidates()` — the roster builder already exists; do not build a second one.

### New dependencies

none.

### Test plan

**Unit — `tests/unit/cycle-131-standings.test.ts`**

1. `zoneStandings([], {})` → `[]`.
2. A roster with one banked provider on one ground: the emitted `provider` standing's holder equals
   `zoneProvider(roster, zone)` for the same input, and the `council` holders array deep-equals
   `zoneCouncil(roster, zone)` — the **agreement pin** (design criterion).
3. A ground with a pioneer but nobody living there emits `pioneer` and neither of the other two.
4. `providerOf` / `councilOf` round-trip: for every zone, they equal the direct `roles.ts` calls.
5. `standingsOf(all, name)` finds a dino holding standings on two different grounds (pioneer of one, seated
   on another).
6. `standingLine` council wording: 1 seat → `voice`, 2 seats → `voices`, with the zone's display name.
7. `standingLine` for a `provider` standing → `null`.
8. `standingLines` order for a dino that is both seated and a pioneer → `[council, pioneer]`.

**E2E — `tests/e2e/cycle-131-standings.spec.ts`**

1. Fresh boot: `__standings()` is `[]`-or-pioneer-only (nobody has banked), the book shows no `👥` line, and
   the map lens shows no `👥` badge — the inert-on-a-fresh-save pin.
2. Bank food into two dinos via the existing dev credit hook (`cycle-127-council.spec.ts` uses it) → the book
   shows the seat line for the seated dinos and the lens shows `👥N`, **the same strings as before this
   cycle**; `__councils()` still returns the same map, and `__standings()` agrees with it.
3. Zero console errors.

### Risks

- **This must not change behavior.** Any moved string is a bug. The strongest safety net is the existing
  suite — `cycle-127-council.spec.ts`, `cycle-129-council-vote.spec.ts` and the book/lens unit tests all
  assert today's strings. If any of them needs its *expectation* edited, stop and re-derive the fold.
- `zoneStandings` calls `zoneCandidates()` once per invocation; `bookRows()` used to call `zoneCouncils()`
  once per open (comment: "derived once per open, not once per dino"). Preserve that: build `standings()`
  **once** at the top of `bookRows()` and pass it into the row mapper, exactly as `councils` is today.
- `BookRow` field removal touches `lenses.test.ts` — those tests may need to construct `standings: [...]`
  instead of `council/pioneer`. That is an import/shape change, not an expectation change; it is allowed.
- Shared file with the lore track: land 404's single line in `pickTone` **first**, then this.

### Estimated touch count

~7 files. Combined cycle: **~13 files** — within the CHARTER v6 arc size.

---

## SHIPPED (Coder, 2026-08-15)

Both tracks landed as planned; no blockers, no plan deviations worth a rework note.

**404** — `manner.ts` gained capture groups on all five patterns (`SLUNK` gained the `^` anchor the plan
flagged) plus `OUTCOMES` + `lastHatchOutcome`, scanning the ring backwards. The captures were diffed against
`pecking.ts`'s `WEIGHTS` copies and match. `brain.ts` gained `NPCContext.mealtime`, `mealtimeAside` (12 lines),
and a final compose step capped at 460. `webllmBrain.ts` gained the matching prompt clause. `WorldScene`
passes `lastHatchOutcome(recall(...))` at the greet site. 11 unit tests, 3 e2e.

**482** — new `world/standings.ts` (composes `zoneProvider`/`zoneCouncil`/`pioneerOf`, never re-implements).
`BookRow.council` + `BookRow.pioneer` → `standings?: string[]`; `bookLines` renders the list in the council's
old slot. `WorldScene.standings()` is the one derivation; `providerFor`, `councilFor`, `zoneCouncils` and
`bookRows` all read it. `__councils` untouched, `__standings` added. 10 unit tests, 2 e2e.

**Assertion edits:** two, both shape-only, exactly as the plan permitted — `ui/lenses.test.ts` and
`tests/unit/cycle-119-pioneer.test.ts` construct `standings: [...]` instead of `council:`/`pioneer:`. No
expectation changed anywhere in the suite.

**Gates:** `npm run build` clean · `npx vitest run` 1753/1753 · `npx playwright test` **504/504 on the first
full run** · `@mlc-ai/web-llm` imported only in `ai/webllm.worker.ts` + `ai/webllmBrain.ts` · no save change.
