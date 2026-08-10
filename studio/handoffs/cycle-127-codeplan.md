# Cycle 127 — Code Plan

Two tracks, one fire. **Order: lore (402) first, then structure (479)** — they share `ui/lenses.ts`
and `scenes/WorldScene.ts` and the design pins that sequence so the two lens edits land in separate
hunks.

Prior art checked before planning either track:
- `world/foodweb.ts` — `catchTally` / `escapeTally` / `foodwebStanding` is the **exact** precedent for
  402: a standing derived by filtering the live memory ring, `null` at zero, rendered as one optional
  `BookRow` field. 402 copies its shape rather than inventing one.
- `ai/roles.ts` — `zoneProvider()` is the exact precedent for 479: a per-zone read over
  `ProviderCandidate[]`, banked-descending with an alphabetical tie-break so a reload never changes
  the answer. 479 lands **in the same file, reusing the same input type**. No new module.
- `world/traces.ts`, `world/yearning.ts` — both carry the "a standing is what a dino remembers, not a
  second persisted tally" rule in their headers. Both tracks obey it; **neither track adds a save field.**

---

## Lore track — BACKLOG-402

### New file: `game/src/world/manner.ts` (pure, no Phaser)

```ts
export type TableManner = 'generous' | 'greedy' | 'unbowed' | 'timid';
export interface MannerTallies { generous: number; greedy: number; unbowed: number; timid: number }
export function mannerTallies(memories: readonly string[]): MannerTallies
export function hatchManner(memories: readonly string[]): TableManner | null
export function mannerLine(memories: readonly string[]): string | null
```

Matchers — anchored on the memory strings `WorldScene.checkFeeding` already files. **Do not touch the
strings**; the derivation adapts to them:

| manner | pattern | filed at |
|---|---|---|
| generous | `/^you stepped back and let .+ eat first$/` **or** `/^you repaid .+'s kindness at the hatch$/` | WorldScene.ts:1620, :1627 |
| greedy | `/^you shouldered past .+ and snatched the food first$/` | WorldScene.ts:1662 |
| unbowed | `/^you stood your ground and kept your food from .+$/` | WorldScene.ts:1648 |
| timid | `/ wouldn't budge — you slunk off$/` (built by `slunkOffMemory`, feeding.ts:145) | WorldScene.ts:1654 |

The timid matcher must be a **suffix** match, not a whole-string one — `slunkOffMemory` prefixes the
bold dino's name. Use the em-dash exactly as `feeding.ts` writes it (`—`, U+2014).

`hatchManner`: `null` when every tally is 0. Otherwise max count, ties broken by the declared
precedence `['unbowed','greedy','generous','timid']` — implement it as one ordered array iterated
once, not a chain of `if`s, so the precedence is a single readable line and the "timid never wins a
tie" rule is visible rather than emergent.

`mannerLine`: `🍽️ at the hatch: <manner> — <blurb>` off a `Record<TableManner, string>`:
- generous — `steps back so a friend eats first`
- greedy — `shoulders in and takes the drop`
- unbowed — `holds its ground and keeps its food`
- timid — `backs off when someone won't budge`

