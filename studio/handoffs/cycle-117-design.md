# Cycle 117 — Design

Milestone 9, "A ground that speaks for itself" — the cycle that finishes making the governance beat
**public**. Both tracks take the same private thing (a policy read by two hooks) and put it where someone
else can encounter it: the lore track in another dino's memory, the structure track on the player's lens.
Neither track adds state; neither track touches the save envelope. Both are pure reads over what 463 already
persists.

---

## Lore track — BACKLOG-470 · Word of how the ground decides

### Spec

A new pure module `game/src/world/policyword.ts`, the deliberate sibling of `world/providerword.ts` (453).
453 spreads *who* keeps a ground fed; 470 spreads *how* that ground has chosen to spend.

```ts
export function policyWordLine(speaker: string, zoneName: string, p: SpendPriority): string
export function spreadPolicyWord(
  store: MemoryStore,
  speaker: string,
  listener: string,
  priority: SpendPriority | null | undefined,
  zoneName: string,
): { store: MemoryStore; rumor: string | null }
```

- **The line.** Carries `RUMOR_MARK` (`'told me:'`) exactly like every rumor on the spine, so the listener's
  memory reads as heard-not-witnessed and `spreadGossip` will not re-spread it (1 hop, enforced by the
  existing `isFirsthand` check — 470 adds no new re-spread rule of its own).
  - `'feed'` → `` `${speaker} told me: ${zoneName} feeds its own first` ``
  - `'bank'` → `` `${speaker} told me: ${zoneName} banks against the winter` ``
  - No article before `zoneName`: zone display names already carry theirs (`The Grove`, `The Fernreach`,
    `Pocket Cretaceous`) — the same note `providerWordLine` carries.
- **The gates**, and only these two:
  - `speaker === listener` → null rumor, store untouched.
  - `priority` is `null`/`undefined` (the ground has never had a provider set a policy) → null rumor, store
    untouched. This is the same `null` seam `feedReserve`/`granaryDeferredForFeeding` already honour.
  - Explicitly **no** setter-exclusion rung (see the lore handoff: a policy is a public fact about a ground,
    not a compliment about a dino).
- **Placement in the meet cascade** (`WorldScene`, `npc_meet`): directly **below** the provider word and
  **above** the plenty word.
  `relief → warm → cold → grove → provider → policy → plenty → generic`.
  Rationale, matching the reasoning already written into that cascade: *who* keeps this ground fed outranks
  *how* it decides (a name beats a stance), and both outrank news of a *different* ground.
- **Ticker rung**, in the same else-if ladder that mirrors the cascade:
  `🏛️ ${b.name} heard from ${a.name} how ${zoneName} spends`.
- **Zone read**: the *speaker's* zone (`zoneOf(this.dinoZones, a.name, BOWL_ID)`) — already computed one
  line above for the provider word, so the policy rung costs one `spendPriorityFor` call and only when every
  earlier rung came up empty.
- **Dev hook**: `__spreadPolicyWord(a, b)`, mirroring the existing `__spreadProviderWord`.

### Acceptance criteria (lore)

1. `policyWordLine` returns a `RUMOR_MARK`-carrying line whose wording differs by priority — feed-first
   reads as feeding its own first, bank-first as banking against the winter — and neither wording inserts an
   article before the zone name.
2. `spreadPolicyWord` writes the rumor into the **listener's** memory (not the speaker's) and returns it.
3. `spreadPolicyWord` returns `{ rumor: null }` and leaves the store untouched when `priority` is `null`
   (ground with no policy stays silent) or when speaker and listener are the same dino.
4. The spread word is a rumor, not first-hand: a listener carrying it will not re-spread it onward
   (the 1-hop property, asserted through `spreadGossip`'s first-hand check).
5. In-game the beat lands on the meet cascade in the specified precedence — a meet where no earlier rung
   fires, on a ground with a policy, produces the policy rumor in the listener's memory and the
   `🏛️ … how … spends` line on the Park News ticker; a meet on a ground with no policy produces neither.

---

## Structure track — BACKLOG-468 · The provider's read on the lens

### Spec

The zone-map lens gains one column: how each ground has chosen to spend.

- `game/src/world/governance.ts` gains
  `export function spendGlyph(p: SpendPriority | null | undefined): string` → `'🍽️'` for `'feed'`, `'🏦'`
  for `'bank'`, `''` otherwise. Lives beside the type it reads, exactly as `declineGlyph` lives in
  `decline.ts` and `GRANARY_GLYPH` in `granary.ts`.
- `game/src/ui/lenses.ts`:
  - `ZoneMapEntry` gains `spend: SpendPriority | null` (documented like every other column, with the
    "`null` when unknown, so older callers/tests stay valid" note).
  - `zoneMapModel` gains a **ninth optional** parameter
    `spends: Record<string, SpendPriority | null> = {}`, mapped as `spends[id] ?? null`. Every existing
    3-through-8-argument caller and test must keep compiling and passing untouched — this is the same
    back-compat discipline 428/433/438/446/454/460 each used when they added their column.
- `game/src/scenes/WorldScene.ts`:
  - `private zoneSpends(): Record<string, SpendPriority | null>` — the mirror of `decliningZones()`: loop
    `zoneChain()`, value from the existing `spendPriorityFor(id)`. No new state, no new derivation.
  - `zoneMapEntries()` passes it as the ninth argument.
  - `drawZoneMap()` appends the glyph to the **existing** tier line, after the harvest tally:
    `` `${prosperityBadge(e.tier)}${decline}  🌾${e.harvested}${e.spend ? ` ${spendGlyph(e.spend)}` : ''}` ``.
    Box height (`boxH`) and every other line are untouched.
- `__zoneMap()` already returns the raw entries, so `spend` is e2e-readable with no new hook.

### Acceptance criteria (structure)

1. `spendGlyph` maps `'feed'` → 🍽️, `'bank'` → 🏦, and `null`/`undefined` → `''`.
2. `zoneMapModel` attaches `spend` per zone from the `spends` argument, and a zone absent from that map
   reads `null`.
3. Back-compat holds: calling `zoneMapModel` with the pre-468 argument lists (3-arg through 8-arg) still
   works and yields `spend === null` for every entry.
4. The glyph rides the **existing** tier line — the drawn label for a zone with a policy contains the badge
   after the harvest tally, and a zone with no policy adds no glyph and no extra line (box layout unchanged).
5. In-game the lens reads live: with the map lens open, `__zoneMap()` reports each zone's current
   `spendPriorityFor` value, and a zone whose provider has set a policy shows the matching glyph on its box
   while a policy-less zone shows none.

---

## Quality bar (both tracks)

`npm run build` clean · `npx vitest run` green · `npx --yes kill-port 5173` then `npx playwright test` green
· `@mlc-ai/web-llm` imported only under `game/src/ai/` · **no save-envelope change on either track** (any
diff in save shape this cycle is a bug, not an addition) · logic pure and Node-testable, Phaser glue thin.