### `game/src/ui/lenses.ts`
- `BookRow` gains `manner?: string` (doc comment naming BACKLOG-402 and `mannerLine`, matching the
  `foodweb?` field's comment style).
- `bookLines`: `if (r.manner) out.push('  ' + r.manner);` — placed **immediately after** the `foodweb`
  line and before `rumorsHeard`, so both food reads sit together.

### `game/src/scenes/WorldScene.ts`
- Import `mannerLine` from `../world/manner`.
- In `bookRows()` (≈:2718), one field beside `foodweb`:
  `manner: mannerLine(recall(this.memory, d.name)) ?? undefined, // BACKLOG-402`

No other scene change. `__bookRows` / `__bookText` already exist and pick this up for free.

### Tests — lore track
`game/src/world/manner.test.ts` (co-located, matching `foodweb.test.ts`): one case per acceptance
criterion — empty ring → null, each of the four singles, the 385 repay counting generous, count-beats-
recency, the generous/timid tie, the greedy/unbowed tie, and `mannerLine`'s four shapes.

`tests/unit/lenses.test.ts` (or the existing `ui/lenses.test.ts` — use whichever the file lives in):
a `BookRow` **without** `manner` renders exactly as before; one with it renders the extra row.

`tests/e2e/cycle-127-manner.spec.ts`: boot → `__remember('Rex', 'you stood your ground and kept your
food from Twitch')` → `__bookText()` contains `Rex` block with `at the hatch: unbowed`; a dino with no
such memory has no `at the hatch:` line. Assert zero console errors.

---

## Structure track — BACKLOG-479

### `game/src/ai/roles.ts` (extend, no new module)

```ts
export const COUNCIL_MIN_BANKS = 1;   // banked at least this to have a claim on the say
export const COUNCIL_PER_HEADS = 2;   // one voice per this many residents
export const COUNCIL_SEATS_MAX = 3;   // ...capped here
export function councilSeats(residents: number, eligible: number): number
export function zoneCouncil(residents: readonly ProviderCandidate[], zoneId: string): string[]
```

`councilSeats(residents, eligible)`: `eligible === 0 → 0`; else
`Math.min(COUNCIL_SEATS_MAX, Math.max(1, Math.floor(residents / COUNCIL_PER_HEADS)))`. Exported
separately so the seat rule is unit-testable without building candidate rows.

`zoneCouncil`: filter to `r.zoneId === zoneId`, count them as `residents`; filter those to
`foodBanked >= COUNCIL_MIN_BANKS` as the eligible pool; sort **`b.foodBanked - a.foodBanked ||
a.name.localeCompare(b.name)`** — byte-identical to `zoneProvider`'s comparator, which is what
guarantees the acceptance criterion "the provider is always seat 1"; slice to `councilSeats(...)`;
map to names.

Note the deliberate asymmetry with `zoneProvider`, and say so in the doc comment: `zoneProvider`
filters on `role === 'provider'` (the settled role), `zoneCouncil` does **not** — a seat is earned by
banking, not by holding the role, which is the whole content of the item. The provider still sorts to
seat 1 because it is by construction the top banker among role-holders and the role needs
`PROVIDER_BANKS = 3` while a seat needs 1.

### `game/src/ui/lenses.ts`
- `ZoneMapEntry` gains `council: string[]` (doc comment: BACKLOG-479, `[]` when the ground seats
  nobody — the fresh-park state).
- `zoneMapModel` gains a **trailing** `councils: Record<string, string[]> = {}` param; entry field
  `council: councils[id] ?? []`. Twelfth positional param — ugly, and deliberately not fixed here:
  BACKLOG-482 is queued to fold the standings and their plumbing. Do **not** refactor the signature
  this cycle; a 12-callsite churn in a two-track fire is how a clean track goes red.

### `game/src/scenes/WorldScene.ts`
- Import `zoneCouncil`.
- `private councilFor(zoneId: string): string[]` — same candidate-row build as `providerFor` (:2632),
  going through `this.roleOf(d.name)` so the two reads share one source. Extract the row build into a
  small `private zoneCandidates(): ProviderCandidate[]` and have **both** `providerFor` and
  `councilFor` call it — that is a two-line reuse, not a refactor, and it prevents the two reads from
  ever drifting.
- `private zoneCouncils(): Record<string, string[]>` — `for (const z of zoneChain())`, mirroring
  `zoneSpends()` / `zoneWorks()` exactly.
- `zoneMapEntries()` passes `this.zoneCouncils()` as the trailing argument.
- `drawZoneMap()` head-count line: `${e.count} 🦕${e.council.length ? `  👥${e.council.length}` : ''}`.
  Nothing else on the box changes; `boxH` stays 104.
- `bookRows()`: `council:` — for dino `d` in zone `z`, if `this.councilFor(z).includes(d.name)` then
  `` `👥 one of ${zoneById(z).name}'s ${n} voice${n === 1 ? '' : 's'}` `` else `undefined`. Compute
  the per-zone councils **once** outside the `.map` and read from it, so a 40-dino roster doesn't
  re-derive per row.
- `BookRow` gains `council?: string`; `bookLines` pushes it right after the `home` line (it is a
  standing about where you live, like `pioneer`), before `pioneer`.
- New dev hook beside `__foodBanked`:
  `(window as any).__creditBank = (name: string, n = 1) => { for (let i = 0; i < n; i++) this.creditFoodBank(name); return this.foodBanked[name]; };`
  and `(window as any).__councils = () => this.zoneCouncils();`

### Tests — structure track
`game/src/ai/roles.test.ts` (extend if present, else create): `councilSeats` table (0/1/2/4/6/9
residents), and `zoneCouncil` for every acceptance criterion — empty roster, all-zero banks, single
resident, 4 → top 2, 6 → capped 3, foreign-zone exclusion, zero-bank exclusion with seats free, the
alphabetical tie and its stability across repeated calls, and provider-is-seat-1 (build a roster where
one candidate clears `PROVIDER_BANKS` and assert `zoneProvider(...) === zoneCouncil(...)[0]`).

`ui/lenses.test.ts`: `zoneMapModel` called at the pre-479 arity yields `council: []` on every entry.

`tests/e2e/cycle-127-council.spec.ts`: boot → `__councils()` is empty for every zone (**the fresh-park
inertness criterion — this is the sharpest spec in the cycle**); then `__creditBank(<a bowl resident>, 2)`
→ `__zoneMap()` shows that zone's `council.length === 1` and `__zoneMapText()` contains `👥1`. Assert
zero console errors.

---

## Blockers

None known at plan time.

## Sequencing note for the Coder

Land 402 completely (module + test + lens field + scene field + e2e) and run `npx vitest run` before
starting 479. The two lens edits are in different symbols but the same file; a green checkpoint between
them makes a bisect trivial if the suite turns.
